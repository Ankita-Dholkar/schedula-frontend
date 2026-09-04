"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Clock, RotateCcw } from "lucide-react";
import type { DoctorAvailability, DateSchedule } from "@/types/availability";
import { generateSlots, saveDoctorAvailability } from "@/lib/mock-data/availability";
import Toast from "@/features/auth/components/Toast";

type Props = {
  doctorId: string;
  initialAvailability: DoctorAvailability;
};

const DURATIONS = [15, 30, 45, 60] as const;

export default function AvailabilityManager({ doctorId, initialAvailability }: Props) {
  // Migrate old 'day'-keyed data to new 'date'-keyed format by starting fresh
  const sanitize = (avail: DoctorAvailability): DoctorAvailability => {
    const hasOldFormat = avail.schedule.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => typeof s.day !== "undefined" && typeof s.date === "undefined"
    );
    if (hasOldFormat) {
      return { doctorId: avail.doctorId, schedule: [], offDates: [] };
    }
    // Also drop any entries without slots (leftover inactive placeholders)
    return { ...avail, schedule: avail.schedule.filter((s) => s.isActive && s.slots.length > 0) };
  };

  const [availability, setAvailability] = useState<DoctorAvailability>(() =>
    sanitize(initialAvailability)
  );
  
  // Use local date (not UTC) to avoid timezone off-by-one-day
  const today = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [newSlotTime, setNewSlotTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Find or create schedule for the selected date
  const currentDaySchedule = availability.schedule.find((s) => s.date === selectedDate) || {
    date: selectedDate,
    isActive: true,
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
    slots: [],
  };

  // Persist whenever availability changes
  useEffect(() => {
    saveDoctorAvailability(availability);
  }, [availability]);

  // Update a field (startTime, endTime, slotDuration) for the selected date
  const updateDayField = (field: keyof DateSchedule, value: string | number) => {
    setAvailability((prev) => {
      const exists = prev.schedule.some((s) => s.date === selectedDate);
      const newSchedule = exists
        ? prev.schedule.map((s) => (s.date === selectedDate ? { ...s, [field]: value } : s))
        : [...prev.schedule, { ...currentDaySchedule, [field]: value }];
      return { ...prev, schedule: newSchedule };
    });
  };

  // Regenerate slots for the selected date based on current settings
  const regenerateSlots = () => {
    const s = currentDaySchedule;
    if (!s.startTime || !s.endTime || s.startTime >= s.endTime) {
      setToast({ message: "End time must be after start time.", type: "error" });
      return;
    }
    const newSlots = generateSlots(doctorId, selectedDate, s.startTime, s.endTime, s.slotDuration);
    setAvailability((prev) => {
      const exists = prev.schedule.some((d) => d.date === selectedDate);
      const newSchedule = exists
        ? prev.schedule.map((d) => (d.date === selectedDate ? { ...d, slots: newSlots, isActive: true } : d))
        : [...prev.schedule, { ...s, slots: newSlots, isActive: true }];
      return { ...prev, schedule: newSchedule };
    });
  };

  // Delete a single slot
  const deleteSlot = (slotId: string) => {
    setAvailability((prev) => ({
      ...prev,
      schedule: prev.schedule.map((d) =>
        d.date === selectedDate
          ? { ...d, slots: d.slots.filter((sl) => sl.id !== slotId) }
          : d
      ),
    }));
  };

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
      id: `${doctorId}_${selectedDate}_${newSlotTime}`,
      start: newSlotTime,
      end: endStr,
      isBooked: false,
    };

    setAvailability((prev) => {
      const dayData = prev.schedule.find((d) => d.date === selectedDate);
      if (dayData?.slots.some((s) => s.start === newSlotTime)) {
        setToast({ message: "Slot already exists", type: "error" });
        return prev;
      }
      const exists = prev.schedule.some((d) => d.date === selectedDate);
      const newSchedule = exists
        ? prev.schedule.map((d) => {
            if (d.date !== selectedDate) return d;
            const newSlots = [...d.slots, newSlot].sort((a, b) => a.start.localeCompare(b.start));
            return { ...d, slots: newSlots, isActive: true };
          })
        : [...prev.schedule, { ...currentDaySchedule, slots: [newSlot], isActive: true }];

      return { ...prev, schedule: newSchedule };
    });
    setNewSlotTime("");
  };
  
  // Remove the whole date from schedule (make inactive or remove entirely)
  const removeDate = (dateToRemove: string) => {
    setAvailability((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((s) => s.date !== dateToRemove),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    saveDoctorAvailability(availability);
    setIsSaving(false);
    setToast({ message: "Availability saved successfully!", type: "success" });
  };

  const activeDays = availability.schedule.filter((s) => s.isActive && s.slots.length > 0);
  const totalSlots = activeDays.reduce((acc, d) => acc + d.slots.length, 0);

  return (
    <section id="availability" className="rounded-xl border border-[var(--line)] bg-white p-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-[var(--ink)]">Appointment Availability</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Configure your schedule for specific dates. Patients will only see these available slots.
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

      <div className="mb-5 flex items-center gap-2 text-xs text-[var(--muted)]">
        <Clock size={13} />
        <span>
          <strong className="text-[var(--ink)]">{activeDays.length}</strong> active dates ·{" "}
          <strong className="text-[var(--ink)]">{totalSlots}</strong> total slots
        </span>
      </div>

      {/* Select Date via Calendar */}
      <div className="mb-6">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Select Date to Manage
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]"
          />
        </div>
      </div>

      {/* Date Configuration Panel */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-5">
        <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--ink)]">
            Schedule for {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
            {availability.schedule.some((s) => s.date === selectedDate) && (
              <button
                type="button"
                onClick={() => removeDate(selectedDate)}
                className="text-xs text-red-500 hover:underline"
              >
                Remove all slots for this date
              </button>
            )}
        </div>

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
            Generate Slots
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
              {currentDaySchedule.slots.length} slots for {selectedDate}
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
      </div>
    </section>
  );
}
