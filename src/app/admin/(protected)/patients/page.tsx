"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, UserPlus,
  Search, X, RefreshCw,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  refreshPatients,
  setPatientAccountStatus,
} from "@/store/slices/patientsSlice";
import { refreshAppointments } from "@/store/slices/appointmentsSlice";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/StateViews";
import PatientDetailDrawer from "@/features/admin-portal/components/PatientDetailDrawer";
import ConfirmationDialog from "@/features/admin-portal/components/ConfirmationDialog";
import type { PatientUser } from "@/types/user";

const PAGE_SIZE = 8;

type StatusFilter = "all" | "active" | "inactive";

// Helpers
const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

//Main Page

export default function AdminPatientsPage() {
  const dispatch = useAppDispatch();
  const patients = useAppSelector((s) => s.patients.patients);
  const allAppointments = useAppSelector((s) => s.appointments.appointments);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const [drawerPatient, setDrawerPatient] = useState<PatientUser | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    patient: PatientUser;
    mode: "activate_patient" | "deactivate_patient";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load patients on mount
  const load = useCallback(() => {
    try {
      dispatch(refreshPatients());
      dispatch(refreshAppointments());
      setError(null);
    } catch {
      setError("Failed to load patient data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    load();
    // Re-sync when tab regains focus (picks up new registrations from localStorage)
    const onFocus = () => dispatch(refreshPatients());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load, dispatch]);

  // Metrics
  const metrics = useMemo(() => {
    const total    = patients.length;
    const active   = patients.filter((p) => p.accountStatus !== "inactive").length;
    const inactive = patients.filter((p) => p.accountStatus === "inactive").length;
    // "New" = registered in last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newCount = patients.filter(
      (p) => p.registeredAt && new Date(p.registeredAt).getTime() > thirtyDaysAgo
    ).length;
    return { total, active, inactive, newCount };
  }, [patients]);

  //Appointment count per patient
  const appointmentCountByPatient = useMemo(() => {
    const map: Record<string, number> = {};
    allAppointments.forEach((a) => {
      // Match by name since appointment model stores patient name, not id
      const match = patients.find((p) => p.name === a.patient.name);
      if (match) map[match.id] = (map[match.id] ?? 0) + 1;
    });
    return map;
  }, [allAppointments, patients]);

  //Filtered list 
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patients.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.mobile.includes(q);

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active"   && p.accountStatus !== "inactive") ||
        (statusFilter === "inactive" && p.accountStatus === "inactive");

      return matchSearch && matchStatus;
    });
  }, [patients, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  //Confirm action
  const handleConfirm = async () => {
    if (!confirmDialog) return;
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const { patient, mode } = confirmDialog;
    dispatch(setPatientAccountStatus({
      id: patient.id,
      accountStatus: mode === "activate_patient" ? "active" : "inactive",
    }));
    dispatch(refreshPatients());
    setActionLoading(false);
    setConfirmDialog(null);
  };

  //Render
  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)]">Patient Management</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Manage all registered patient accounts — account status and profile details.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors"
          title="Refresh patient data"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Patients"  value={metrics.total}    icon={Users}     iconBg="bg-violet-50"  iconColor="text-violet-600"  />
        <MetricCard label="Active"          value={metrics.active}   icon={UserCheck} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <MetricCard label="Inactive"        value={metrics.inactive} icon={UserX}     iconBg="bg-slate-100"  iconColor="text-slate-500"   />
        <MetricCard label="New (30 days)"   value={metrics.newCount} icon={UserPlus}  iconBg="bg-blue-50"    iconColor="text-blue-600"    />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            id="patient-search"
            type="text"
            placeholder="Search by name, email or phone…"
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

        {/* Status Filter Tabs */}
        <div className="flex gap-1 rounded-xl bg-stone-100 p-1">
          {(["all", "active", "inactive"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition ${
                statusFilter === s
                  ? "bg-white text-[var(--ink)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="text-xs text-[var(--muted)]">
          Showing <span className="font-semibold text-[var(--ink)]">{filtered.length}</span> patient{filtered.length !== 1 ? "s" : ""}
          {search && <> matching &quot;<span className="font-medium">{search}</span>&quot;</>}
        </p>
      )}

      {/* Table / States */}
      <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Loading patients…" />
        ) : error ? (
          <ErrorState
            title="Failed to load patients"
            message={error}
            onRetry={load}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={26} />}
            title="No patients found"
            message={
              search
                ? `No results for "${search}". Try a different search term.`
                : statusFilter !== "all"
                ? `No ${statusFilter} patients at the moment.`
                : "No patients have registered yet."
            }
          />
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--canvas)]">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Patient
                    </th>
                    <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)] sm:table-cell">
                      Contact
                    </th>
                    <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)] md:table-cell">
                      Demographics
                    </th>
                    <th className="hidden px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[var(--muted)] lg:table-cell">
                      Appointments
                    </th>
                    <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)] md:table-cell">
                      Registered
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Status
                    </th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {paginated.map((patient) => {
                    const isActive = patient.accountStatus !== "inactive";
                    const aptCount = appointmentCountByPatient[patient.id] ?? 0;
                    return (
                      <tr
                        key={patient.id}
                        className="hover:bg-[var(--canvas)] transition-colors group"
                      >
                        {/* Patient name + ID */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white
                              ${isActive ? "bg-violet-600" : "bg-slate-400"}`}>
                              {getInitials(patient.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--ink)] truncate">{patient.name}</p>
                              <p className="text-xs text-[var(--muted)] font-mono">{patient.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="hidden px-4 py-4 sm:table-cell">
                          <p className="text-[var(--ink)] truncate max-w-[160px]">{patient.email}</p>
                          <p className="text-xs text-[var(--muted)]">{patient.mobile}</p>
                        </td>

                        {/* Demographics */}
                        <td className="hidden px-4 py-4 md:table-cell">
                          <p className="text-[var(--ink)]">
                            {patient.age ? `${patient.age} yrs` : "—"}
                            {patient.gender ? ` · ${patient.gender}` : ""}
                          </p>
                          {patient.bloodGroup && (
                            <p className="text-xs text-[var(--muted)]">Blood: {patient.bloodGroup}</p>
                          )}
                        </td>

                        {/* Appointment count */}
                        <td className="hidden px-4 py-4 text-center lg:table-cell">
                          <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-bold
                            ${aptCount > 0 ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-400"}`}>
                            {aptCount}
                          </span>
                        </td>

                        {/* Registered date */}
                        <td className="hidden px-4 py-4 text-sm text-[var(--muted)] md:table-cell">
                          {fmtDate(patient.registeredAt)}
                        </td>

                        {/* Status badge */}
                        <td className="px-4 py-4">
                          <Badge
                            variant={isActive ? "active" : "inactive"}
                            label={isActive ? "Active" : "Inactive"}
                            dot
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              id={`patient-view-${patient.id}`}
                              onClick={() => setDrawerPatient(patient)}
                              className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                            >
                              View Profile
                            </button>
                            {isActive ? (
                              <button
                                id={`patient-deactivate-${patient.id}`}
                                onClick={() =>
                                  setConfirmDialog({ patient, mode: "deactivate_patient" })
                                }
                                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                id={`patient-activate-${patient.id}`}
                                onClick={() =>
                                  setConfirmDialog({ patient, mode: "activate_patient" })
                                }
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-[var(--line)] px-5 py-4">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Patient Detail Drawer */}
      <PatientDetailDrawer
        patient={drawerPatient}
        open={!!drawerPatient}
        onClose={() => setDrawerPatient(null)}
      />

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmationDialog
          open={!!confirmDialog}
          onClose={() => setConfirmDialog(null)}
          mode={confirmDialog.mode}
          entityName={confirmDialog.patient.name}
          onConfirm={handleConfirm}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
