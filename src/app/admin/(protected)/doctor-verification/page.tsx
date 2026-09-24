"use client";

import { useState, useEffect, useMemo } from "react";
import { UserCheck, Clock, ShieldCheck, ShieldOff, FileText, Search, X, Calendar, BadgeCheck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { refreshDoctors, setDoctorVerificationStatus } from "@/store/slices/doctorsSlice";
import Badge from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/StateViews";
import Pagination from "@/components/ui/Pagination";
import DocumentViewerModal from "@/features/admin-portal/components/DocumentViewerModal";
import ConfirmationDialog from "@/features/admin-portal/components/ConfirmationDialog";
import DoctorDetailDrawer from "@/features/admin-portal/components/DoctorDetailDrawer";
import { hasPermission } from "@/lib/admin/permissions";
import type { Doctor, DoctorDocument } from "@/types/doctor";

const PAGE_SIZE = 4;
type TabFilter = "pending" | "approved" | "rejected" | "all";

function verificationVariant(status?: Doctor["verificationStatus"]): BadgeVariant {
  if (status === "approved" || status === "verified") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "pending") return "pending";
  return "default";
}

function verificationLabel(status?: Doctor["verificationStatus"]) {
  if (status === "approved" || status === "verified") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "pending") return "Pending Review";
  return "Unknown";
}

