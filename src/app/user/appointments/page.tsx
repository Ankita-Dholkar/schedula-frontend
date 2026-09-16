"use client";

import { useState, useMemo, Suspense, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  Download,
  Star,
  RefreshCw,
  CalendarDays,
  XCircle,
  CreditCard,
  Video,
  Building2,
  MapPin,
  Wifi,
} from "lucide-react";
import UserPortalHeader from "@/features/user-portal/components/UserPortalHeader";
import ReviewModal from "@/features/user-portal/components/ReviewModal";
import PatientRescheduleModal from "@/features/user-portal/components/PatientRescheduleModal";
import CancelAppointmentModal from "@/features/user-portal/components/CancelAppointmentModal";
import DemoPaymentModal from "@/features/booking/components/DemoPaymentModal";
import { downloadPrescription } from "@/lib/prescription";
import type { Appointment } from "@/types/appointment";
import { CONSULTATION_FEE } from "@/types/payment";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { refreshAppointments } from "@/store/slices/appointmentsSlice";
import { selectHasReviewedAppointment } from "@/store/slices/reviewsSlice";
import { getComputedAppointmentStatus } from "@/lib/mock-data/appointments";
import type { ComputedStatus } from "@/lib/mock-data/appointments";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = "upcoming" | "completed" | "cancelled" | "missed";
type AptWithComputed = Appointment & { _computed: ComputedStatus };

const TABS: { value: FilterTab; label: string }[] = [
  { value: "upcoming",  label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "missed",    label: "Missed" },
];

const STATUS_STYLES: Record<ComputedStatus, string> = {
  confirmed:       "bg-emerald-50 text-emerald-700 ring-emerald-200",
  upcoming:        "bg-blue-50 text-blue-700 ring-blue-200",
  "starting-soon": "bg-orange-50 text-orange-700 ring-orange-200",
  live:            "bg-green-50 text-green-700 ring-green-200",
  pending:         "bg-amber-50 text-amber-700 ring-amber-200",
  cancelled:       "bg-stone-100 text-stone-600 ring-stone-200",
  completed:       "bg-stone-100 text-stone-700 ring-stone-200",
  missed:          "bg-red-100 text-red-800 ring-red-300",
};

const STATUS_LABELS: Record<ComputedStatus, string> = {
  confirmed:       "Confirmed",
  upcoming:        "Upcoming",
  "starting-soon": "Starting Soon",
  live:            "Live",
  pending:         "Pending",
  cancelled:       "Cancelled",
  completed:       "Completed",
  missed:          "Missed",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", hour12: true }).format(
    new Date(iso)
  );

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

/** Eligible = not started, not completed, not cancelled */
function isEligibleForAction(computed: ComputedStatus): boolean {
  return computed === "upcoming" || computed === "confirmed" || computed === "pending";
}

/** Returns countdown string until start e.g. "in 3h 22m" */
function useCountdown(startsAt: string): string {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function compute() {
      const diff = new Date(startsAt).getTime() - Date.now();
      if (diff <= 0) { setLabel(""); return; }
      const totalMin = Math.floor(diff / 60_000);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      setLabel(h > 0 ? `in ${h}h ${m}m` : `in ${m}m`);
    }
    compute();
    const id = setInterval(compute, 30_000);
    return () => clearInterval(id);
  }, [startsAt]);

  return label;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Reactive Reviewed badge or active Review button depending on Redux review state */
function ReviewButton({
  appointmentId,
  onReview,
}: {
  appointmentId: string;
  onReview: () => void;
}) {
  const reviewed = useAppSelector((state) =>
    selectHasReviewedAppointment(state, appointmentId)
  );

  if (reviewed) {
    return (
      <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <Star size={14} className="fill-emerald-600 text-emerald-600" /> Reviewed
      </div>
    );
  }

  return (
    <button
      onClick={onReview}
      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--line)] py-2 text-sm font-semibold text-[var(--ink)] hover:bg-stone-50"
    >
      <Star size={14} /> Review
    </button>
  );
}

/** Countdown pill for upcoming online appointments */
function CountdownPill({ startsAt }: { startsAt: string }) {
  const label = useCountdown(startsAt);
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
      <Clock size={10} /> {label}
    </span>
  );
}

/** Mode badge displayed on each appointment card */
function ModeBadge({ mode }: { mode?: "in-person" | "online" }) {
  if (mode === "online") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
        <Video size={10} /> Online Consultation
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-200">
      <Building2 size={10} /> In-person Consultation
    </span>
  );
}

