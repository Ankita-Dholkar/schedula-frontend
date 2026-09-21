"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  CalendarDays, CheckCircle2, XCircle, Clock,
  Search, X, Video, Building2, Filter,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { refreshAppointments } from "@/store/slices/appointmentsSlice";
import Badge from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/StateViews";
import AppointmentDetailDrawer from "@/features/admin-portal/components/AppointmentDetailDrawer";
import { getComputedAppointmentStatus } from "@/lib/mock-data/appointments";
import type { ComputedStatus } from "@/lib/mock-data/appointments";
import type { Appointment } from "@/types/appointment";

const PAGE_SIZE = 10;

type StatusFilter =
  | "all" | "upcoming" | "confirmed" | "pending"
  | "completed" | "cancelled" | "missed" | "rescheduled";

type ModeFilter   = "all" | "online" | "in-person";
type DateFilter   = "all" | "today" | "upcoming" | "past";

type AptWithComputed = Appointment & { _computed: ComputedStatus };

// Helpers
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

function statusConfig(s: ComputedStatus): { label: string; variant: BadgeVariant } {
  const map: Record<ComputedStatus, { label: string; variant: BadgeVariant }> = {
    confirmed:       { label: "Confirmed",     variant: "confirmed" },
    upcoming:        { label: "Upcoming",      variant: "confirmed" },
    "starting-soon": { label: "Starting Soon", variant: "confirmed" },
    live:            { label: "Live",          variant: "live"      },
    pending:         { label: "Pending",       variant: "pending"   },
    completed:       { label: "Completed",     variant: "completed" },
    cancelled:       { label: "Cancelled",     variant: "cancelled" },
    missed:          { label: "Missed",        variant: "missed"    },
  };
  return map[s] ?? { label: s, variant: "default" };
}

//MetricCard sub-component
function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[var(--ink)]">{value.toLocaleString()}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={21} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

//Filter Select
function FilterSelect({
  id,
  value,
  onChange,
  children,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-[var(--line)] bg-white py-2 pl-3 pr-8 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] cursor-pointer"
    >
      {children}
    </select>
  );
}

function getStoredPage(key: string): number {
  if (typeof window === "undefined") return 1;
  try {
    const params = new URLSearchParams(window.location.search);
    const urlP = parseInt(params.get("page") || "", 10);
    if (!isNaN(urlP) && urlP >= 1) return urlP;

    const saved = sessionStorage.getItem(key);
    const savedP = saved ? parseInt(saved, 10) : 1;
    if (!isNaN(savedP) && savedP >= 1) return savedP;
  } catch {
    /* ignore */
  }
  return 1;
}

