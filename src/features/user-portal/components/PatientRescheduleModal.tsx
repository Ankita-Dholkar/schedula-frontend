"use client";

import { useState, useEffect } from "react";
import { X, CalendarDays, Clock, AlertCircle } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { DoctorAvailability } from "@/types/availability";
import { useAppDispatch } from "@/store/hooks";
import { rescheduleApt, addDoctorNotification } from "@/store/slices/appointmentsSlice";
import { mockDoctors } from "@/lib/mock-data/doctors";
import { loadPersistedAvailability } from "@/lib/mock-data/availability";

type Props = {
  appointment: Appointment;
  onClose: () => void;
  onDone: () => void;
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));

/** Get unbooked, valid future slots for a given date from doctor's persisted availability */
function getAvailableSlots(avail: DoctorAvailability | null, dateStr: string): string[] {
  if (!avail || !avail.schedule) return [];
  const schedule = avail.schedule.find((s) => s.date === dateStr);
  if (!schedule || !schedule.isActive || !schedule.slots?.length) return [];

  const now = new Date();
  return schedule.slots
    .filter((slot) => {
      if (slot.isBooked) return false;
      const [sh, sm] = slot.start.split(":").map(Number);
      const [y, mo, d] = dateStr.split("-").map(Number);
      const slotTime = new Date(y, mo - 1, d, sh, sm, 0);
      return slotTime > now;
    })
    .map((slot) => slot.start)
    .sort();
}

/** Get available dates (active, future, at least one unbooked slot) from doctor's availability */
function getAvailableDates(avail: DoctorAvailability | null): string[] {
  if (!avail || !avail.schedule) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return avail.schedule
    .filter((s) => {
      if (!s.isActive || !s.slots?.length) return false;
      const scheduleDate = new Date(s.date + "T00:00:00");
      return scheduleDate >= today && s.slots.some((sl) => !sl.isBooked);
    })
    .map((s) => s.date)
    .sort();
}

/** Resolve a doctor's ID from their name by searching both static and registered doctors */
function resolveDoctorId(clinicianName: string): string | null {
  // Search in static mock doctors first
  const found = mockDoctors.find(
    (d) => d.name.toLowerCase() === clinicianName.toLowerCase()
  );
  if (found) return found.id;

  // Search in registered doctors (localStorage)
  try {
    const stored = localStorage.getItem("registeredUsers");
    if (stored) {
      const users: Array<Record<string, unknown>> = JSON.parse(stored);
      const registeredDoc = users.find(
        (u) =>
          u.role === "doctor" &&
          typeof u.name === "string" &&
          u.name.toLowerCase() === clinicianName.toLowerCase()
      );
      if (registeredDoc) return registeredDoc.id as string;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export default function PatientRescheduleModal({ appointment, onClose, onDone }: Props) {
  const dispatch = useAppDispatch();
  const today = new Date().toISOString().split("T")[0];

  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [doctorFound, setDoctorFound] = useState(true);

  // Resolve doctor ID from clinician name and load availability
  useEffect(() => {
    const doctorId = resolveDoctorId(appointment.clinician);
    if (!doctorId) {
      setDoctorFound(false);
      return;
    }
    const avail = loadPersistedAvailability(doctorId);
    setAvailability(avail);
    const dates = getAvailableDates(avail);
    setAvailableDates(dates);
    // Pre-select first available date if today has no slots
    if (dates.length > 0 && !dates.includes(today)) {
      setSelectedDate(dates[0]);
    }
  }, [appointment.clinician, today]);

  const availableSlots = getAvailableSlots(availability, selectedDate);
  const hasConfiguredAvailability = availability && availability.schedule.length > 0;

  const handleConfirm = async () => {
    if (!selectedTime) {
      setError("Please select a time slot.");
      return;
    }
    setError("");
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    const newStartsAt = `${selectedDate}T${selectedTime}:00`;

    dispatch(rescheduleApt({ id: appointment.id, newStartsAt }));
    dispatch(
      addDoctorNotification({
        appointmentId: appointment.id,
        patientName: appointment.patient.name,
        message: `${appointment.patient.name} has rescheduled their appointment to ${formatDate(newStartsAt)} at ${selectedTime}.`,
      })
    );

    setIsSaving(false);
    onDone();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-[70] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--line)] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--canvas)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)]/10">
              <CalendarDays size={16} className="text-[var(--brand)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--ink)]">Reschedule Appointment</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--muted)] transition hover:bg-stone-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          {/* Current appointment summary */}
          <div className="mb-5 rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-3 text-sm">
            <p className="font-semibold text-[var(--ink)]">{appointment.clinician}</p>
            <p className="text-[var(--muted)]">{appointment.reason}</p>
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              Current:{" "}
              <span className="font-medium text-[var(--ink)]">
                {formatDate(appointment.startsAt)}
              </span>
            </p>
          </div>

          {/* Doctor not found warning */}
          {!doctorFound && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-700">
                We couldn&apos;t find this doctor&apos;s schedule. You can still select a date and time manually.
              </p>
            </div>
          )}

          {/* Date picker */}
          <div className="mb-4">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              <CalendarDays size={12} /> New Date
            </label>

            {hasConfiguredAvailability && availableDates.length > 0 ? (
              /* Show available dates as chips */
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                {availableDates.map((date) => {
                  const d = new Date(date + "T12:00:00");
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => { setSelectedDate(date); setSelectedTime(""); }}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        selectedDate === date
                          ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                          : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                      }`}
                    >
                      {d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Fallback: free date picker */
              <input
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
                className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
              />
            )}
          </div>

          {/* Time slots */}
          <div className="mb-5">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              <Clock size={12} /> Available Time Slots
            </label>

            {hasConfiguredAvailability ? (
              availableSlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-0.5">
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
                  <p className="mt-1 text-xs text-amber-600">Please select a different date above.</p>
                </div>
              )
            ) : (
              /* No availability configured — open time grid 9am–5pm */
              <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto">
                {Array.from({ length: 17 }, (_, i) => {
                  const h = 9 + Math.floor(i / 2);
                  const m = i % 2 === 0 ? "00" : "30";
                  return `${String(h).padStart(2, "0")}:${m}`;
                })
                  .filter((slot) => {
                    if (selectedDate !== today) return true;
                    const [sh, sm] = slot.split(":").map(Number);
                    const now = new Date();
                    return sh > now.getHours() || (sh === now.getHours() && sm > now.getMinutes());
                  })
                  .map((slot) => (
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

            {error && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--line)] py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSaving || !selectedTime}
              className="flex-1 rounded-lg bg-[var(--brand)] py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)] disabled:opacity-60"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving…
                </span>
              ) : (
                "Confirm Reschedule"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