// ─── Appointment card action area ─────────────────────────────────────────────

function UpcomingActions({
  apt,
  onReschedule,
  onCancel,
  onJoin,
}: {
  apt: AptWithComputed;
  onReschedule: () => void;
  onCancel: () => void;
  onJoin: () => void;
}) {
  const isOnline = apt.appointmentMode === "online";
  const canJoin = isOnline && (apt._computed === "starting-soon" || apt._computed === "live");

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-[var(--line)] pt-4">
      {/* Join Consultation — online only, starting soon or live */}
      {canJoin && (
        <button
          onClick={onJoin}
          className="flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 active:scale-[0.98]"
        >
          <Wifi size={15} />
          {apt._computed === "live" ? "Join Live Consultation" : "Join Consultation"}
        </button>
      )}

      {/* In-person: Location block */}
      {!isOnline && (apt.location || apt.room) && (
        <div className="flex items-start gap-2 rounded-lg bg-teal-50 px-3 py-2.5 text-sm text-teal-700">
          <MapPin size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{apt.location?.name ?? "Clinic"}</p>
            {apt.location?.address && (
              <p className="text-xs text-teal-600 mt-0.5">{apt.location.address}</p>
            )}
            {apt.room && (
              <p className="text-xs text-teal-600 mt-0.5">{apt.room}</p>
            )}
          </div>
        </div>
      )}

      {/* Reschedule / Cancel — only when genuinely eligible */}
      {isEligibleForAction(apt._computed) && (
        <div className="flex gap-2">
          <button
            onClick={onReschedule}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--brand)] py-2 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white"
          >
            <CalendarDays size={14} />
            Reschedule
          </button>
          <button
            onClick={onCancel}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <XCircle size={14} />
            Cancel Visit
          </button>
        </div>
      )}
    </div>
  );
}

