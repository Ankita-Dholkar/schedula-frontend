"use client";

import { useState } from "react";
import { X, XCircle } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import { useAppDispatch } from "@/store/hooks";
import { changeStatus, addDoctorNotification } from "@/store/slices/appointmentsSlice";

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

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", hour12: true }).format(
    new Date(iso)
  );

const CANCELLATION_REASONS = [
  "Schedule conflict",
  "Feeling better",
  "Found another doctor",
  "Personal emergency",
  "Transport issue",
  "Other",
];

export default function CancelAppointmentModal({ appointment, onClose, onDone }: Props) {
  const dispatch = useAppDispatch();
  const [selectedReason, setSelectedReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    await new Promise((r) => setTimeout(r, 500));

    dispatch(changeStatus({ id: appointment.id, status: "cancelled" }));
    dispatch(
      addDoctorNotification({
        appointmentId: appointment.id,
        patientName: appointment.patient.name,
        message: `${appointment.patient.name} has cancelled their appointment on ${formatDate(
          appointment.startsAt
        )} at ${formatTime(appointment.startsAt)}${
          selectedReason ? ` — Reason: ${selectedReason}` : ""
        }.`,
      })
    );

    setIsCancelling(false);
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
        <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
              <XCircle size={16} className="text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-red-800">Cancel Appointment</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-red-400 transition hover:bg-red-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6">


          {/* Appointment summary */}
          <div className="mb-5 rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-3 text-sm space-y-1">
            <p className="font-semibold text-[var(--ink)]">{appointment.clinician}</p>
            <p className="text-[var(--muted)]">{appointment.specialty}</p>
            <p className="text-xs text-[var(--muted)] pt-1">
              <span className="font-medium text-[var(--ink)]">{formatDate(appointment.startsAt)}</span>
              {" "}at{" "}
              <span className="font-medium text-[var(--ink)]">{formatTime(appointment.startsAt)}</span>
            </p>
            <p className="text-xs text-[var(--muted)]">Reason: {appointment.reason}</p>
          </div>

          {/* Cancellation reason (optional) */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Reason for cancellation{" "}
              <span className="normal-case font-normal text-[var(--muted)]">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CANCELLATION_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() =>
                    setSelectedReason((prev) => (prev === reason ? "" : reason))
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    selectedReason === reason
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-red-300 hover:text-red-600"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--line)] py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-stone-50"
            >
              Keep Appointment
            </button>
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {isCancelling ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Cancelling…
                </span>
              ) : (
                "Yes, Cancel Visit"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
