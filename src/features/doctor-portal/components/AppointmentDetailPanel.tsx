"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X, CalendarDays, Clock, Tag, MapPin, User, CreditCard,
  Video, Building2, Wifi,
} from "lucide-react";
import type { Appointment } from "@/types/appointment";
import { CONSULTATION_FEE } from "@/types/payment";
import { updateAppointmentStatus, getComputedAppointmentStatus, saveNotification } from "@/lib/mock-data/appointments";
import type { ComputedStatus } from "@/lib/mock-data/appointments";
import RescheduleCalendarModal from "./RescheduleCalendarModal";
import PatientRiskSnapshot from "./PatientRiskSnapshot";

type Props = {
  appointment: Appointment | null;
  appointments?: Appointment[];   // full list for conflict checks in the calendar
  onClose: () => void;
  onRefresh: () => void;
};

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

const STATUS_STYLES: Record<string, string> = {
  confirmed:       "bg-emerald-50 text-emerald-700 ring-emerald-200",
  upcoming:        "bg-blue-50 text-blue-700 ring-blue-200",
  "starting-soon": "bg-orange-50 text-orange-700 ring-orange-200",
  live:            "bg-green-50 text-green-700 ring-green-200",
  pending:         "bg-amber-50 text-amber-700 ring-amber-200",
  cancelled:       "bg-stone-100 text-stone-600 ring-stone-200",
  completed:       "bg-stone-100 text-stone-700 ring-stone-200",
  missed:          "bg-red-100 text-red-800 ring-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed:       "Confirmed",
  upcoming:        "Upcoming",
  "starting-soon": "Starting Soon",
  live:            "Live",
  pending:         "Pending",
  cancelled:       "Cancelled",
  completed:       "Completed",
  missed:          "Missed",
};

export default function AppointmentDetailPanel({ appointment, appointments = [], onClose, onRefresh }: Props) {
  const [showReschedule, setShowReschedule] = useState(false);
  const router = useRouter();

  if (!appointment) return null;

  const computedStatus = getComputedAppointmentStatus(appointment) as ComputedStatus;
  const isOnline = appointment.appointmentMode === "online";
  const canStart = isOnline && (computedStatus === "starting-soon" || computedStatus === "live");

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
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-[var(--ink)]">Appointment Details</h2>
            {/* Consultation mode badge */}
            {isOnline ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
                <Video size={10} /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-200">
                <Building2 size={10} /> In-person
              </span>
            )}
          </div>
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
            {STATUS_LABELS[computedStatus] ?? computedStatus}
          </span>

          {/* Live indicator */}
          {computedStatus === "live" && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <p className="text-sm font-semibold text-green-700">Consultation is live now</p>
            </div>
          )}

          {/* Starting soon banner */}
          {computedStatus === "starting-soon" && (
            <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <p className="text-sm font-semibold text-orange-700">⏰ Consultation starts soon</p>
              <p className="text-xs text-orange-600 mt-0.5">You can start the consultation when ready.</p>
            </div>
          )}

          {/* Patient Risk Snapshot */}
          <PatientRiskSnapshot appointment={appointment} />

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

            {/* Location — only for in-person */}
            {!isOnline && (appointment.location || appointment.room) && (
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--muted)]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Clinic / Location</p>
                  <p className="mt-0.5 font-medium text-[var(--ink)]">
                    {appointment.location?.name ?? "Clinic"}
                  </p>
                  {appointment.location?.address && (
                    <p className="text-xs text-[var(--muted)] mt-0.5">{appointment.location.address}</p>
                  )}
                  {appointment.room && (
                    <p className="text-xs text-[var(--muted)] mt-0.5">{appointment.room}</p>
                  )}
                </div>
              </div>
            )}

            {/* Online badge for virtual appointments */}
            {isOnline && (
              <div className="flex items-start gap-3">
                <Video size={16} className="mt-0.5 shrink-0 text-[var(--muted)]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Consultation Mode</p>
                  <p className="mt-0.5 font-medium text-[var(--ink)]">Online / Video Consultation</p>
                </div>
              </div>
            )}

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

          {/* ── Payment Details ─────────────────────────────── */}
          <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard size={14} className="text-[var(--brand)]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Payment Details
              </p>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Consultation Fee</span>
                <span className="font-bold text-[var(--ink)]">
                  ₹{appointment.consultationFee ?? CONSULTATION_FEE}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Payment Status</span>
                {appointment.paymentStatus === "paid" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    Paid
                  </span>
                ) : appointment.paymentStatus === "failed" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                    Failed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                    Pending
                  </span>
                )}
              </div>
              {appointment.paymentStatus === "paid" && appointment.transactionId && (
                <div className="flex items-center justify-between border-t border-[var(--line)] pt-2.5">
                  <span className="text-[var(--muted)]">Transaction ID</span>
                  <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                    {appointment.transactionId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions footer */}
        <div className="border-t border-[var(--line)] p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Actions</p>
          <div className="flex flex-col gap-2">

            {/* ── Online: Start Consultation button ── */}
            {canStart && (
              <button
                onClick={() => router.push(`/consultation/${appointment.id}`)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 active:scale-[0.98]"
              >
                <Wifi size={16} />
                {computedStatus === "live" ? "Join Live Consultation" : "Start Consultation"}
              </button>
            )}

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

            {(computedStatus === "confirmed" || computedStatus === "starting-soon" || computedStatus === "live") && !canStart && (
              <>
                <button onClick={() => setShowReschedule(true)} className="w-full rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-stone-50">
                  Reschedule
                </button>
                {/* In-person: manual completion */}
                {!isOnline && (
                  <button onClick={() => handleStatusChange("completed")} className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
                    Mark as Completed
                  </button>
                )}
                {!isOnline && (
                  <button onClick={() => handleStatusChange("missed")} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">
                    Mark as Missed
                  </button>
                )}
                <button onClick={() => handleStatusChange("cancelled")} className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100">
                  Cancel Appointment
                </button>
              </>
            )}

            {(computedStatus === "completed" || computedStatus === "cancelled" || computedStatus === "missed") && (
              <p className="text-sm italic text-[var(--muted)]">
                This appointment is {STATUS_LABELS[computedStatus]?.toLowerCase() ?? computedStatus} — no further actions available.
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Reschedule Calendar — rendered on top of the panel */}
      {showReschedule && (
        <RescheduleCalendarModal
          appointments={appointments}
          onClose={() => setShowReschedule(false)}
          onRefresh={() => { handleRescheduleDone(); }}
          onSelectAppointment={() => {}}
        />
      )}
    </>
  );
}
