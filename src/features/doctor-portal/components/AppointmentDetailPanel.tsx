"use client";

import { useState } from "react";
import { X, CalendarDays, Clock, Tag, MapPin, User } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import { updateAppointmentStatus, getComputedAppointmentStatus, saveNotification } from "@/lib/mock-data/appointments";
import RescheduleModal from "./RescheduleModal";

type Props = {
  appointment: Appointment | null;
  onClose: () => void;
  onRefresh: () => void;
};

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  upcoming:  "bg-blue-50 text-blue-700 ring-blue-200",
  pending:   "bg-amber-50 text-amber-700 ring-amber-200",
  cancelled: "bg-stone-100 text-stone-600 ring-stone-200",
  completed: "bg-stone-100 text-stone-700 ring-stone-200",
  missed:    "bg-red-100 text-red-800 ring-red-300",
};

export default function AppointmentDetailPanel({ appointment, onClose, onRefresh }: Props) {
  const [showReschedule, setShowReschedule] = useState(false);

  if (!appointment) return null;

  const computedStatus = getComputedAppointmentStatus(appointment);

  const handleStatusChange = (status: Appointment["status"]) => {
    updateAppointmentStatus(appointment.id, status);
    saveNotification({
      appointmentId: appointment.id,
      patientName: appointment.patient.name,
      message: `Your appointment with ${appointment.clinician} was marked as ${status}.`
    });
    onRefresh();
    onClose();
  };

  const handleRescheduleDone = () => {
    setShowReschedule(false);
    onRefresh();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {!showReschedule && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Side panel */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--line)] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--ink)]">Appointment Details</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-[var(--muted)] hover:bg-stone-100 hover:text-[var(--ink)]">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Patient */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xl font-bold text-[var(--brand)]">
              {appointment.patient.initials}
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--ink)]">{appointment.patient.name}</p>
              <p className="text-sm text-[var(--muted)]">Age {appointment.patient.age}</p>
            </div>
          </div>

          {/* Status badge */}
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset capitalize mb-6 ${STATUS_STYLES[computedStatus]}`}>
            {computedStatus}
          </span>

          {/* Details grid */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CalendarDays size={16} className="mt-0.5 shrink-0 text-[var(--muted)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Date & Time</p>
                <p className="mt-0.5 font-medium text-[var(--ink)]">{formatDate(appointment.startsAt)}</p>
                <p className="text-sm text-[var(--muted)]">{formatTime(appointment.startsAt)} · {appointment.durationMinutes} min</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User size={16} className="mt-0.5 shrink-0 text-[var(--muted)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Reason</p>
                <p className="mt-0.5 font-medium text-[var(--ink)]">{appointment.reason}</p>
              </div>
            </div>

            {appointment.type && (
              <div className="flex items-start gap-3">
                <Tag size={16} className="mt-0.5 shrink-0 text-[var(--muted)]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Type</p>
                  <span className="mt-0.5 inline-block rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                    {appointment.type}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--muted)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Room</p>
                <p className="mt-0.5 font-medium text-[var(--ink)]">{appointment.room}</p>
              </div>
            </div>

            {appointment.updatedAt && (
              <div className="flex items-start gap-3">
                <Clock size={16} className="mt-0.5 shrink-0 text-[var(--muted)]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Last Updated</p>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">{formatDate(appointment.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions footer */}
        <div className="border-t border-[var(--line)] p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Actions</p>
          <div className="flex flex-col gap-2">
            {computedStatus === "pending" && (
              <>
                <button onClick={() => handleStatusChange("confirmed")} className="w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-deep)]">
                  Confirm Appointment
                </button>
                <button onClick={() => handleStatusChange("cancelled")} className="w-full rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-stone-50">
                  Decline
                </button>
              </>
            )}

            {computedStatus === "upcoming" && (
              <>
                <button onClick={() => setShowReschedule(true)} className="w-full rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-stone-50">
                  Reschedule
                </button>
                <button onClick={() => handleStatusChange("cancelled")} className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100">
                  Cancel Appointment
                </button>
              </>
            )}

            {computedStatus === "confirmed" && (
              <>
                <button onClick={() => handleStatusChange("completed")} className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
                  Mark as Completed
                </button>
                <button onClick={() => handleStatusChange("missed")} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">
                  Mark as Missed
                </button>
              </>
            )}

            {(computedStatus === "completed" || computedStatus === "cancelled" || computedStatus === "missed") && (
              <p className="text-sm italic text-[var(--muted)]">
                This appointment is {computedStatus} — no further actions available.
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Reschedule modal — rendered on top of the panel */}
      {showReschedule && (
        <RescheduleModal
          appointment={appointment}
          onClose={() => setShowReschedule(false)}
          onDone={handleRescheduleDone}
        />
      )}
    </>
  );
}
