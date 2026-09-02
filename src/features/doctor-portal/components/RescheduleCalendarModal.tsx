"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { X, Info } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import { getComputedAppointmentStatus } from "@/lib/mock-data/appointments";

const CalendarView = dynamic(
  () => import("@/features/doctor-portal/components/CalendarView"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 min-h-[560px] animate-pulse rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 text-sm">
        Loading calendar…
      </div>
    ),
  }
);

type Toast = { message: string; type: "success" | "error" };

type Props = {
  /** All doctor appointments (for conflict checks) */
  appointments: Appointment[];
  onClose: () => void;
  onRefresh: () => void;
  onSelectAppointment?: (apt: Appointment) => void;
};

export default function RescheduleCalendarModal({
  appointments,
  onClose,
  onRefresh,
  onSelectAppointment,
}: Props) {
  const [toast, setToast] = useState<Toast | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
    },
    []
  );

  // Count of reschedulable appointments
  const reschedulableCount = appointments.filter((a) => {
    const cs = getComputedAppointmentStatus(a);
    return cs === "upcoming" || cs === "pending";
  }).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-[70] w-[96vw] max-w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--line)] bg-[var(--canvas)] shadow-2xl flex flex-col"
        style={{ height: "92vh", maxHeight: "920px" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-[var(--line)] shrink-0">
          <div>
            <h3 className="text-xl font-semibold text-[var(--ink)] flex items-center gap-2">
              Reschedule Appointments
            </h3>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              Drag &amp; drop <strong>upcoming</strong> or <strong>pending</strong> appointments onto an available (green dashed) slot.
              {reschedulableCount > 0 ? (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                  {reschedulableCount} reschedulable
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Info note removed */}
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[var(--muted)] hover:bg-stone-200 transition"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Calendar body */}
        <div className="flex-1 min-h-0 p-4 overflow-hidden">
          <CalendarView
            appointments={appointments}
            onToast={showToast}
            onRefresh={onRefresh}
            onSelectEvent={(apt) => {
              if (onSelectAppointment) onSelectAppointment(apt);
            }}
          />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-medium text-white shadow-xl transition-all ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          <span className="text-base">{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </div>
      )}
    </>
  );
}
