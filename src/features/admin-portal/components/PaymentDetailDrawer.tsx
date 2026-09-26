"use client";

import { useEffect, useRef } from "react";
import {
  X,
  CreditCard,
  Smartphone,
  CalendarDays,
  User,
  Stethoscope,
  RotateCcw,
  Hash,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Hourglass,
} from "lucide-react";
import type { Payment } from "@/types/payment";
import type { Appointment } from "@/types/appointment";

//Helpers

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

//Status Badge

function StatusPill({ status }: { status: Payment["status"] }) {
  const map: Record<
    Payment["status"],
    { label: string; cls: string; Icon: React.ElementType }
  > = {
    paid: {
      label: "Paid",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Icon: CheckCircle2,
    },
    pending: {
      label: "Pending",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      Icon: Hourglass,
    },
    failed: {
      label: "Failed",
      cls: "bg-red-50 text-red-700 border-red-200",
      Icon: AlertCircle,
    },
    refunded: {
      label: "Refunded",
      cls: "bg-violet-50 text-violet-700 border-violet-200",
      Icon: RotateCcw,
    },
  };
  const { label, cls, Icon } = map[status] ?? map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}

//Row 
function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[var(--line)] last:border-0">
      <span className="text-xs font-medium text-[var(--muted)] shrink-0">{label}</span>
      <span
        className={`text-right text-sm text-[var(--ink)] ${mono ? "font-mono text-xs" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}

// Props 

type Props = {
  payment: Payment | null;
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
};

//Component 
export default function PaymentDetailDrawer({
  payment,
  appointment,
  open,
  onClose,
}: Props) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!payment) return null;

  const methodIcon =
    payment.method === "upi" ? (
      <Smartphone size={14} className="text-[var(--brand)]" />
    ) : (
      <CreditCard size={14} className="text-[var(--brand)]" />
    );

  const isCheckup = Boolean(
    (appointment?.type && appointment.type.toLowerCase().includes("check")) ||
    (appointment?.reason && appointment.reason.toLowerCase().includes("check"))
  );
  const displayAmount =
    appointment?.consultationFee && appointment.consultationFee > 0
      ? appointment.consultationFee
      : payment.amount;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Payment Details"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--canvas)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
              <CreditCard size={17} className="text-[var(--brand)]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--ink)]">Payment Details</p>
              <p className="font-mono text-xs text-[var(--muted)]">{payment.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-stone-100 hover:text-[var(--ink)]"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* ── Amount card ── */}
          <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 p-5 text-white shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">
              {isCheckup ? "Check-up Fee" : "Consultation Fee"}
            </p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight">
              ₹{displayAmount.toLocaleString()}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <StatusPill status={payment.status} />
              <span className="flex items-center gap-1.5 text-xs text-teal-200">
                {methodIcon}
                {payment.method === "upi" ? "UPI" : "Card"}
              </span>
            </div>
          </div>

          {/* ── Transaction details ── */}
          <div className="rounded-xl border border-[var(--line)] bg-white">
            <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
              <Hash size={14} className="text-[var(--brand)]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Transaction Details
              </p>
            </div>
            <div className="px-4">
              <DetailRow label="Payment ID" value={payment.id} mono />
              {payment.transactionId && (
                <DetailRow label="Transaction ID" value={payment.transactionId} mono />
              )}
              <DetailRow label="Payment Method" value={payment.method === "upi" ? "UPI" : "Card"} />
              <DetailRow label="Amount" value={`₹${displayAmount.toLocaleString()}`} />
              <DetailRow label="Status" value={<StatusPill status={payment.status} />} />
              <DetailRow label="Created" value={fmtDateTime(payment.createdAt)} />
              {payment.updatedAt && (
                <DetailRow label="Updated" value={fmtDateTime(payment.updatedAt)} />
              )}
            </div>
          </div>

          {/* ── Appointment details ── */}
          {appointment ? (
            <div className="rounded-xl border border-[var(--line)] bg-white">
              <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
                <CalendarDays size={14} className="text-[var(--brand)]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Appointment Info
                </p>
              </div>
              <div className="px-4">
                <DetailRow
                  label="Appointment ID"
                  value={appointment.id}
                  mono
                />
                <DetailRow
                  label="Patient"
                  value={
                    <span className="flex items-center gap-1.5">
                      <User size={12} className="shrink-0 text-[var(--muted)]" />
                      {appointment.patient.name}
                    </span>
                  }
                />
                <DetailRow
                  label="Doctor"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Stethoscope size={12} className="shrink-0 text-[var(--muted)]" />
                      {appointment.clinician}
                    </span>
                  }
                />
                <DetailRow label="Specialty" value={appointment.specialty} />
                <DetailRow
                  label="Date & Time"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="shrink-0 text-[var(--muted)]" />
                      {fmtDateTime(appointment.startsAt)}
                    </span>
                  }
                />
                <DetailRow
                  label="Mode"
                  value={
                    appointment.appointmentMode === "online"
                      ? "Online (Video)"
                      : "In-Person"
                  }
                />
                <DetailRow
                  label="Appointment Status"
                  value={
                    <span className="capitalize font-medium">
                      {appointment.status}
                    </span>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-3">
              <p className="text-xs text-[var(--muted)]">
                Appointment ID:{" "}
                <span className="font-mono font-medium text-[var(--ink)]">
                  {payment.appointmentId}
                </span>{" "}
                (appointment record not found)
              </p>
            </div>
          )}

          {/* ── Refund details ── */}
          {(payment.status === "refunded" || payment.refundStatus) && payment.refundStatus !== "none" && (
            <div className={`rounded-xl border ${
              payment.refundStatus === "requested"
                ? "border-amber-200 bg-amber-50"
                : payment.refundStatus === "rejected"
                ? "border-red-200 bg-red-50"
                : "border-violet-200 bg-violet-50"
            }`}>
              <div className={`flex items-center gap-2 border-b px-4 py-3 ${
                payment.refundStatus === "requested"
                  ? "border-amber-200"
                  : payment.refundStatus === "rejected"
                  ? "border-red-200"
                  : "border-violet-200"
              }`}>
                <RefreshCw size={14} className={
                  payment.refundStatus === "requested"
                    ? "text-amber-600"
                    : payment.refundStatus === "rejected"
                    ? "text-red-600"
                    : "text-violet-600"
                } />
                <p className={`text-xs font-semibold uppercase tracking-wider ${
                  payment.refundStatus === "requested"
                    ? "text-amber-600"
                    : payment.refundStatus === "rejected"
                    ? "text-red-600"
                    : "text-violet-600"
                }`}>
                  {payment.refundStatus === "requested"
                    ? "Refund Requested"
                    : payment.refundStatus === "rejected"
                    ? "Refund Rejected"
                    : "Refund Information"}
                </p>
              </div>
              <div className="px-4">
                {payment.refundRequestedBy && (
                  <DetailRow label="Requested By" value={payment.refundRequestedBy} />
                )}
                {payment.refundRequestedAt && (
                  <DetailRow label="Requested On" value={fmtDateTime(payment.refundRequestedAt)} />
                )}
                {payment.refundReason && (
                  <div className="py-2.5 border-b border-[var(--line)] last:border-0">
                    <span className={`text-xs font-medium ${
                      payment.refundStatus === "requested" ? "text-amber-600" : "text-violet-600"
                    }`}>
                      Patient&apos;s Reason
                    </span>
                    <p className="mt-1 text-sm text-[var(--ink)] leading-relaxed">
                      {payment.refundReason}
                    </p>
                  </div>
                )}
                {payment.refundId && (
                  <DetailRow label="Refund ID" value={payment.refundId} mono />
                )}
                {payment.refundAmount !== undefined && payment.refundStatus === "refunded" && (
                  <DetailRow
                    label="Refund Amount"
                    value={`₹${payment.refundAmount.toLocaleString()}`}
                  />
                )}
                {payment.refundedAt && (
                  <DetailRow
                    label="Refunded On"
                    value={fmtDate(payment.refundedAt)}
                  />
                )}
                {payment.refundRejectedReason && (
                  <div className="py-2.5 border-b border-red-200 last:border-0">
                    <span className="text-xs font-medium text-red-600">
                      Rejection Reason
                    </span>
                    <p className="mt-1 text-sm text-[var(--ink)] leading-relaxed">
                      {payment.refundRejectedReason}
                    </p>
                  </div>
                )}
                {payment.refundRejectedAt && (
                  <DetailRow
                    label="Rejected On"
                    value={fmtDateTime(payment.refundRejectedAt)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

