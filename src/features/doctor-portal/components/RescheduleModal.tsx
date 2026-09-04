"use client";

import { useState, useEffect } from "react";
import { X, CalendarDays, Clock } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import { rescheduleAppointment, saveNotification } from "@/lib/mock-data/appointments";
import { loadPersistedAvailability } from "@/lib/mock-data/availability";
import type { DoctorAvailability } from "@/types/availability";

type Props = {
  appointment: Appointment;
  onClose: () => void;
  onDone: () => void;
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

/** Get available (unbooked, future) slots for a given date from persisted availability */
function getSlotsForDate(avail: DoctorAvailability | null, dateStr: string): string[] {
  if (!avail || !avail.schedule) return [];
  const schedule = avail.schedule.find((s) => s.date === dateStr);
  if (!schedule || !schedule.isActive || !schedule.slots?.length) return [];

  const now = new Date();
  return schedule.slots
    .filter((slot) => {
      if (slot.isBooked) return false;
      // Only show future slots
      const [sh, sm] = slot.start.split(":").map(Number);
      const [y, mo, d] = dateStr.split("-").map(Number);
      const slotTime = new Date(y, mo - 1, d, sh, sm, 0);
      return slotTime > now;
    })
    .map((slot) => slot.start)
    .sort();
}

export default function RescheduleModal({ appointment, onClose, onDone }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);

  // Load doctor's availability from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("loggedInUser");
      if (!raw) return;
      const user = JSON.parse(raw);
      const avail = loadPersistedAvailability(user.id);
      setAvailability(avail);
    } catch { /* ignore */ }
  }, []);

  const availableSlots = getSlotsForDate(availability, selectedDate);
  const hasAvailability = availability && availability.schedule.length > 0;

  const handleConfirm = async () => {
    if (!selectedTime) { setError("Please select a time slot."); return; }
    setError("");
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    const newStartsAt = `${selectedDate}T${selectedTime}:00`;
    rescheduleAppointment(appointment.id, newStartsAt);

    saveNotification({
      appointmentId: appointment.id,
      patientName: appointment.patient.name,
      message: `Your appointment has been rescheduled to ${formatDate(newStartsAt)} at ${selectedTime}.`,
    });

    setIsSaving(false);
    onDone();
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[70] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--ink)]">Reschedule Appointment</h3>
          <button onClick={onClose} className="rounded-full p-1 text-[var(--muted)] hover:bg-stone-100">
            <X size={18} />
          </button>
        </div>

        {/* Patient info */}
        <div className="mb-5 rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-3 text-sm">
          <p className="font-medium text-[var(--ink)]">{appointment.patient.name}</p>
          <p className="text-[var(--muted)]">{appointment.reason}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Current: {formatDate(appointment.startsAt)}</p>
        </div>

        {/* Date picker */}
        <div className="mb-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            <CalendarDays size={13} /> New Date
          </label>
          <input
            type="date"
            min={today}
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
            className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>

        {/* Time slots */}
        <div className="mb-5">
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            <Clock size={13} /> Select Time Slot
          </label>

          {hasAvailability ? (
            availableSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-0.5">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`rounded-lg border py-2 text-xs font-medium transition ${
                      selectedTime === slot
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 text-center">
                <p className="text-sm font-medium text-amber-700">No available slots on this date</p>
                <p className="mt-1 text-xs text-amber-600">Please select a different date or update your availability schedule.</p>
              </div>
            )
          ) : (
            // No availability configured — show open time grid
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {Array.from({ length: 17 }, (_, i) => {
                const h = 9 + Math.floor(i / 2);
                const m = i % 2 === 0 ? "00" : "30";
                return `${String(h).padStart(2, "0")}:${m}`;
              }).filter((slot) => {
                // For today, hide past slots
                if (selectedDate !== today) return true;
                const [sh, sm] = slot.split(":").map(Number);
                const now = new Date();
                return sh > now.getHours() || (sh === now.getHours() && sm > now.getMinutes());
              }).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTime(slot)}
                  className={`rounded-lg border py-2 text-xs font-medium transition ${
                    selectedTime === slot
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--line)] py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSaving || !selectedTime}
            className="flex-1 rounded-lg bg-[var(--brand)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-deep)] disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Confirm Reschedule"}
          </button>
        </div>
      </div>
    </>
  );
}