// Main page
function UserAppointmentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const allAppointments = useAppSelector((state) => state.appointments.appointments);

  const [activeTab, setActiveTab] = useState<FilterTab>("upcoming");
  const [reviewAppointment, setReviewAppointment] = useState<Appointment | null>(null);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [cancelAppointment, setCancelAppointment] = useState<Appointment | null>(null);
  const [paymentAppointment, setPaymentAppointment] = useState<Appointment | null>(null);

  const refresh = useCallback(() => { dispatch(refreshAppointments()); }, [dispatch]);

  // Sync Redux store with localStorage on mount / focus, plus 30s polling
  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    const poll = setInterval(refresh, 30_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(poll);
    };
  }, [refresh]);

  // Read ?tab= query param
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam && TABS.some((t) => t.value === tabParam)) {
      setActiveTab(tabParam as FilterTab);
    }
  }, [searchParams]);

  // Filter appointments for this patient and compute statuses
  const appointmentsWithComputed = useMemo<AptWithComputed[]>(() => {
    return allAppointments
      .filter((a) => {
        if (!user) return true;
        if (user.role === "patient") return a.patient.name === user.name;
        return true;
      })
      .map((a) => ({ ...a, _computed: getComputedAppointmentStatus(a) as ComputedStatus }));
  }, [allAppointments, user]);

  const filtered = useMemo<AptWithComputed[]>(() => {
    return appointmentsWithComputed
      .filter((a) => {
        if (activeTab === "upcoming") {
          return (
            a._computed === "upcoming" ||
            a._computed === "pending" ||
            a._computed === "confirmed" ||
            a._computed === "starting-soon" ||
            a._computed === "live"
          );
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
            Track your upcoming visits, reschedule or cancel, and view past appointment details.
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

        {/* Appointment list */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[var(--line)] bg-white py-20 text-center">
            <Calendar size={40} className="mx-auto mb-4 text-stone-300" strokeWidth={1.5} />
            <p className="font-medium text-[var(--ink)]">No {activeTab} appointments found.</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              When you book an appointment, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((apt) => (
              <div
                key={apt.id}
                className={`flex flex-col rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                  apt._computed === "live"
                    ? "border-green-300 ring-1 ring-green-200"
                    : apt._computed === "starting-soon"
                    ? "border-orange-300 ring-1 ring-orange-200"
                    : "border-[var(--line)] hover:border-[var(--brand)]/40"
                }`}
              >
                {/* Header row */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-[var(--ink)] truncate">{apt.clinician}</h3>
                    <p className="text-sm text-[var(--muted)]">{apt.specialty}</p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${STATUS_STYLES[apt._computed]}`}
                  >
                    {STATUS_LABELS[apt._computed]}
                  </span>
                </div>

                {/* Mode badge + countdown */}
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <ModeBadge mode={apt.appointmentMode} />
                  {(apt._computed === "upcoming" || apt._computed === "confirmed" || apt._computed === "starting-soon") && (
                    <CountdownPill startsAt={apt.startsAt} />
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2.5 rounded-lg bg-[var(--canvas)] p-3 text-sm">
                  <div className="flex items-center gap-2.5 text-[var(--ink)]">
                    <Calendar size={15} className="text-[var(--muted)] shrink-0" />
                    <span className="font-medium">{formatDate(apt.startsAt)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[var(--ink)]">
                    <Clock size={15} className="text-[var(--muted)] shrink-0" />
                    <span>
                      {formatTime(apt.startsAt)} ({apt.durationMinutes} min)
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[var(--ink)]">
                    <Stethoscope size={15} className="text-[var(--muted)] shrink-0" />
                    <span className="truncate">{apt.reason}</span>
                  </div>
                </div>

                {/* Payment strip */}
                <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard size={14} className="shrink-0 text-[var(--muted)]" />
                    <span className="font-medium text-[var(--ink)]">
                      ₹{apt.consultationFee ?? CONSULTATION_FEE}
                    </span>
                  </div>
                  {apt.paymentStatus === "paid" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      Paid
                    </span>
                  ) : apt.paymentStatus === "failed" ? (
                    <button
                      onClick={() => setPaymentAppointment(apt)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200 transition hover:bg-red-100"
                    >
                      Failed — Retry
                    </button>
                  ) : (
                    <button
                      onClick={() => setPaymentAppointment(apt)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200 transition hover:bg-amber-100"
                    >
                      Pay Now
                    </button>
                  )}
                </div>

                {/* ── Upcoming actions (includes Join for online) ── */}
                {activeTab === "upcoming" && (
                  <UpcomingActions
                    apt={apt}
                    onReschedule={() => setRescheduleAppointment(apt)}
                    onCancel={() => setCancelAppointment(apt)}
                    onJoin={() => router.push(`/consultation/${apt.id}`)}
                  />
                )}

                {/* ── Completed: Prescription + Review + Rebook ── */}
                {activeTab === "completed" && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-[var(--line)] pt-4">
                    <div className="flex items-center justify-between rounded-lg bg-stone-50 p-3">
                      <div className="flex items-center gap-2">
                        <FileText
                          size={16}
                          className={apt.prescriptionAvailable ? "text-emerald-600" : "text-stone-400"}
                        />
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
                      <ReviewButton
                        appointmentId={apt.id}
                        onReview={() => setReviewAppointment(apt)}
                      />
                      <button
                        onClick={() => (window.location.href = "/user/doctors")}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--brand)] py-2 text-sm font-semibold text-white hover:bg-[var(--brand-deep)]"
                      >
                        <RefreshCw size={14} /> Rebook
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Cancelled / Missed: Rebook ── */}
                {(activeTab === "cancelled" || activeTab === "missed") && (
                  <div className="mt-4 border-t border-[var(--line)] pt-4">
                    <button
                      onClick={() => (window.location.href = "/user/doctors")}
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

      {/* Demo Payment Modal */}
      {paymentAppointment && (
        <DemoPaymentModal
          appointmentId={paymentAppointment.id}
          onClose={() => setPaymentAppointment(null)}
          onSuccess={() => {
            setPaymentAppointment(null);
            dispatch(refreshAppointments());
          }}
        />
      )}

      {/* Review Modal */}
      {reviewAppointment && (
        <ReviewModal
          appointment={reviewAppointment}
          onClose={() => setReviewAppointment(null)}
        />
      )}

      {/* Patient Reschedule Modal */}
      {rescheduleAppointment && (
        <PatientRescheduleModal
          appointment={rescheduleAppointment}
          existingAppointments={allAppointments}
          onClose={() => setRescheduleAppointment(null)}
          onDone={() => {
            setRescheduleAppointment(null);
            dispatch(refreshAppointments());
          }}
        />
      )}

      {/* Cancel Appointment Modal */}
      {cancelAppointment && (
        <CancelAppointmentModal
          appointment={cancelAppointment}
          onClose={() => setCancelAppointment(null)}
          onDone={() => {
            setCancelAppointment(null);
            dispatch(refreshAppointments());
            setActiveTab("cancelled");
          }}
        />
      )}
    </>
  );
}

export default function UserAppointmentsPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
        </div>
      }
    >
      <UserAppointmentsPage />
    </Suspense>
  );
}
