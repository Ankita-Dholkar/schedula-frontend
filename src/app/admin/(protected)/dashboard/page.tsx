"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { mockPatients, getAllPatients } from "@/lib/mock-data/patients";
import {
  Users,
  Stethoscope,
  CalendarDays,
  UserCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
} from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { Doctor } from "@/types/doctor";


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getStatusConfig(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    confirmed:      { label: "Confirmed",    color: "text-violet-700", bg: "bg-violet-50" },
    pending:        { label: "Pending",      color: "text-amber-700",  bg: "bg-amber-50"  },
    completed:      { label: "Completed",    color: "text-emerald-700",bg: "bg-emerald-50"},
    cancelled:      { label: "Cancelled",    color: "text-red-700",    bg: "bg-red-50"    },
    missed:         { label: "Missed",       color: "text-rose-700",   bg: "bg-rose-50"   },
    "starting-soon":{ label: "Starting Soon",color: "text-blue-700",   bg: "bg-blue-50"   },
    live:           { label: "Live",         color: "text-green-700",  bg: "bg-green-50"  },
  };
  return map[status] ?? { label: status, color: "text-gray-600", bg: "bg-gray-100" };
}

//Sub-components

function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  delta,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  delta?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[var(--ink)]">{value.toLocaleString()}</p>
          {delta && (
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <TrendingUp size={12} />
              {delta}
            </p>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={21} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusConfig(status);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

//Trend bar chart (CSS only, no library) 
function AppointmentTrend({ appointments }: { appointments: Appointment[] }) {
  const days = useMemo(() => {
    const result: { label: string; total: number; completed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-IN", { weekday: "short" });
      const dayApts = appointments.filter((a) => a.startsAt.startsWith(dateStr));
      result.push({ label, total: dayApts.length, completed: dayApts.filter((a) => a.status === "completed").length });
    }
    return result;
  }, [appointments]);

  const maxTotal = Math.max(...days.map((d) => d.total), 1);

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--ink)]">Appointment Trend</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Last 7 days</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-[var(--muted)]">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--brand)]" />
            Total
          </span>
          <span className="flex items-center gap-1.5 text-[var(--muted)]">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            Completed
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 h-32">
        {days.map((day) => (
          <div key={day.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative w-full flex flex-col items-center justify-end h-24 gap-0.5">
              {/* total bar */}
              <div
                className="w-full rounded-t-md bg-[var(--brand)]/20 transition-all duration-500"
                style={{ height: `${(day.total / maxTotal) * 100}%`, minHeight: day.total > 0 ? "4px" : "0" }}
              />
              {/* completed bar (overlaid) */}
              {day.completed > 0 && (
                <div
                  className="absolute bottom-0 w-full rounded-t-md bg-emerald-400 transition-all duration-500"
                  style={{ height: `${(day.completed / maxTotal) * 100}%` }}
                />
              )}
            </div>
            <span className="text-[10px] font-medium text-[var(--muted)]">{day.label}</span>
            <span className="text-[10px] font-bold text-[var(--ink)]">{day.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Dashboard Page 
export default function AdminDashboardPage() {
  const appointments = useAppSelector((s) => s.appointments.appointments);
  const doctors = useAppSelector((s) => s.doctors.doctors);

  // Derived metrics 
  const totalDoctors      = doctors.length;
  const totalAppointments = appointments.length;

  // Total Patients = unique registered patient accounts (static mock + runtime signup)
  const [totalPatients, setTotalPatients] = useState(mockPatients.length);

  useEffect(() => {
    const updatePatients = () => {
      setTotalPatients(getAllPatients().length);
    };
    updatePatients();
    window.addEventListener("storage", updatePatients);
    window.addEventListener("focus", updatePatients);
    return () => {
      window.removeEventListener("storage", updatePatients);
      window.removeEventListener("focus", updatePatients);
    };
  }, []);

  const now = new Date();

  const upcoming = useMemo(
    () => appointments.filter((a) => ["confirmed", "pending", "starting-soon"].includes(a.status) && new Date(a.startsAt) >= now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appointments]
  );
  const completed = useMemo(
    () => appointments.filter((a) => a.status === "completed"),
    [appointments]
  );

  // Pending Verifications = doctors awaiting admin approval (source of truth: doctor.verificationStatus)
  const pendingVerifications = useMemo(
    () => doctors.filter((d) => d.verificationStatus === "pending").length,
    [doctors]
  );

  // Recent data (last 5)
  const recentAppointments = useMemo(
    () => [...appointments].sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()).slice(0, 5),
    [appointments]
  );

  // Registered Doctors list = all doctors, sorted verified first, then pending
  const recentDoctors: Doctor[] = useMemo(
    () => [...doctors].sort((a, b) => {
      // verified first, pending last
      if (a.verificationStatus === b.verificationStatus) return 0;
      return a.verificationStatus === "verified" ? -1 : 1;
    }),
    [doctors]
  );

  // Status breakdown 
  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    appointments.forEach((a) => { map[a.status] = (map[a.status] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [appointments]);

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-7xl mx-auto">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--ink)]">Admin Dashboard</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Top metric cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Doctors"      value={totalDoctors}       icon={Stethoscope}  iconColor="text-[var(--brand)]"    iconBg="bg-teal-50" />
        <MetricCard label="Total Patients"     value={totalPatients}      icon={Users}        iconColor="text-violet-600"         iconBg="bg-violet-50" />
        <MetricCard label="Total Appointments" value={totalAppointments}  icon={CalendarDays} iconColor="text-blue-600"           iconBg="bg-blue-50" />
        <MetricCard label="Pending Verifications" value={pendingVerifications} icon={UserCheck} iconColor="text-amber-600"       iconBg="bg-amber-50" />
      </div>

      {/* ── Secondary metrics row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Clock size={19} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--muted)] font-medium">Upcoming</p>
                <p className="text-2xl font-bold text-[var(--ink)]">{upcoming.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <CheckCircle2 size={19} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--muted)] font-medium">Completed</p>
                <p className="text-2xl font-bold text-[var(--ink)]">{completed.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="col-span-2 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-[var(--ink)] flex items-center gap-2">
            <Activity size={15} className="text-[var(--brand)]" />
            Status Breakdown
          </p>
          {statusBreakdown.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">No appointments found.</p>
          ) : (
            <div className="space-y-2">
              {statusBreakdown.map(([status, count]) => {
                const pct = Math.round((count / totalAppointments) * 100);
                const cfg = getStatusConfig(status);
                return (
                  <div key={status} className="flex items-center gap-3">
                    <StatusBadge status={status} />
                    <div className="flex-1 overflow-hidden rounded-full bg-gray-100 h-1.5">
                      <div
                        className="h-full rounded-full bg-[var(--brand)] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[var(--ink)] w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Trend chart ── */}
      <AppointmentTrend appointments={appointments} />

      {/* ── Recent Appointments + Doctors ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* Recent Appointments — 3 cols */}
        <div className="lg:col-span-3 rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Recent Appointments</h2>
            <span className="text-xs text-[var(--muted)]">Last 5</span>
          </div>
          {recentAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--muted)]">
              <AlertCircle size={28} className="mb-2 text-[var(--line)]" />
              <p className="text-sm">No appointments yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {recentAppointments.map((apt) => (
                <li key={apt.id} className="flex items-start justify-between gap-3 px-5 py-3.5 hover:bg-[var(--canvas)] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-xs font-bold text-[var(--brand)]">
                      {apt.patient.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--ink)]">{apt.patient.name}</p>
                      <p className="truncate text-xs text-[var(--muted)]">{apt.clinician} · {apt.specialty}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {formatDate(apt.startsAt)}, {formatTime(apt.startsAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Doctors — 2 cols */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Registered Doctors</h2>
            <span className="text-xs text-[var(--muted)]">{totalDoctors} total</span>
          </div>
          {recentDoctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--muted)]">
              <XCircle size={28} className="mb-2 text-[var(--line)]" />
              <p className="text-sm">No doctors found.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {recentDoctors.map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--canvas)] transition-colors">
                  {/* Avatar or image */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white overflow-hidden">
                    {doc.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={doc.image} alt={doc.name} className="h-full w-full object-cover" />
                    ) : (
                      doc.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">{doc.name}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{doc.specialization}</p>
                  </div>
                  {doc.verificationStatus === "verified" ? (
                    <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Verified
                    </span>
                  ) : (
                    <span className="ml-auto shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Pending
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
