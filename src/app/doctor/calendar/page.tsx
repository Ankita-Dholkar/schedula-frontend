"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import DoctorPortalHeader from "@/features/doctor-portal/components/DoctorPortalHeader";
import AppointmentDetailPanel from "@/features/doctor-portal/components/AppointmentDetailPanel";
import { getAllAppointments } from "@/lib/mock-data/appointments";
import type { Appointment } from "@/types/appointment";

// Dynamically import CalendarView (react-big-calendar uses window APIs)
const CalendarView = dynamic(
  () => import("@/features/doctor-portal/components/CalendarView"),
  { ssr: false, loading: () => <div className="flex-1 animate-pulse rounded-xl bg-stone-100" /> }
);

type StoredUser = { id: string; name: string; email: string; role: string };

type Toast = { message: string; type: "success" | "error" };

export default function DoctorCalendarPage() {
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const refreshAppointments = useCallback(() => {
    try {
      const stored = localStorage.getItem("loggedInUser");
      if (stored) {
        const user: StoredUser = JSON.parse(stored);
        setMyAppointments(getAllAppointments().filter((a) => a.clinician === user.name));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    refreshAppointments();
    window.addEventListener("focus", refreshAppointments);
    return () => window.removeEventListener("focus", refreshAppointments);
  }, [refreshAppointments]);

  // Auto-dismiss toast after 3s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  }, []);

  return (
    <>
      <DoctorPortalHeader title="Calendar" />

      <main className="flex flex-1 flex-col overflow-hidden px-6 py-6">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">Calendar</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            View your schedule. Drag &amp; drop pending or upcoming appointments to reschedule.
          </p>
        </div>

        <div className="flex-1 overflow-hidden">
          <CalendarView
            appointments={myAppointments}
            onToast={showToast}
            onRefresh={refreshAppointments}
            onSelectEvent={(apt) => setSelectedAppointment(apt)}
          />
        </div>
      </main>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-medium text-white shadow-lg transition ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? "✓" : "✕"} {toast.message}
        </div>
      )}

      <AppointmentDetailPanel
        appointment={selectedAppointment}
        onClose={() => { setSelectedAppointment(null); refreshAppointments(); }}
        onRefresh={refreshAppointments}
      />
    </>
  );
}
