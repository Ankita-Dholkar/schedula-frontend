"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck, Clock, CheckCircle, XCircle,
  User, ChevronRight, Calendar,
} from "lucide-react";
import { getAllAppointments, updateAppointmentStatus, getComputedAppointmentStatus } from "@/lib/mock-data/appointments";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import DoctorPortalHeader from "@/features/doctor-portal/components/DoctorPortalHeader";
import AppointmentDetailPanel from "@/features/doctor-portal/components/AppointmentDetailPanel";
import RescheduleCalendarModal from "@/features/doctor-portal/components/RescheduleCalendarModal";

type StoredUser = { id: string; name: string; email: string; role: string };

const statusConfig: Record<AppointmentStatus | "upcoming", { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  upcoming:  { label: "Upcoming",  className: "bg-blue-50 text-blue-700 ring-blue-200" },
  pending:   { label: "Pending",   className: "bg-amber-50 text-amber-700 ring-amber-200" },
  cancelled: { label: "Cancelled", className: "bg-stone-100 text-stone-600 ring-stone-200" },
  completed: { label: "Completed", className: "bg-stone-100 text-stone-700 ring-stone-200" },
  missed:    { label: "Missed",    className: "bg-red-100 text-red-800 ring-red-300" },
};

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

const isSameDate = (iso: string, dateStr: string) => iso.startsWith(dateStr);