//Main Page
export default function AdminAppointmentsPage() {
  const dispatch = useAppDispatch();
  const allAppointments = useAppSelector((s) => s.appointments.appointments);
  const doctors         = useAppSelector((s) => s.doctors.doctors);

  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>("all");
  const [modeFilter, setModeFilter]       = useState<ModeFilter>("all");
  const [doctorFilter, setDoctorFilter]   = useState("all");
  const [dateFilter, setDateFilter]       = useState<DateFilter>("all");
  const [page, setPage]         = useState<number>(() => getStoredPage("admin_appointments_page"));
  const [drawerApt, setDrawerApt] = useState<Appointment | null>(null);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("admin_appointments_page", String(newPage));
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(newPage));
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Sync client on mount with URL/sessionStorage
  useEffect(() => {
    const p = getStoredPage("admin_appointments_page");
    if (p !== page) {
      setPage(p);
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("page") !== String(p)) {
        params.set("page", String(p));
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
      }
    }
  }, []);

  const load = useCallback(() => {
    try {
      dispatch(refreshAppointments());
      setError(null);
    } catch {
      setError("Failed to load appointment data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    load();
    const onFocus = () => dispatch(refreshAppointments());
    window.addEventListener("focus", onFocus);
    const poll = setInterval(() => dispatch(refreshAppointments()), 30_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(poll);
    };
  }, [load, dispatch]);

  // Enrich with computed status
  const appointmentsWithComputed = useMemo<AptWithComputed[]>(
    () =>
      allAppointments.map((a) => ({
        ...a,
        _computed: getComputedAppointmentStatus(a) as ComputedStatus,
      })),
    [allAppointments]
  );

  //Metrics
  const metrics = useMemo(() => {
    const total      = appointmentsWithComputed.length;
    const upcoming   = appointmentsWithComputed.filter(
      (a) => ["confirmed", "upcoming", "pending", "starting-soon", "live"].includes(a._computed)
    ).length;
    const completed  = appointmentsWithComputed.filter((a) => a._computed === "completed").length;
    const cancelledOrRescheduled = appointmentsWithComputed.filter(
      (a) => a._computed === "cancelled" || a.isRescheduled
    ).length;
    return { total, upcoming, completed, cancelledOrRescheduled };
  }, [appointmentsWithComputed]);

  // Unique doctor names for dropdown
  const doctorNames = useMemo(() => {
    const names = new Set(allAppointments.map((a) => a.clinician));
    return Array.from(names).sort();
  }, [allAppointments]);

  //Filtered list 
  const filtered = useMemo<AptWithComputed[]>(() => {
    const q   = search.trim().toLowerCase();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return appointmentsWithComputed.filter((a) => {
      // Search: patient name, doctor name, appointment ID
      const matchSearch =
        !q ||
        a.patient.name.toLowerCase().includes(q) ||
        a.clinician.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q);

      // Status filter (rescheduled is a virtual filter on the isRescheduled flag)
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "rescheduled" && a.isRescheduled) ||
        (statusFilter !== "rescheduled" && a._computed === statusFilter);

      // Mode filter
      const matchMode =
        modeFilter === "all" ||
        a.appointmentMode === modeFilter;

      // Doctor filter
      const matchDoctor =
        doctorFilter === "all" || a.clinician === doctorFilter;

      // Date filter
      const aptDate = a.startsAt.slice(0, 10);
      const matchDate =
        dateFilter === "all" ||
        (dateFilter === "today"    && aptDate === todayStr) ||
        (dateFilter === "upcoming" && new Date(a.startsAt) > now) ||
        (dateFilter === "past"     && new Date(a.startsAt) < now);

      return matchSearch && matchStatus && matchMode && matchDoctor && matchDate;
    }).sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  }, [appointmentsWithComputed, search, statusFilter, modeFilter, doctorFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page on filter change (skip initial mount to preserve URL page)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    handlePageChange(1);
  }, [search, statusFilter, modeFilter, doctorFilter, dateFilter, handlePageChange]);

  // Only clamp AFTER data has loaded and settled
  useEffect(() => {
    if (!loading && filtered.length > 0 && page > totalPages) {
      handlePageChange(totalPages);
    }
  }, [loading, filtered.length, page, totalPages, handlePageChange]);


  const hasActiveFilters = search || statusFilter !== "all" || modeFilter !== "all" || doctorFilter !== "all" || dateFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setModeFilter("all");
    setDoctorFilter("all");
    setDateFilter("all");
  };

  //Render
  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-7xl mx-auto">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--ink)]">Appointment Management</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          View and filter all patient appointments across all doctors and statuses.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Appointments"       value={metrics.total}                 icon={CalendarDays}  iconBg="bg-blue-50"    iconColor="text-blue-600"    />
        <MetricCard label="Upcoming / Confirmed"     value={metrics.upcoming}              icon={Clock}         iconBg="bg-violet-50"  iconColor="text-violet-600"  />
        <MetricCard label="Completed"                value={metrics.completed}             icon={CheckCircle2}  iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <MetricCard label="Cancelled / Rescheduled" value={metrics.cancelledOrRescheduled} icon={XCircle}       iconBg="bg-red-50"     iconColor="text-red-500"     />
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        {/* Search row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              id="appointment-search"
              type="text"
              placeholder="Search patient, doctor or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-white py-2.5 pl-9 pr-9 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] placeholder:text-stone-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-medium text-[var(--muted)] hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
            <Filter size={12} /> Filters:
          </span>

          {/* Status */}
          <FilterSelect id="status-filter" value={statusFilter} onChange={(v) => setStatusFilter(v as StatusFilter)}>
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="missed">Missed</option>
          </FilterSelect>

          {/* Mode */}
          <FilterSelect id="mode-filter" value={modeFilter} onChange={(v) => setModeFilter(v as ModeFilter)}>
            <option value="all">All Modes</option>
            <option value="online">Online</option>
            <option value="in-person">In-Person</option>
          </FilterSelect>

          {/* Doctor */}
          <FilterSelect id="doctor-filter" value={doctorFilter} onChange={setDoctorFilter}>
            <option value="all">All Doctors</option>
            {doctorNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </FilterSelect>

          {/* Date */}
          <FilterSelect id="date-filter" value={dateFilter} onChange={(v) => setDateFilter(v as DateFilter)}>
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </FilterSelect>
        </div>
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="text-xs text-[var(--muted)]">
          Showing <span className="font-semibold text-[var(--ink)]">{filtered.length}</span> appointment{filtered.length !== 1 ? "s" : ""}
          {hasActiveFilters && <span> · <button onClick={clearFilters} className="text-[var(--brand)] hover:underline">clear filters</button></span>}
        </p>
      )}

      {/* Table / States */}
      <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Loading appointments…" />
        ) : error ? (
          <ErrorState
            title="Failed to load appointments"
            message={error}
            onRetry={load}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={26} />}
            title="No appointments found"
            message={
              hasActiveFilters
                ? "No appointments match the selected filters. Try adjusting your search or filters."
                : "No appointments have been booked yet."
            }
            action={
              hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-xs font-medium text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--canvas)]">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Appointment
                    </th>
                    <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)] sm:table-cell">
                      Patient
                    </th>
                    <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)] md:table-cell">
                      Doctor & Specialty
                    </th>
                    <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)] lg:table-cell">
                      Date & Time
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Status
                    </th>
                    <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)] md:table-cell">
                      Payment
                    </th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {paginated.map((apt) => {
                    const { label, variant } = statusConfig(apt._computed);
                    const isOnline = apt.appointmentMode === "online";
                    return (
                      <tr key={apt.id} className="hover:bg-[var(--canvas)] transition-colors">

                        {/* ID + Mode */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                              ${isOnline ? "bg-violet-50 text-violet-600" : "bg-teal-50 text-teal-600"}`}>
                              {isOnline ? <Video size={13} /> : <Building2 size={13} />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-mono text-xs font-medium text-[var(--ink)]">{apt.id}</p>
                              <p className="text-[10px] text-[var(--muted)]">
                                {isOnline ? "Online" : "In-Person"}
                                {apt.isRescheduled && " · Rescheduled"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Patient */}
                        <td className="hidden px-4 py-4 sm:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-[10px] font-bold text-white">
                              {apt.patient.initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--ink)] truncate">{apt.patient.name}</p>
                              <p className="text-xs text-[var(--muted)]">Age {apt.patient.age}</p>
                            </div>
                          </div>
                        </td>

                        {/* Doctor */}
                        <td className="hidden px-4 py-4 md:table-cell">
                          <p className="font-medium text-[var(--ink)] truncate max-w-[160px]">{apt.clinician}</p>
                          <p className="text-xs text-[var(--muted)]">{apt.specialty}</p>
                        </td>

                        {/* Date & Time */}
                        <td className="hidden px-4 py-4 lg:table-cell">
                          <p className="font-medium text-[var(--ink)]">{fmtDate(apt.startsAt)}</p>
                          <p className="text-xs text-[var(--muted)]">{fmtTime(apt.startsAt)} · {apt.durationMinutes}m</p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <Badge variant={variant} label={label} dot />
                        </td>

                        {/* Payment */}
                        <td className="hidden px-4 py-4 md:table-cell">
                          {apt.paymentStatus ? (
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold
                              ${apt.paymentStatus === "paid"    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : ""}
                              ${apt.paymentStatus === "pending" ? "bg-amber-50 text-amber-700 border border-amber-200"      : ""}
                              ${apt.paymentStatus === "failed"  ? "bg-red-50 text-red-700 border border-red-200"           : ""}
                            `}>
                              {apt.paymentStatus.charAt(0).toUpperCase() + apt.paymentStatus.slice(1)}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--muted)]">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          <button
                            id={`apt-view-${apt.id}`}
                            onClick={() => setDrawerApt(apt)}
                            className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--line)] px-5 py-4">
                <p className="text-xs text-[var(--muted)]">
                  Page {page} of {totalPages}
                </p>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Appointment Detail Drawer */}
      <AppointmentDetailDrawer
        appointment={drawerApt}
        open={!!drawerApt}
        onClose={() => setDrawerApt(null)}
      />
    </div>
  );
}
