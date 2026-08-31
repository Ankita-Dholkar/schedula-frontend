"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Clock, RotateCcw } from "lucide-react";
import type { DoctorAvailability, DaySchedule } from "@/types/availability";
import { generateSlots, saveDoctorAvailability } from "@/lib/mock-data/availability";
import Toast from "@/features/auth/components/Toast";

type Props = {
  doctorId: string;
  initialAvailability: DoctorAvailability;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const DURATIONS = [15, 30, 45, 60] as const;

const dayShort: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export default function AvailabilityManager({ doctorId, initialAvailability }: Props) {
  const [availability, setAvailability] = useState<DoctorAvailability>(initialAvailability);
  
  const firstActiveDay = initialAvailability.schedule.find((s) => s.isActive)?.day || "Monday";
  const [selectedDay, setSelectedDay] = useState<string>(firstActiveDay);
  
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const currentDaySchedule = availability.schedule.find((s) => s.day === selectedDay)!;

  // Save to localStorage whenever availability changes (including on initial mount).
  // This ensures the booking page always reads up-to-date doctor slots.
  useEffect(() => {
    saveDoctorAvailability(availability);
  }, [availability]);

  // Toggle a day on/off
  const toggleDay = (day: string) => {
    setAvailability((prev) => ({
      ...prev,
      schedule: prev.schedule.map((s) =>
        s.day === day
          ? { ...s, isActive: !s.isActive, slots: !s.isActive ? generateSlots(doctorId, day, s.startTime, s.endTime, s.slotDuration) : [] }
          : s
      ),
    }));
  };

  // Update a field (startTime, endTime, slotDuration) for the selected day
  const updateDayField = (field: keyof DaySchedule, value: string | number) => {
    setAvailability((prev) => ({
      ...prev,
      schedule: prev.schedule.map((s) =>
        s.day === selectedDay ? { ...s, [field]: value } : s
      ),
    }));
  };

  // Regenerate slots for the selected day based on current settings
  const regenerateSlots = () => {
    const s = currentDaySchedule;
    if (!s.startTime || !s.endTime || s.startTime >= s.endTime) {
      setToast({ message: "End time must be after start time.", type: "error" });
      return;
    }
    const newSlots = generateSlots(doctorId, selectedDay, s.startTime, s.endTime, s.slotDuration);
    setAvailability((prev) => ({
      ...prev,
      schedule: prev.schedule.map((d) =>
        d.day === selectedDay ? { ...d, slots: newSlots } : d
      ),
    }));
  };

  // Delete a single slot
  const deleteSlot = (slotId: string) => {
    setAvailability((prev) => ({
      ...prev,
      schedule: prev.schedule.map((d) =>
        d.day === selectedDay
          ? { ...d, slots: d.slots.filter((sl) => sl.id !== slotId) }
          : d
      ),
    }));
  };

  const [newSlotTime, setNewSlotTime] = useState("");

  // Add a single custom slot
  const addSlot = () => {
    if (!newSlotTime) return;

    const [h, m] = newSlotTime.split(":").map(Number);
    const duration = currentDaySchedule.slotDuration;
    const endTotalMins = h * 60 + m + duration;
    const endH = Math.floor(endTotalMins / 60);
    const endM = endTotalMins % 60;
    const endStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    const newSlot = {
      id: `${doctorId}_${selectedDay}_${newSlotTime}`,
      start: newSlotTime,
      end: endStr,
      isBooked: false,
    };

    setAvailability((prev) => {
      const dayData = prev.schedule.find((d) => d.day === selectedDay);
      if (dayData?.slots.some((s) => s.start === newSlotTime)) {
        setToast({ message: "Slot already exists", type: "error" });
        return prev;
      }
      return {
        ...prev,
        schedule: prev.schedule.map((d) => {
          if (d.day !== selectedDay) return d;
          const newSlots = [...d.slots, newSlot].sort((a, b) => a.start.localeCompare(b.start));
          return { ...d, slots: newSlots };
        }),
      };
    });
    setNewSlotTime("");
  };

  // Save all availability (manual confirmation — data already auto-saved via useEffect)
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    saveDoctorAvailability(availability);
    setIsSaving(false);
    setToast({ message: "Availability saved successfully!", type: "success" });
  };

  const activeDays = availability.schedule.filter((s) => s.isActive);
  const totalSlots = activeDays.reduce((acc, d) => acc + d.slots.length, 0);

  return (
    <section className="rounded-xl border border-[var(--line)] bg-white p-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-[var(--ink)]">Appointment Availability</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Configure your weekly recurring schedule. Patients will only see your available slots.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-deep)] disabled:opacity-70"
        >
          {isSaving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Plus size={15} />
          )}
          {isSaving ? "Saving..." : "Save Schedule"}
        </button>
      </div>

      {/* Summary chips */}
      <div className="mb-5 flex items-center gap-2 text-xs text-[var(--muted)]">
        <Clock size={13} />
        <span>
          <strong className="text-[var(--ink)]">{activeDays.length}</strong> active days ·{" "}
          <strong className="text-[var(--ink)]">{totalSlots}</strong> total slots
        </span>
      </div>

      {/* Day Toggle Chips */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Working Days
        </p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const sched = availability.schedule.find((s) => s.day === day)!;
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  sched.isActive
                    ? "bg-[var(--brand)] text-white"
                    : "border border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                }`}
              >
                {dayShort[day]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Configuration Panel */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-5">
        {/* Day Tabs */}
        <div className="mb-5 flex gap-1 overflow-x-auto">
          {availability.schedule
            .filter((s) => s.isActive)
            .map((s) => (
              <button
                key={s.day}
                type="button"
                onClick={() => setSelectedDay(s.day)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  selectedDay === s.day
                    ? "bg-white text-[var(--brand)] shadow-sm border border-[var(--line)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {s.day}{" "}
                <span className="ml-1 opacity-60">({s.slots.length})</span>
              </button>
            ))}
          {activeDays.length === 0 && (
            <p className="text-xs text-[var(--muted)]">
              Toggle at least one working day above.
            </p>
          )}
        </div>

        {currentDaySchedule?.isActive && (
          <>
            {/* Time & Duration Settings */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--ink)]">
                  Start Time
                </label>
                <input
                  type="time"
                  value={currentDaySchedule.startTime}
                  onChange={(e) => updateDayField("startTime", e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--ink)]">
                  End Time
                </label>
                <input
                  type="time"
                  value={currentDaySchedule.endTime}
                  onChange={(e) => updateDayField("endTime", e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--ink)]">
                  Slot Duration
                </label>
                <select
                  value={currentDaySchedule.slotDuration}
                  onChange={(e) => updateDayField("slotDuration", Number(e.target.value))}
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} minutes
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions: Regenerate & Add Single Slot */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={regenerateSlots}
                className="flex items-center gap-2 rounded-lg border border-[var(--brand)] px-4 py-2 text-xs font-medium text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white"
              >
                <RotateCcw size={13} />
                Generate Slots for {selectedDay}
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={newSlotTime}
                  onChange={(e) => setNewSlotTime(e.target.value)}
                  className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-[var(--ink)] outline-none focus:border-[var(--brand)]"
                />
                <button
                  type="button"
                  onClick={addSlot}
                  disabled={!newSlotTime}
                  className="flex items-center gap-1 rounded-lg bg-[var(--ink)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
                >
                  <Plus size={13} />
                  Add
                </button>
              </div>
            </div>

            {/* Slot Grid */}
            {currentDaySchedule.slots.length > 0 ? (
              <div className="mt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {currentDaySchedule.slots.length} slots for {selectedDay}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                  {currentDaySchedule.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`group relative flex items-center justify-center rounded-lg border px-2 py-2 text-xs font-medium transition ${
                        slot.isBooked
                          ? "border-stone-200 bg-stone-100 text-stone-400 line-through"
                          : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand)]"
                      }`}
                    >
                      {slot.start}
                      {!slot.isBooked && (
                        <button
                          type="button"
                          onClick={() => deleteSlot(slot.id)}
                          className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                          aria-label={`Remove slot ${slot.start}`}
                        >
                          <Trash2 size={9} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed border-[var(--line)] py-8 text-center">
                <Clock size={24} className="mx-auto mb-2 text-[var(--line)]" />
                <p className="text-xs text-[var(--muted)]">
                  No slots yet. Set your hours and click{" "}
                  <strong>Generate Slots</strong>.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