export default function DoctorVerificationPage() {
  const dispatch = useAppDispatch();
  const doctors  = useAppSelector((s) => s.doctors.doctors);
  const currentAdmin = useAppSelector((s) => s.adminAuth.admin);
  const canApproveReject = hasPermission(currentAdmin, "doctor_verification", "approve_reject");

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [viewDoc, setViewDoc] = useState<DoctorDocument | null>(null);
  const [viewDocDoctorName, setViewDocDoctorName] = useState("");
  const [drawerDoctor, setDrawerDoctor] = useState<Doctor | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    doctor: Doctor;
    mode: "approve" | "reject";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(refreshDoctors());
    setLoading(false);
  }, [dispatch]);

  // Metrics
  const metrics = useMemo(() => ({
    pending:  doctors.filter((d) => d.verificationStatus === "pending").length,
    approved: doctors.filter((d) => d.verificationStatus === "approved" || d.verificationStatus === "verified").length,
    rejected: doctors.filter((d) => d.verificationStatus === "rejected").length,
    total:    doctors.length,
  }), [doctors]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return doctors.filter((doc) => {
      const matchTab =
        tab === "all"      ? true :
        tab === "pending"  ? doc.verificationStatus === "pending" :
        tab === "approved" ? (doc.verificationStatus === "approved" || doc.verificationStatus === "verified") :
        tab === "rejected" ? doc.verificationStatus === "rejected" : true;

      const matchSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.licenseNumber?.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q);

      return matchTab && matchSearch;
    });
  }, [doctors, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [tab, search]);

  const handleConfirm = async (reason?: string) => {
    if (!confirmDialog) return;
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const { doctor, mode } = confirmDialog;
    const status = mode === "approve" ? "approved" : "rejected";
    dispatch(setDoctorVerificationStatus({
      id: doctor.id,
      status,
      rejectionReason: mode === "reject" ? reason : undefined,
    }));
    dispatch(refreshDoctors());
    setActionLoading(false);
    setConfirmDialog(null);
  };


  const openDocViewer = (doc: DoctorDocument, doctorName: string) => {
    setViewDocDoctorName(doctorName);
    setViewDoc(doc);
  };

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--ink)]">Doctor Verification</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Review submitted credentials and approve or reject doctor registrations.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Pending Reviews", value: metrics.pending,  icon: Clock,      iconBg: "bg-amber-50",   iconColor: "text-amber-600",   tab: "pending"  as TabFilter },
          { label: "Approved",        value: metrics.approved, icon: ShieldCheck, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", tab: "approved" as TabFilter },
          { label: "Rejected",        value: metrics.rejected, icon: ShieldOff,   iconBg: "bg-rose-50",    iconColor: "text-rose-600",    tab: "rejected" as TabFilter },
          { label: "Total Doctors",   value: metrics.total,    icon: UserCheck,   iconBg: "bg-teal-50",    iconColor: "text-[var(--brand)]", tab: "all" as TabFilter },
        ].map(({ label, value, icon: Icon, iconBg, iconColor, tab: t }) => (
          <button
            key={label}
            onClick={() => setTab(t)}
            className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all text-left ${tab === t ? "border-[var(--brand)] ring-1 ring-[var(--brand)]" : "border-[var(--line)] bg-white"}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
                <p className="mt-2 text-3xl font-bold text-[var(--ink)]">{value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon size={21} className={iconColor} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-[var(--line)] bg-white p-1">
          {(["pending", "approved", "rejected", "all"] as TabFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                tab === t
                  ? "bg-[var(--brand)] text-white shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {t === "all" ? "All" : t === "pending" ? `Pending (${metrics.pending})` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or license…"
            className="h-9 w-full rounded-lg border border-[var(--line)] bg-white pl-9 pr-9 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Card List */}
      {loading ? (
        <LoadingState message="Loading verification queue…" />
      ) : paginated.length === 0 ? (
        <EmptyState
          title={tab === "pending" ? "No pending verifications" : "No results found"}
          message={tab === "pending" ? "All submitted verifications have been reviewed." : "Try adjusting your search."}
          icon={<UserCheck size={26} />}
        />
      ) : (
        <div className="space-y-4">
          {paginated.map((doc) => {
            const isPending  = doc.verificationStatus === "pending";
            const isApproved = doc.verificationStatus === "approved" || doc.verificationStatus === "verified";
            const isRejected = doc.verificationStatus === "rejected";

            return (
              <div
                key={doc.id}
                className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Top row: doctor info + status badges */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white overflow-hidden">
                      {doc.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={doc.image} alt={doc.name} className="h-full w-full object-cover" />
                      ) : (
                        doc.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[var(--ink)]">{doc.name}</h3>
                        {isApproved && <BadgeCheck size={15} className="text-emerald-600" />}
                      </div>
                      <p className="text-sm text-[var(--brand)] font-medium">{doc.specialization}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                        {doc.licenseNumber && <span className="font-mono">{doc.licenseNumber}</span>}
                        {doc.qualification  && <span>· {doc.qualification}</span>}
                        {doc.hospitalName   && <span>· {doc.hospitalName}</span>}
                        {doc.submittedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            Submitted {new Date(doc.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status badges — always visible and separate */}
                  <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
                    <Badge
                      variant={doc.status === "active" ? "active" : "inactive"}
                      label={doc.status === "active" ? "Active" : "Inactive"}
                      dot
                    />
                    <Badge
                      variant={verificationVariant(doc.verificationStatus)}
                      label={verificationLabel(doc.verificationStatus)}
                    />
                  </div>
                </div>

                {/* Rejection reason */}
                {isRejected && doc.rejectionReason && (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide mb-1">Rejection Reason</p>
                    <p className="text-sm text-rose-800 leading-relaxed">{doc.rejectionReason}</p>
                    {doc.rejectionDate && (
                      <p className="mt-1 text-xs text-rose-400">
                        {new Date(doc.rejectionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                )}

                {/* Documents */}
                {doc.documents && doc.documents.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Submitted Documents
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {doc.documents.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => openDocViewer(d, doc.name)}
                          className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-xs font-medium text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                        >
                          <FileText size={12} />
                          {d.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
                  <button
                    onClick={() => setDrawerDoctor(doc)}
                    className="text-xs font-medium text-[var(--brand)] hover:underline"
                  >
                    View Full Profile →
                  </button>

                  {isPending && canApproveReject && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDialog({ doctor: doc, mode: "reject" })}
                        className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                      >
                        <ShieldOff size={13} /> Reject
                      </button>
                      <button
                        onClick={() => setConfirmDialog({ doctor: doc, mode: "approve" })}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        <ShieldCheck size={13} /> Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <p className="text-xs text-[var(--muted)]">
          Showing <strong className="text-[var(--ink)]">{(page - 1) * PAGE_SIZE + 1}</strong>–<strong className="text-[var(--ink)]">{Math.min(page * PAGE_SIZE, filtered.length)}</strong> of <strong className="text-[var(--ink)]">{filtered.length}</strong> doctors
        </p>
        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      {/* Modals */}
      <DocumentViewerModal
        document={viewDoc}
        doctorName={viewDocDoctorName}
        open={!!viewDoc}
        onClose={() => setViewDoc(null)}
      />
      <DoctorDetailDrawer
        doctor={drawerDoctor}
        open={!!drawerDoctor}
        onClose={() => setDrawerDoctor(null)}
      />
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
