"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Stethoscope, Users, UserCheck, UserX, Search, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { refreshDoctors, setDoctorAccountStatus, setDoctorVerificationStatus } from "@/store/slices/doctorsSlice";
import Badge from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { LoadingState, EmptyState } from "@/components/ui/StateViews";
import DoctorDetailDrawer from "@/features/admin-portal/components/DoctorDetailDrawer";
import ConfirmationDialog from "@/features/admin-portal/components/ConfirmationDialog";
import type { Doctor } from "@/types/doctor";

const PAGE_SIZE = 5;

type StatusFilter = "all" | "active" | "inactive";
type VerifFilter = "all" | "approved" | "pending" | "rejected";

function verificationVariant(status?: Doctor["verificationStatus"]): BadgeVariant {
  if (status === "approved" || status === "verified") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "pending") return "pending";
  return "default";
}

function verificationLabel(status?: Doctor["verificationStatus"]) {
  if (status === "approved" || status === "verified") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "pending") return "Pending";
  return "—";
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

export default function AdminDoctorsPage() {
  const dispatch = useAppDispatch();
  const doctors = useAppSelector((s) => s.doctors.doctors);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [verifFilter, setVerifFilter] = useState<VerifFilter>("all");
  const [page, setPage] = useState<number>(() => getStoredPage("admin_doctors_page"));

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("admin_doctors_page", String(newPage));
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
    const p = getStoredPage("admin_doctors_page");
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

  const [drawerDoctor, setDrawerDoctor] = useState<Doctor | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    doctor: Doctor;
    mode: "activate" | "deactivate" | "approve" | "reject";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(refreshDoctors());
    setLoading(false);
  }, [dispatch]);

  // ── Metrics ──────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    return {
      total:    doctors.length,
      active:   doctors.filter((d) => d.status === "active").length,
      inactive: doctors.filter((d) => (d.status ?? "inactive") === "inactive").length,
      pending:  doctors.filter((d) => d.verificationStatus === "pending").length,
    };
  }, [doctors]);

  // Filtered list 
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return doctors.filter((doc) => {
      const matchSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.email?.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q) ||
        doc.licenseNumber?.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active"   && doc.status === "active") ||
        (statusFilter === "inactive" && (doc.status ?? "inactive") === "inactive");

      const matchVerif =
        verifFilter === "all" ||
        (verifFilter === "approved" && (doc.verificationStatus === "approved" || doc.verificationStatus === "verified")) ||
        (verifFilter === "pending"  && doc.verificationStatus === "pending") ||
        (verifFilter === "rejected" && doc.verificationStatus === "rejected");

      return matchSearch && matchStatus && matchVerif;
    });
  }, [doctors, search, statusFilter, verifFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page on filter change (skip initial mount to preserve URL page)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    handlePageChange(1);
  }, [search, statusFilter, verifFilter, handlePageChange]);

  // Only clamp AFTER data has loaded and settled
  useEffect(() => {
    if (!loading && filtered.length > 0 && page > totalPages) {
      handlePageChange(totalPages);
    }
  }, [loading, filtered.length, page, totalPages, handlePageChange]);

  const handleConfirm = async (reason?: string) => {
    if (!confirmDialog) return;
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const { doctor, mode } = confirmDialog;
    if (mode === "activate")   dispatch(setDoctorAccountStatus({ id: doctor.id, status: "active" }));
    if (mode === "deactivate") dispatch(setDoctorAccountStatus({ id: doctor.id, status: "inactive" }));
    if (mode === "approve")    dispatch(setDoctorVerificationStatus({ id: doctor.id, status: "approved" }));
    if (mode === "reject")     dispatch(setDoctorVerificationStatus({ id: doctor.id, status: "rejected", rejectionReason: reason }));
    dispatch(refreshDoctors());
    setActionLoading(false);
    setConfirmDialog(null);
  };

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-7xl mx-auto">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--ink)]">Doctor Management</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Manage all registered doctors — account status and verification.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Doctors",    value: metrics.total,    icon: Stethoscope, iconBg: "bg-teal-50",    iconColor: "text-[var(--brand)]" },
          { label: "Active Doctors",   value: metrics.active,   icon: UserCheck,   iconBg: "bg-emerald-50", iconColor: "text-emerald-600"   },
          { label: "Inactive Doctors", value: metrics.inactive, icon: UserX,       iconBg: "bg-slate-100",  iconColor: "text-slate-500"     },
          { label: "Pending Verification", value: metrics.pending, icon: Users,    iconBg: "bg-amber-50",   iconColor: "text-amber-600"     },
        ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
                <p className="mt-2 text-3xl font-bold text-[var(--ink)]">{value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon size={21} className={iconColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, specialization, license…"
            className="h-9 w-full rounded-lg border border-[var(--line)] bg-white pl-9 pr-9 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center rounded-lg border border-[var(--line)] bg-white p-1 gap-1">
            <span className="px-2 text-xs font-medium text-[var(--muted)]">Account:</span>
            {(["all", "active", "inactive"] as StatusFilter[]).map((v) => (
              <button
                key={v}
                onClick={() => setStatusFilter(v)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === v
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-lg border border-[var(--line)] bg-white p-1 gap-1">
            <span className="px-2 text-xs font-medium text-[var(--muted)]">Verification:</span>
            {(["all", "approved", "pending", "rejected"] as VerifFilter[]).map((v) => (
              <button
                key={v}
                onClick={() => setVerifFilter(v)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  verifFilter === v
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      {(search || statusFilter !== "all" || verifFilter !== "all") && (
        <p className="text-xs text-[var(--muted)]">
          Showing <strong className="text-[var(--ink)]">{filtered.length}</strong> of <strong className="text-[var(--ink)]">{doctors.length}</strong> doctors
        </p>
      )}

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading doctors…" />
      ) : paginated.length === 0 ? (
        <EmptyState
          title="No doctors found"
          message="Try adjusting your search or filter criteria."
          icon={<Stethoscope size={26} />}
        />
      ) : (
        <div className="rounded-xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--canvas)]">
                  {["Doctor", "Specialization", "Experience", "License No.", "Account Status", "Verification", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((doc) => {
                  const isActive = doc.status === "active";
                  const isRejected = doc.verificationStatus === "rejected";
                  const isPending = doc.verificationStatus === "pending";
                  const cannotActivate = !isActive && (isRejected || isPending);
                  return (
                    <tr key={doc.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--canvas)] transition-colors">
                      {/* Doctor */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white overflow-hidden">
                            {doc.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={doc.image} alt={doc.name} className="h-full w-full object-cover" />
                            ) : (
                              doc.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--ink)] truncate max-w-[160px]">{doc.name}</p>
                            <p className="text-xs text-[var(--muted)] truncate max-w-[160px]">{doc.email ?? "—"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Specialization */}
                      <td className="px-4 py-3 text-[var(--ink)]">{doc.specialization}</td>

                      {/* Experience */}
                      <td className="px-4 py-3 text-[var(--muted)]">{doc.experience} yrs</td>

                      {/* License */}
                      <td className="px-4 py-3 font-mono text-xs text-[var(--ink)]">{doc.licenseNumber ?? "—"}</td>

                      {/* Account Status */}
                      <td className="px-4 py-3">
                        <Badge
                          variant={isActive ? "active" : "inactive"}
                          label={isActive ? "Active" : "Inactive"}
                          dot
                        />
                      </td>

                      {/* Verification */}
                      <td className="px-4 py-3">
                        <Badge
                          variant={verificationVariant(doc.verificationStatus)}
                          label={verificationLabel(doc.verificationStatus)}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setDrawerDoctor(doc)}
                            className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs font-medium text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                          >
                            View Profile
                          </button>
                          <button
                            disabled={cannotActivate}
                            onClick={() => setConfirmDialog({ doctor: doc, mode: isActive ? "deactivate" : "activate" })}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                              isActive
                                ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : cannotActivate
                                ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            title={
                              !isActive && isPending
                                ? "Cannot activate account while verification is pending approval"
                                : !isActive && isRejected
                                ? "Cannot activate a doctor whose application is rejected"
                                : undefined
                            }
                          >
                            {isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--line)] px-4 py-3">
            <p className="text-xs text-[var(--muted)]">
              Showing <strong className="text-[var(--ink)]">{(page - 1) * PAGE_SIZE + 1}</strong>–<strong className="text-[var(--ink)]">{Math.min(page * PAGE_SIZE, filtered.length)}</strong> of <strong className="text-[var(--ink)]">{filtered.length}</strong> doctors
            </p>
            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
            )}
          </div>
        </div>
      )}

      {/* Doctor Detail Drawer */}
      <DoctorDetailDrawer
        doctor={drawerDoctor}
        open={!!drawerDoctor}
        onClose={() => setDrawerDoctor(null)}
      />

      {/* Inline confirmation for row-level actions */}
      {confirmDialog && (
        <ConfirmationDialog
          open={!!confirmDialog}
          onClose={() => setConfirmDialog(null)}
          mode={confirmDialog.mode}
          doctorName={confirmDialog.doctor.name}
          onConfirm={handleConfirm}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
