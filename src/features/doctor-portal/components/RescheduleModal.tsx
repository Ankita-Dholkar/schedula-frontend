"use client";

import { useState } from "react";
import { X, CalendarDays, Clock } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import { rescheduleAppointment, saveNotification } from "@/lib/mock-data/appointments";

type Props = {
  appointment: Appointment;
  onClose: () => void;
  onDone: () => void;
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

// Generate 30-min slots from 09:00 to 17:00
function generateTimeSlots() {
  const slots: string[] = [];
  let h = 9;
  let m = 0;
  while (h < 17 || (h === 17 && m === 0)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 30;
    if (m >= 60) { h++; m = 0; }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

export default function RescheduleModal({ appointment, onClose, onDone }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

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
      <div className="fixed inset-0 z-60 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-70 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-2xl">
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
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((slot) => (
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
            disabled={isSaving}
            className="flex-1 rounded-lg bg-[var(--brand)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-deep)] disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Confirm Reschedule"}
          </button>
        </div>
      </div>
    </>
  );
}