export default function DoctorDashboardPage() {
  const [doctorName, setDoctorName] = useState<string>("");
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  // Read appointments fresh from localStorage — called on mount AND on window focus
  const refreshAppointments = () => {
    try {
      const stored = localStorage.getItem("loggedInUser");
      if (stored) {
        const user: StoredUser = JSON.parse(stored);
        setDoctorName(user.name);
        const mine = getAllAppointments().filter((a) => a.clinician === user.name);
        setMyAppointments(mine);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshAppointments();
    window.addEventListener("focus", refreshAppointments);
    return () => window.removeEventListener("focus", refreshAppointments);
  }, []);

  // Today's appointments only (for stats cards)
  const todayApts = myAppointments.filter((a) => isSameDate(a.startsAt, todayStr));

  const todayCounts = {
    total:     todayApts.length,
    confirmed: todayApts.filter((a) => a.status === "confirmed").length,
    pending:   todayApts.filter((a) => a.status === "pending").length,
    cancelled: todayApts.filter((a) => a.status === "cancelled").length,
  };

  // Overall totals (all-time) for the secondary strip
  const allCounts = {
    total:     myAppointments.length,
    confirmed: myAppointments.filter((a) => a.status === "confirmed").length,
    pending:   myAppointments.filter((a) => a.status === "pending").length,
  };

  // Upcoming: future pending or confirmed
  const upcoming = myAppointments
    .filter((a) => {
      const computed = getComputedAppointmentStatus(a);
      return computed === "pending" || computed === "upcoming";
    })
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 5);

  const today = new Intl.DateTimeFormat("en", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());

  return (
    <>
      <DoctorPortalHeader title="Dashboard" />

      <main className="flex-1 px-6 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--brand)]">{today}</p>
          <h2 className="mt-1 text-2xl font-semibold text-[var(--ink)]">
            Welcome back, {doctorName || "Doctor"} 👋
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Here is a summary of your appointments for today.
          </p>
        </div>

        {/* Today's Stats Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Today's Total",   value: todayCounts.total },
            { label: "Confirmed",        value: todayCounts.confirmed },
            { label: "Pending",          value: todayCounts.pending },
            { label: "Cancelled",        value: todayCounts.cancelled },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col justify-center rounded-2xl border border-[var(--line)] bg-white px-6 py-5 shadow-sm">
              <p className="text-xl font-bold text-[var(--ink)]">{label}</p>
              <p className="mt-2 text-5xl font-extrabold tracking-tight text-[var(--brand)]">{value}</p>
            </div>
          ))}
        </div>

        {/* All-time summary strip */}
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-[var(--line)] bg-white px-5 py-3">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span>All-time:</span>
          </div>
          {[
            { label: "Total appointments", value: allCounts.total     },
            { label: "Confirmed",           value: allCounts.confirmed },
            { label: "Pending",             value: allCounts.pending   },
          ].map(({ label, value }) => (
            <span key={label} className="text-sm text-[var(--muted)]">
              <strong className="text-[var(--ink)]">{value}</strong> {label}
            </span>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "My Profile",          href: "/doctor/profile",       icon: User          },
              { label: "All Appointments",    href: "/doctor/appointments",  icon: CalendarCheck },
              { label: "Manage Availability", href: "/doctor/profile",       icon: Clock         },
              { label: "Today's Schedule",    href: "/doctor/appointments",  icon: Calendar      },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white px-4 py-3.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={17} strokeWidth={1.8} />
                  {label}
                </div>
                <ChevronRight size={15} className="text-[var(--muted)]" />
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Appointments Table */}
        <div className="mt-6 rounded-xl border border-[var(--line)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
            <h3 className="font-semibold text-[var(--ink)]">Upcoming Appointments</h3>
            <Link href="/doctor/appointments" className="text-xs font-medium text-[var(--brand)] hover:underline">
              View all
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="py-14 text-center">
              <CalendarCheck size={36} className="mx-auto mb-3 text-[var(--line)]" strokeWidth={1.4} />
              <p className="text-sm font-medium text-[var(--muted)]">No upcoming appointments</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                New patient bookings will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--canvas)]">
                    {["Patient", "Date & Time", "Type", "Mode", "Reason", "Duration", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {upcoming.map((apt) => {
                    const computedStatus = getComputedAppointmentStatus(apt);
                    const { label, className } = statusConfig[computedStatus];
                    return (
                      <tr key={apt.id} className="transition hover:bg-[var(--canvas)]">
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
                        <td className="px-5 py-3.5 text-[var(--muted)]">
                          <p className="font-medium text-[var(--ink)]">{formatTime(apt.startsAt)}</p>
                          <p className="text-xs">{formatDate(apt.startsAt)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          {apt.type ? (
                            <span className="inline-flex rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
                              {apt.type}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--muted)]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {apt.appointmentMode ? (
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                              apt.appointmentMode === "online"
                                ? "bg-violet-50 text-violet-700 ring-violet-200"
                                : "bg-stone-50 text-stone-600 ring-stone-200"
                            }`}>
                              {apt.appointmentMode === "online" ? "Online" : "In-person"}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--muted)]">—</span>
                          )}
                        </td>
                        <td className="max-w-[160px] truncate px-5 py-3.5 text-[var(--muted)]">{apt.reason}</td>
                        <td className="px-5 py-3.5 text-[var(--muted)]">{apt.durationMinutes} min</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${className}`}>
                            {label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedAppointment(apt)}
                              className="rounded p-1.5 text-[var(--muted)] hover:bg-stone-100 hover:text-[var(--ink)] transition"
                              title="View Patient Details"
                            >
                              <User size={16} />
                            </button>
                            <button
                              onClick={() => setIsCalendarModalOpen(true)}
                              className="rounded p-1.5 text-[var(--muted)] hover:bg-stone-100 hover:text-[var(--ink)] transition"
                              title="Reschedule in Calendar"
                            >
                              <Calendar size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <AppointmentDetailPanel
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onRefresh={refreshAppointments}
      />
      {isCalendarModalOpen && (
        <RescheduleCalendarModal
          appointments={myAppointments}
          onClose={() => setIsCalendarModalOpen(false)}
          onRefresh={refreshAppointments}
          onSelectAppointment={(apt) => {
            setSelectedAppointment(apt);
            setIsCalendarModalOpen(false);
          }}
        />
      )}
    </>
  );
}
