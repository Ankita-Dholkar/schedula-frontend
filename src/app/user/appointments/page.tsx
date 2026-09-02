"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, Clock, Stethoscope, FileText, Download, Star, RefreshCw } from "lucide-react";
import UserPortalHeader from "@/features/user-portal/components/UserPortalHeader";
import ReviewModal from "@/features/user-portal/components/ReviewModal";
import { getAllAppointments, getComputedAppointmentStatus, saveDoctorNotification } from "@/lib/mock-data/appointments";
import { downloadPrescription } from "@/lib/prescription";
import type { Appointment, AppointmentStatus } from "@/types/appointment";

type ComputedStatus = AppointmentStatus | "upcoming";
type FilterTab = "upcoming" | "completed" | "cancelled" | "missed";

type AptWithComputed = Appointment & { _computed: ComputedStatus };

const TABS: { value: FilterTab; label: string }[] = [
  { value: "upcoming",  label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "missed",    label: "Missed" },
];

const STATUS_STYLES: Record<ComputedStatus, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  upcoming:  "bg-blue-50 text-blue-700 ring-blue-200",
  pending:   "bg-amber-50 text-amber-700 ring-amber-200",
  cancelled: "bg-stone-100 text-stone-600 ring-stone-200",
  completed: "bg-stone-100 text-stone-700 ring-stone-200",
  missed:    "bg-red-100 text-red-800 ring-red-300",
};

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

function UserAppointmentsPage() {
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>("upcoming");
  const [reviewAppointment, setReviewAppointment] = useState<Appointment | null>(null);

  // Read ?tab= query param and activate the correct tab
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam && TABS.some((t) => t.value === tabParam)) {
      setActiveTab(tabParam as FilterTab);
    }
  }, [searchParams]);

  const refreshAppointments = () => {
    try {
      const stored = localStorage.getItem("loggedInUser");
      const all = getAllAppointments();
      if (stored) {
        const user = JSON.parse(stored);
        if (user.role === "patient") {
           setAppointments(all.filter((a) => a.patient.name === user.name));
           return;
        }
      }
      setAppointments(all);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    refreshAppointments();
    window.addEventListener("focus", refreshAppointments);
    return () => window.removeEventListener("focus", refreshAppointments);
  }, []);

  const appointmentsWithComputed = useMemo<AptWithComputed[]>(() =>
    appointments.map((a) => ({ ...a, _computed: getComputedAppointmentStatus(a) })),
    [appointments]
  );

  const filtered = useMemo<AptWithComputed[]>(() => {
    return appointmentsWithComputed
      .filter((a) => {
        if (activeTab === "upcoming") {
          return a._computed === "upcoming" || a._computed === "pending" || a._computed === "confirmed";
        }
        return a._computed === activeTab;
      })
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  }, [appointmentsWithComputed, activeTab]);

  return (
    <>
      <UserPortalHeader title="My Appointments" />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">My Appointments</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Track your upcoming visits and view past appointment details.
          </p>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={`flex-1 min-w-[120px] rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === value
                  ? "bg-white text-[var(--ink)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[var(--line)] bg-white py-20 text-center">
            <Calendar size={40} className="mx-auto mb-4 text-stone-300" strokeWidth={1.5} />
            <p className="font-medium text-[var(--ink)]">No {activeTab} appointments found.</p>
            <p className="mt-1 text-sm text-[var(--muted)]">When you book an appointment, it will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((apt) => (
              <div key={apt.id} className="flex flex-col rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm transition hover:border-[var(--brand)]">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-[var(--ink)]">{apt.clinician}</h3>
                    <p className="text-sm text-[var(--muted)]">{apt.specialty}</p>
                  </div>
                  <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${STATUS_STYLES[apt._computed]}`}>
                    {apt._computed}
                  </span>
                </div>

                <div className="space-y-2.5 rounded-lg bg-[var(--canvas)] p-3 text-sm">
                  <div className="flex items-center gap-2.5 text-[var(--ink)]">
                    <Calendar size={15} className="text-[var(--muted)]" />
                    <span className="font-medium">{formatDate(apt.startsAt)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[var(--ink)]">
                    <Clock size={15} className="text-[var(--muted)]" />
                    <span>{formatTime(apt.startsAt)} ({apt.durationMinutes} min)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[var(--ink)]">
                    <Stethoscope size={15} className="text-[var(--muted)]" />
                    <span className="truncate">{apt.reason}</span>
                  </div>
                </div>

                {/* Post-appointment actions */}
                {activeTab === "completed" && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-[var(--line)] pt-4">
                    {/* Prescription */}
                    <div className="flex items-center justify-between rounded-lg bg-stone-50 p-3">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className={apt.prescriptionAvailable ? "text-emerald-600" : "text-stone-400"} />
                        <span className="text-sm font-medium text-[var(--ink)]">
                          {apt.prescriptionAvailable ? "Prescription Available" : "No Prescription"}
                        </span>
                      </div>
                      {apt.prescriptionAvailable && (
                        <button
                          onClick={() => downloadPrescription(apt)}
                          title="Download Prescription"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--brand)] shadow-sm transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <Download size={14} />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReviewAppointment(apt)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--line)] py-2 text-sm font-semibold text-[var(--ink)] hover:bg-stone-50"
                      >
                        <Star size={14} /> Review
                      </button>
                      <button
                        onClick={() => window.location.href = "/user/doctors"}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--brand)] py-2 text-sm font-semibold text-white hover:bg-[var(--brand-deep)]"
                      >
                        <RefreshCw size={14} /> Rebook
                      </button>
                    </div>
                  </div>
                )}
                
                {(activeTab === "cancelled" || activeTab === "missed") && (
                  <div className="mt-4 border-t border-[var(--line)] pt-4">
                    <button
                      onClick={() => window.location.href = "/user/doctors"}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] py-2 text-sm font-semibold text-white hover:bg-[var(--brand-deep)]"
                    >
                      <RefreshCw size={14} /> Rebook Appointment
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {reviewAppointment && (
        <ReviewModal
          appointment={reviewAppointment}
          onClose={() => setReviewAppointment(null)}
          onSubmit={(rating, review) => {
            saveDoctorNotification({
              appointmentId: reviewAppointment.id,
              patientName: reviewAppointment.patient.name,
              message: `New ${rating}-star review: "${review || 'No written feedback'}"`,
            });
            alert(`Thanks for rating ${reviewAppointment.clinician} ${rating} stars!`);
            setReviewAppointment(null);
          }}
        />
      )}
    </>
  );
}

export default function UserAppointmentsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center"><span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" /></div>}>
      <UserAppointmentsPage />
    </Suspense>
  );
}
