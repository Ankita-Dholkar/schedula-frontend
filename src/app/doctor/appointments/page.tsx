"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { getAllAppointments } from "@/lib/mock-data/appointments";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import DoctorPortalHeader from "@/features/doctor-portal/components/DoctorPortalHeader";

type StoredUser = { id: string; name: string; email: string; role: string };
type FilterStatus = "all" | AppointmentStatus;

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  pending:   { label: "Pending",   className: "bg-amber-50 text-amber-700 ring-amber-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-600 ring-red-200" },
};

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

export default function DoctorAppointmentsPage() {
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const refreshAppointments = () => {
    try {
      const stored = localStorage.getItem("loggedInUser");
      if (stored) {
        const user: StoredUser = JSON.parse(stored);
        setMyAppointments(getAllAppointments().filter((a) => a.clinician === user.name));
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    refreshAppointments();
    window.addEventListener("focus", refreshAppointments);
    return () => window.removeEventListener("focus", refreshAppointments);
  }, []);

  const filtered = useMemo(() => {
    return myAppointments.filter((a) => {
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        a.patient.name.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q) ||
        a.room.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [myAppointments, search, statusFilter]);

  const counts = {
    all: myAppointments.length,
    confirmed: myAppointments.filter((a) => a.status === "confirmed").length,
    pending:   myAppointments.filter((a) => a.status === "pending").length,
    cancelled: myAppointments.filter((a) => a.status === "cancelled").length,
  };

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: `All (${counts.all})`,               value: "all" },
    { label: `Confirmed (${counts.confirmed})`,   value: "confirmed" },
    { label: `Pending (${counts.pending})`,       value: "pending" },
    { label: `Cancelled (${counts.cancelled})`,   value: "cancelled" },
  ];

  return (
    <>
      <DoctorPortalHeader title="All Appointments" />

      <main className="flex-1 px-6 py-6">
        {/* Page heading */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">All Appointments</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            A complete list of all your patient appointments.
          </p>
        </div>

        {/* Controls */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {filterButtons.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === value
                    ? "bg-[var(--brand)] text-white"
                    : "border border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
            <input
              type="text"
              placeholder="Search patient, reason…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-[var(--line)] bg-white pl-8 pr-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[var(--line)] bg-white">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Filter size={32} className="mx-auto mb-3 text-[var(--line)]" strokeWidth={1.4} />
              <p className="text-sm font-medium text-[var(--muted)]">
                No appointments match your filters.
              </p>
              <button
                type="button"
                onClick={() => { setSearch(""); setStatusFilter("all"); }}
                className="mt-2 text-xs font-medium text-[var(--brand)] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--canvas)]">
                    {["#", "Patient", "Date & Time", "Duration", "Reason", "Room", "Status"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filtered.map((apt, index) => {
                    const { label, className } = statusConfig[apt.status];
                    return (
                      <tr key={apt.id} className="transition hover:bg-[var(--canvas)]">
                        {/* # */}
                        <td className="px-5 py-3.5 text-xs text-[var(--muted)]">
                          {index + 1}
                        </td>

                        {/* Patient */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-[var(--brand)]">
                              {apt.patient.initials}
                            </div>
                            <div>
                              <p className="font-medium text-[var(--ink)]">
                                {apt.patient.name}
                              </p>
                              <p className="text-xs text-[var(--muted)]">
                                Age {apt.patient.age}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-[var(--ink)]">
                            {formatTime(apt.startsAt)}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {formatDate(apt.startsAt)}
                          </p>
                        </td>

                        {/* Duration */}
                        <td className="px-5 py-3.5 text-[var(--muted)]">
                          {apt.durationMinutes} min
                        </td>

                        {/* Reason */}
                        <td className="max-w-[160px] truncate px-5 py-3.5 text-[var(--muted)]">
                          {apt.reason}
                        </td>

                        {/* Room */}
                        <td className="px-5 py-3.5 text-[var(--muted)]">
                          {apt.room}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${className}`}
                          >
                            {label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer */}
              <div className="border-t border-[var(--line)] px-5 py-3 text-xs text-[var(--muted)]">
                Showing <strong className="text-[var(--ink)]">{filtered.length}</strong> of{" "}
                <strong className="text-[var(--ink)]">{myAppointments.length}</strong> appointments
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
