"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Search, X, User, Calendar, Video, Building2 } from "lucide-react";
import {
  getAllAppointments,
  getComputedAppointmentStatus,
} from "@/lib/mock-data/appointments";
import type { ComputedStatus } from "@/lib/mock-data/appointments";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import DoctorPortalHeader from "@/features/doctor-portal/components/DoctorPortalHeader";
import AppointmentDetailPanel from "@/features/doctor-portal/components/AppointmentDetailPanel";

type StoredUser = { id: string; name: string; email: string; role: string };
type FilterTab = "all" | ComputedStatus;
type AptWithComputed = Appointment & { _computed: ComputedStatus };

const ALL_TABS: { value: FilterTab; label: string; color: string }[] = [
  { value: "all",            label: "All",           color: "" },
  { value: "pending",        label: "Pending",        color: "amber" },
  { value: "upcoming",       label: "Upcoming",       color: "blue" },
  { value: "starting-soon",  label: "Starting Soon",  color: "orange" },
  { value: "live",           label: "Live",           color: "green" },
  { value: "confirmed",      label: "Confirmed",      color: "emerald" },
  { value: "completed",      label: "Completed",      color: "stone" },
  { value: "cancelled",      label: "Cancelled",      color: "stone" },
  { value: "missed",         label: "Missed",         color: "red" },
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

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

export default function DoctorAppointmentsPage() {
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
    const poll = setInterval(refreshAppointments, 30_000);
    return () => {
      window.removeEventListener("focus", refreshAppointments);
      clearInterval(poll);
    };
  }, [refreshAppointments]);

  const appointmentsWithComputed = useMemo<AptWithComputed[]>(() =>
    myAppointments.map((a) => ({ ...a, _computed: getComputedAppointmentStatus(a) })),
    [myAppointments]
  );

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = {
      all: 0, pending: 0, upcoming: 0, "starting-soon": 0, live: 0,
      confirmed: 0, completed: 0, cancelled: 0, missed: 0,
    };
    c.all = appointmentsWithComputed.length;
    appointmentsWithComputed.forEach((a) => { c[a._computed]++; });
    return c;
  }, [appointmentsWithComputed]);

  const filtered = useMemo<AptWithComputed[]>(() =>
    appointmentsWithComputed
      .filter((a) => {
        if (activeTab !== "all" && a._computed !== activeTab) return false;
        const q = search.trim().toLowerCase();
        if (q) {
          const hit =
            a.patient.name.toLowerCase().includes(q) ||
            a.reason.toLowerCase().includes(q) ||
            (a.type ?? "").toLowerCase().includes(q) ||
            (a.room ?? "").toLowerCase().includes(q) ||
            (a.location?.name ?? "").toLowerCase().includes(q);
          if (!hit) return false;
        }
        const aptDate = a.startsAt.split("T")[0];
        if (dateFrom && aptDate < dateFrom) return false;
        if (dateTo && aptDate > dateTo) return false;
        return true;
      })
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()),
    [appointmentsWithComputed, activeTab, search, dateFrom, dateTo]
  );

  const hasFilters = search || dateFrom || dateTo;

  return (
    <>
      <DoctorPortalHeader title="Appointments" />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">Appointments</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Manage, confirm, and track all patient appointments.
          </p>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────── */}
        <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1">
          {ALL_TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === value
                  ? "bg-white text-[var(--ink)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === value ? "bg-stone-100 text-[var(--ink)]" : "text-[var(--muted)]"
              }`}>
                {counts[value]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Search + date filters ─────────────────────────────────── */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Patient, reason, type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56 rounded-lg border border-[var(--line)] bg-white pl-8 pr-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-lg border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)]"
            />
            <span className="text-xs text-[var(--muted)]">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-lg border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)]"
            />
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}
              className="flex items-center gap-1 text-xs text-[var(--muted)] transition hover:text-[var(--ink)]"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* ── Table ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--line)] bg-white">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm font-medium text-[var(--muted)]">No appointments match your filters.</p>
              <button
                type="button"
                onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setActiveTab("all"); }}
                className="mt-2 text-xs font-medium text-[var(--brand)] hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--canvas)]">
                    {["#", "Patient", "Date & Time", "Mode", "Type", "Reason", "Location", "Status", "Payment", ""].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)] ${
                          i >= 4 && i <= 6 ? "hidden sm:table-cell" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filtered.map((apt, idx) => (
                    <tr
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className="cursor-pointer transition hover:bg-[var(--canvas)]"
                    >
                      <td className="px-5 py-3.5 text-xs text-[var(--muted)]">{idx + 1}</td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-[var(--brand)]">
                            {apt.patient.initials}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--ink)]">{apt.patient.name}</p>
                            <p className="text-xs text-[var(--muted)]">Age {apt.patient.age}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[var(--ink)]">{formatTime(apt.startsAt)}</p>
                        <p className="text-xs text-[var(--muted)]">{formatDate(apt.startsAt)}</p>
                      </td>

                      <td className="px-5 py-3.5">
                        {apt.appointmentMode === "online" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
                            <Video size={10} /> Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-200">
                            <Building2 size={10} /> In-person
                          </span>
                        )}
                      </td>

                      <td className="hidden sm:table-cell px-5 py-3.5 text-[var(--muted)]">{apt.type ?? "—"}</td>

                      <td className="hidden sm:table-cell max-w-[160px] truncate px-5 py-3.5 text-[var(--muted)]">{apt.reason}</td>

                      <td className="hidden sm:table-cell px-5 py-3.5 text-[var(--muted)]">
                        {apt.appointmentMode === "online" ? (
                          <span className="text-xs italic text-slate-400">Video Consultation</span>
                        ) : (
                          <span className="text-xs">
                            {apt.location?.name ?? apt.room ?? "—"}
                            {apt.room && apt.location && (
                              <span className="block text-[10px] text-stone-400">{apt.room}</span>
                            )}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_STYLES[apt._computed]}`}>
                          {STATUS_LABELS[apt._computed]}
                        </span>
                      </td>

                      {/* Payment badge */}
                      <td className="px-5 py-3.5">
                        {apt.paymentStatus === "paid" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            Paid
                          </span>
                        ) : apt.paymentStatus === "failed" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedAppointment(apt)}
                            className="rounded p-1.5 text-[var(--muted)] transition hover:bg-stone-100 hover:text-[var(--ink)]"
                            title="Patient details"
                          >
                            <User size={15} />
                          </button>
                          <button
                            onClick={() => setSelectedAppointment(apt)}
                            className="rounded p-1.5 text-[var(--muted)] transition hover:bg-stone-100 hover:text-[var(--ink)]"
                            title="Appointment details"
                          >
                            <Calendar size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-[var(--line)] px-5 py-3 text-xs text-[var(--muted)]">
                Showing{" "}
                <strong className="text-[var(--ink)]">{filtered.length}</strong> of{" "}
                <strong className="text-[var(--ink)]">{myAppointments.length}</strong> appointments
              </div>
            </div>
          )}
        </div>
      </main>

      <AppointmentDetailPanel
        appointment={selectedAppointment}
        appointments={myAppointments}
        onClose={() => { setSelectedAppointment(null); refreshAppointments(); }}
        onRefresh={refreshAppointments}
      />
    </>
  );
}
