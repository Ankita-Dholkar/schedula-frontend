"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X, CalendarDays, Clock, Tag, MapPin, User, CreditCard,
  Video, Building2, Wifi, RotateCcw, CheckCircle2, AlertCircle, XCircle,
} from "lucide-react";
import type { Appointment } from "@/types/appointment";
import { CONSULTATION_FEE } from "@/types/payment";
import { updateAppointmentStatus, getComputedAppointmentStatus, saveNotification } from "@/lib/mock-data/appointments";
import type { ComputedStatus } from "@/lib/mock-data/appointments";
import RescheduleCalendarModal from "./RescheduleCalendarModal";
import PatientRiskSnapshot from "./PatientRiskSnapshot";
import { useAppDispatch } from "@/store/hooks";
import { approveRefund, rejectRefund } from "@/store/slices/paymentsSlice";
import { refreshAppointments } from "@/store/slices/appointmentsSlice";
import { logAdminAction } from "@/store/slices/auditLogsSlice";

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

const formatDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

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
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [refundProcessing, setRefundProcessing] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  if (!appointment) return null;

  const computedStatus = getComputedAppointmentStatus(appointment) as ComputedStatus;
  const isOnline = appointment.appointmentMode === "online";
  const canStart = isOnline && (computedStatus === "starting-soon" || computedStatus === "live");

  const hasRefundRequest = appointment.refundStatus === "requested";
  const refundApproved = appointment.refundStatus === "refunded" || appointment.paymentStatus === "refunded";
  const refundRejected = appointment.refundStatus === "rejected";

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

  const handleApproveRefund = () => {
    setRefundProcessing(true);
    try {
      dispatch(approveRefund({ appointmentId: appointment.id }));
      // Notify patient
      saveNotification({
        appointmentId: appointment.id,
        patientName: appointment.patient.name,
        message: `Your refund of ₹${appointment.consultationFee ?? appointment.refundAmount ?? 0} for your appointment with ${appointment.clinician} has been approved and is being processed.`,
      });
      // Log audit event
      dispatch(logAdminAction({
        actor: {
          id: "doctor-action",
          name: appointment.clinician,
          email: "",
          role: "doctor",
        },
        action: "PAYMENT_REFUNDED",
        entityType: "payment",
        entityId: appointment.id,
        entityName: `Refund for ${appointment.patient.name} - ${appointment.clinician}`,
        details: `Doctor ${appointment.clinician} approved refund of ₹${appointment.consultationFee ?? 0} for ${appointment.patient.name}'s ${appointment.status} appointment.`,
        metadata: {
          appointmentId: appointment.id,
          patientName: appointment.patient.name,
          refundAmount: appointment.consultationFee ?? 0,
          appointmentStatus: appointment.status,
        },
        severity: "info",
      }));
      dispatch(refreshAppointments());
      setShowApproveModal(false);
      onRefresh();
    } finally {
      setRefundProcessing(false);
    }
  };

  const handleRejectRefund = () => {
    if (!rejectionReason.trim()) {
      setRejectError("Please provide a reason for rejecting the refund.");
      return;
    }
    setRefundProcessing(true);
    try {
      dispatch(rejectRefund({ appointmentId: appointment.id, rejectionReason: rejectionReason.trim() }));
      // Notify patient
      saveNotification({
        appointmentId: appointment.id,
        patientName: appointment.patient.name,
        message: `Your refund request for your appointment with ${appointment.clinician} has been reviewed. Reason: ${rejectionReason.trim()}`,
      });
      // Log audit event
      dispatch(logAdminAction({
        actor: {
          id: "doctor-action",
          name: appointment.clinician,
          email: "",
          role: "doctor",
        },
        action: "REFUND_REJECTED",
        entityType: "payment",
        entityId: appointment.id,
        entityName: `Refund Rejected for ${appointment.patient.name} - ${appointment.clinician}`,
        details: `Doctor ${appointment.clinician} rejected refund request from ${appointment.patient.name}. Reason: ${rejectionReason.trim()}`,
        metadata: {
          appointmentId: appointment.id,
          patientName: appointment.patient.name,
          rejectionReason: rejectionReason.trim(),
          appointmentStatus: appointment.status,
        },
        severity: "info",
      }));
      dispatch(refreshAppointments());
      setShowRejectModal(false);
      setRejectionReason("");
      setRejectError("");
      onRefresh();
    } finally {
      setRefundProcessing(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {!showReschedule && !showApproveModal && !showRejectModal && (
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
            {/* Refund request badge */}
            {hasRefundRequest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                <RotateCcw size={10} /> Refund Requested
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

          {/* ── Refund Request Section ──────────────────────────────────────── */}
          {hasRefundRequest && (
            <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200">
                  <RotateCcw size={15} className="text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-800">Refund Request</p>
                  <p className="text-xs text-amber-600">Patient has requested a refund</p>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-amber-700">Requested Amount</span>
                  <span className="font-bold text-amber-800">₹{appointment.refundAmount ?? appointment.consultationFee ?? 0}</span>
                </div>
                {appointment.refundRequestedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-amber-700">Requested On</span>
                    <span className="font-medium text-amber-800">{formatDateShort(appointment.refundRequestedAt)}</span>
                  </div>
                )}
                {appointment.refundRequestedBy && (
                  <div className="flex items-center justify-between">
                    <span className="text-amber-700">Requested By</span>
                    <span className="font-medium text-amber-800">{appointment.refundRequestedBy}</span>
                  </div>
                )}
                {appointment.refundReason && (
                  <div className="rounded-lg border border-amber-200 bg-white p-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 mb-1">Patient&apos;s Reason</p>
                    <p className="text-sm text-[var(--ink)]">{appointment.refundReason}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  <CheckCircle2 size={14} /> Approve
                </button>
                <button
                  onClick={() => { setShowRejectModal(true); setRejectionReason(""); setRejectError(""); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          )}

          {/* ── Refund Approved Info ───────────────────────────────────────── */}
          {refundApproved && (
            <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw size={15} className="text-violet-600" />
                <p className="text-sm font-bold text-violet-700">Refund Approved</p>
              </div>
              {appointment.refundAmount && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-violet-600">Refunded</span>
                  <span className="font-bold text-violet-700">₹{appointment.refundAmount}</span>
                </div>
              )}
              {appointment.refundId && (
                <p className="mt-1 font-mono text-[10px] text-violet-500">{appointment.refundId}</p>
              )}
              {appointment.refundedAt && (
                <p className="text-[10px] text-violet-500">on {formatDateShort(appointment.refundedAt)}</p>
              )}
            </div>
          )}

          {/* ── Refund Rejected Info ───────────────────────────────────────── */}
          {refundRejected && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={15} className="text-red-600" />
                <p className="text-sm font-bold text-red-700">Refund Request Rejected</p>
              </div>
              {appointment.refundRejectedReason && (
                <p className="text-xs text-red-600">Reason: {appointment.refundRejectedReason}</p>
              )}
              {appointment.refundRejectedAt && (
                <p className="text-[10px] text-red-500">on {formatDateShort(appointment.refundRejectedAt)}</p>
              )}
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
              {(() => {
                const isCheckup = Boolean(
                  (appointment.type && appointment.type.toLowerCase().includes("check")) ||
                  (appointment.reason && appointment.reason.toLowerCase().includes("check"))
                );
                return (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">
                      {isCheckup ? "Check-up Fee" : "Consultation Fee"}
                    </span>
                    <span className="font-bold text-[var(--ink)]">
                      ₹{appointment.consultationFee ?? (isCheckup ? 800 : 300)}
                    </span>
                  </div>
                );
              })()}
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Payment Status</span>
                {appointment.paymentStatus === "refunded" || refundApproved ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
                    <RotateCcw size={10} /> Refunded
                  </span>
                ) : appointment.paymentStatus === "paid" ? (
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

            {(computedStatus === "completed" || computedStatus === "cancelled" || computedStatus === "missed") && !hasRefundRequest && (
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

      {/* ── Approve Refund Confirmation Modal ──────────────────────────────── */}
      {showApproveModal && (
        <>
          <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm" onClick={() => setShowApproveModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-[70] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--ink)]">Approve Refund?</h3>
                <p className="text-xs text-[var(--muted)]">This action cannot be undone</p>
              </div>
            </div>
            <div className="mb-5 rounded-xl bg-emerald-50 p-4">
              <p className="text-sm text-emerald-800">
                Approving this refund will return <strong>₹{appointment.refundAmount ?? appointment.consultationFee ?? 0}</strong> to {appointment.patient.name}.
              </p>
              <p className="mt-1.5 text-xs text-emerald-600">
                This amount will be deducted from your collected revenue.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 rounded-xl border border-[var(--line)] py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                disabled={refundProcessing}
                onClick={handleApproveRefund}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {refundProcessing ? "Processing…" : "Approve Refund"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Reject Refund Modal ────────────────────────────────────────────── */}
      {showRejectModal && (
        <>
          <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-[70] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <XCircle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--ink)]">Reject Refund Request</h3>
                <p className="text-xs text-[var(--muted)]">Patient will be notified of the reason</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-[var(--ink)]">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => { setRejectionReason(e.target.value); setRejectError(""); }}
                placeholder="e.g. The appointment was attended and consultation was provided..."
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 resize-none h-24"
              />
              {rejectError && (
                <p className="mt-1 text-xs text-red-600">{rejectError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectionReason(""); setRejectError(""); }}
                className="flex-1 rounded-xl border border-[var(--line)] py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                disabled={refundProcessing}
                onClick={handleRejectRefund}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {refundProcessing ? "Processing…" : "Reject Refund"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
