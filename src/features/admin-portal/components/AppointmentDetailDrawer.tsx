"use client";

import { useMemo } from "react";
import {
  X, Calendar, Clock, Stethoscope, User, MapPin, Video,
  Building2, CreditCard, FileText, Wifi, XCircle,
  CalendarDays, AlertCircle, CheckCircle2, RefreshCw,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import type { Appointment } from "@/types/appointment";
import { getComputedAppointmentStatus } from "@/lib/mock-data/appointments";
import type { ComputedStatus } from "@/lib/mock-data/appointments";

type Props = {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
};

// Formatting helpers
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

const fmtDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

const fmtDateTime = (iso: string) =>
  `${fmtDateShort(iso)} at ${fmtTime(iso)}`;

// Status badge config
const STATUS_CONFIG: Record<ComputedStatus, { label: string; variant: BadgeVariant }> = {
  confirmed:       { label: "Confirmed",     variant: "confirmed" },
  upcoming:        { label: "Upcoming",      variant: "confirmed" },
  "starting-soon": { label: "Starting Soon", variant: "confirmed" },
  live:            { label: "Live",          variant: "live"      },
  pending:         { label: "Pending",       variant: "pending"   },
  completed:       { label: "Completed",     variant: "completed" },
  cancelled:       { label: "Cancelled",     variant: "cancelled" },
  missed:          { label: "Missed",        variant: "missed"    },
};

function InfoRow({
  icon: Icon,
  label,
  value,
  valueClass = "",
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  valueClass?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--canvas)]">
        <Icon size={13} className="text-[var(--muted)]" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
        <p className={`text-sm text-[var(--ink)] break-words ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
      {children}
    </p>
  );
}

export default function AppointmentDetailDrawer({ appointment, open, onClose }: Props) {
  const computed = useMemo<ComputedStatus | null>(
    () => (appointment ? getComputedAppointmentStatus(appointment) as ComputedStatus : null),
    [appointment]
  );

  if (!open || !appointment || !computed) return null;

  const statusCfg = STATUS_CONFIG[computed] ?? { label: computed, variant: "default" as BadgeVariant };
  const isOnline   = appointment.appointmentMode === "online";
  const isCancelled  = computed === "cancelled";
  const isRescheduled = !!appointment.isRescheduled;
  const isCompleted  = computed === "completed";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Appointment details — ${appointment.id}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[500px] flex-col bg-white shadow-2xl border-l border-[var(--line)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--ink)]">Appointment Details</h2>
            <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">{appointment.id}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)] transition-colors"
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Status & Mode badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusCfg.variant} label={statusCfg.label} dot />
            {isOnline ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                <Video size={10} /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                <Building2 size={10} /> In-person
              </span>
            )}
            {isRescheduled && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                <RefreshCw size={10} /> Rescheduled
              </span>
            )}
          </div>

          {/* Patient */}
          <section>
            <SectionHeader>Patient</SectionHeader>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white">
                {appointment.patient.initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--ink)]">{appointment.patient.name}</p>
                <p className="text-xs text-[var(--muted)]">Age {appointment.patient.age}</p>
              </div>
            </div>
          </section>

          {/* Clinician */}
          <section>
            <SectionHeader>Clinician</SectionHeader>
            <div className="space-y-3">
              <InfoRow icon={Stethoscope} label="Doctor"    value={appointment.clinician} />
              <InfoRow icon={User}        label="Specialty" value={appointment.specialty} />
              <InfoRow icon={FileText}    label="Visit Type" value={appointment.type} />
              {!isOnline && appointment.location && (
                <InfoRow
                  icon={MapPin}
                  label="Clinic"
                  value={`${appointment.location.name}${appointment.location.address ? ` — ${appointment.location.address}` : ""}`}
                />
              )}
              {!isOnline && appointment.room && (
                <InfoRow icon={MapPin} label="Room" value={appointment.room} />
              )}
              {isOnline && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--canvas)]">
                    <Wifi size={13} className="text-[var(--muted)]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Mode</p>
                    <p className="text-sm text-violet-700 font-medium">Video Consultation</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Timing */}
          <section>
            <SectionHeader>Schedule</SectionHeader>
            <div className="space-y-3">
              <InfoRow icon={Calendar} label="Date"     value={fmtDate(appointment.startsAt)} />
              <InfoRow icon={Clock}    label="Time"     value={fmtTime(appointment.startsAt)} />
              <InfoRow icon={Clock}    label="Duration" value={`${appointment.durationMinutes} minutes`} />
              <InfoRow icon={FileText} label="Reason"   value={appointment.reason} />
              {appointment.notes && (
                <InfoRow icon={FileText} label="Notes" value={appointment.notes} />
              )}
            </div>
          </section>

          {/* Cancellation Audit */}
          {isCancelled && (appointment.cancellationReason || appointment.cancelledAt || appointment.cancelledBy) && (
            <section>
              <SectionHeader>Cancellation Details</SectionHeader>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle size={14} className="text-red-600" />
                  <p className="text-xs font-bold uppercase tracking-wider text-red-700">Cancelled</p>
                </div>
                {appointment.cancelledAt && (
                  <InfoRow icon={Calendar} label="Cancelled On" value={fmtDateTime(appointment.cancelledAt)} />
                )}
                {appointment.cancelledBy && (
                  <InfoRow
                    icon={User}
                    label="Cancelled By"
                    value={appointment.cancelledBy.charAt(0).toUpperCase() + appointment.cancelledBy.slice(1)}
                  />
                )}
                {appointment.cancellationReason && (
                  <InfoRow icon={AlertCircle} label="Reason" value={appointment.cancellationReason} />
                )}
              </div>
            </section>
          )}

          {/* Reschedule Audit */}
          {isRescheduled && (appointment.originalStartsAt || appointment.rescheduledAt || appointment.rescheduleReason) && (
            <section>
              <SectionHeader>Reschedule History</SectionHeader>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw size={14} className="text-blue-600" />
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Rescheduled</p>
                </div>
                {appointment.originalStartsAt && (
                  <InfoRow
                    icon={Calendar}
                    label="Original Date & Time"
                    value={fmtDateTime(appointment.originalStartsAt)}
                    valueClass="line-through text-[var(--muted)]"
                  />
                )}
                <InfoRow icon={Calendar} label="New Date & Time"    value={fmtDateTime(appointment.startsAt)} />
                {appointment.rescheduledAt && (
                  <InfoRow icon={Clock} label="Rescheduled On"      value={fmtDateTime(appointment.rescheduledAt)} />
                )}
                {appointment.rescheduleReason && (
                  <InfoRow icon={AlertCircle} label="Reason"        value={appointment.rescheduleReason} />
                )}
              </div>
            </section>
          )}

          {/* Payment Details */}
          {(appointment.consultationFee || appointment.paymentStatus) && (
            <section>
              <SectionHeader>Payment</SectionHeader>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-4 space-y-3">
                {appointment.consultationFee && (
                  <InfoRow icon={CreditCard} label="Consultation Fee" value={`₹${appointment.consultationFee}`} />
                )}
                {appointment.paymentStatus && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--canvas)]">
                      <CreditCard size={13} className="text-[var(--muted)]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Payment Status</p>
                      <span className={`inline-flex mt-0.5 rounded-full px-2.5 py-0.5 text-xs font-semibold
                        ${appointment.paymentStatus === "paid"    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : ""}
                        ${appointment.paymentStatus === "pending" ? "bg-amber-50 text-amber-700 border border-amber-200"      : ""}
                        ${appointment.paymentStatus === "failed"  ? "bg-red-50 text-red-700 border border-red-200"           : ""}
                      `}>
                        {appointment.paymentStatus.charAt(0).toUpperCase() + appointment.paymentStatus.slice(1)}
                      </span>
                    </div>
                  </div>
                )}
                {appointment.paymentMethod && (
                  <InfoRow
                    icon={CreditCard}
                    label="Payment Method"
                    value={appointment.paymentMethod.toUpperCase()}
                  />
                )}
                {appointment.transactionId && (
                  <InfoRow
                    icon={FileText}
                    label="Transaction ID"
                    value={appointment.transactionId}
                    valueClass="font-mono text-xs"
                  />
                )}
              </div>
            </section>
          )}

          {/* Consultation & Prescription */}
          {(isCompleted || appointment.consultationStarted || appointment.prescriptionAvailable) && (
            <section>
              <SectionHeader>Consultation & Prescription</SectionHeader>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-4 space-y-3">
                {appointment.consultationStarted !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    {appointment.consultationStarted ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span className="text-emerald-700 font-medium">Consultation started</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} className="text-amber-500" />
                        <span className="text-amber-700">Consultation not started</span>
                      </>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText size={14} className={appointment.prescriptionAvailable ? "text-emerald-600" : "text-stone-400"} />
                    <span className={appointment.prescriptionAvailable ? "text-emerald-700 font-medium" : "text-[var(--muted)]"}>
                      {appointment.prescriptionAvailable ? "Prescription available" : "No prescription"}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

        </div>
      </aside>
    </>
  );
}
