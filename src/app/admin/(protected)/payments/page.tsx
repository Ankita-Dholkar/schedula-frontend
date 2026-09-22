"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  CreditCard,
  TrendingUp,
  CheckCircle2,
  Hourglass,
  AlertCircle,
  RotateCcw,
  Search,
  X,
  Filter,
  Smartphone,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { hydratePayments } from "@/store/slices/paymentsSlice";
import { refreshAppointments } from "@/store/slices/appointmentsSlice";
import type { Payment } from "@/types/payment";
import type { Appointment } from "@/types/appointment";
import Pagination from "@/components/ui/Pagination";
import { LoadingState, EmptyState } from "@/components/ui/StateViews";
import PaymentDetailDrawer from "@/features/admin-portal/components/PaymentDetailDrawer";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

type StatusFilter = "all" | "paid" | "pending" | "failed" | "refunded";
type DateFilter = "all" | "today" | "this_week" | "this_month" | "past";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

function getStoredPage(key: string): number {
  if (typeof window === "undefined") return 1;
  try {
    const params = new URLSearchParams(window.location.search);
    const urlP = parseInt(params.get("page") || "", 10);
    if (!isNaN(urlP) && urlP >= 1) return urlP;
    const saved = sessionStorage.getItem(key);
    const savedP = saved ? parseInt(saved, 10) : 1;
    if (!isNaN(savedP) && savedP >= 1) return savedP;
  } catch { /* ignore */ }
  return 1;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[var(--ink)]">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Payment["status"] }) {
  const map: Record<Payment["status"], { label: string; cls: string }> = {
    paid: { label: "Paid", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
    failed: { label: "Failed", cls: "bg-red-50 text-red-700 border border-red-200" },
    refunded: { label: "Refunded", cls: "bg-violet-50 text-violet-700 border border-violet-200" },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
  const dispatch = useAppDispatch();
  const payments = useAppSelector((s) => s.payments.payments);
  const appointments = useAppSelector((s) => s.appointments.appointments);
  const doctors = useAppSelector((s) => s.doctors.doctors);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [patientFilter, setPatientFilter] = useState("all");
  const [page, setPage] = useState<number>(() => getStoredPage("admin_payments_page"));
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("admin_payments_page", String(newPage));
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(newPage));
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    dispatch(hydratePayments());
    dispatch(refreshAppointments());
    setLoading(false);
  }, [dispatch]);

  // Build appointment lookup map
  const appointmentMap = useMemo<Record<string, Appointment>>(() => {
    const map: Record<string, Appointment> = {};
    for (const apt of appointments) map[apt.id] = apt;
    return map;
  }, [appointments]);

  // Doctor names from appointment data
  const doctorNames = useMemo(() => {
    const names = new Set(appointments.map((a) => a.clinician));
    return Array.from(names).sort();
  }, [appointments]);

  // Patient names from appointment data
  const patientNames = useMemo(() => {
    const names = new Set(appointments.map((a) => a.patient.name));
    return Array.from(names).sort();
  }, [appointments]);

  // ── KPI Metrics ──────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const paid = payments.filter((p) => p.status === "paid");
    const totalRevenue = paid.reduce((sum, p) => sum + p.amount, 0);
    return {
      totalRevenue,
      total: payments.length,
      paid: paid.length,
      pending: payments.filter((p) => p.status === "pending").length,
      failed: payments.filter((p) => p.status === "failed").length,
      refunded: payments.filter((p) => p.status === "refunded").length,
    };
  }, [payments]);

  // ── Filtered List ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);

    return payments
      .filter((p) => {
        const apt = appointmentMap[p.appointmentId];

        const matchSearch =
          !q ||
          p.id.toLowerCase().includes(q) ||
          p.appointmentId.toLowerCase().includes(q) ||
          (p.transactionId?.toLowerCase().includes(q) ?? false) ||
          (p.refundId?.toLowerCase().includes(q) ?? false) ||
          (apt?.clinician.toLowerCase().includes(q) ?? false) ||
          (apt?.patient.name.toLowerCase().includes(q) ?? false);

        const matchStatus = statusFilter === "all" || p.status === statusFilter;

        const matchDoctor =
          doctorFilter === "all" ||
          (apt?.clinician === doctorFilter);

        const matchPatient =
          patientFilter === "all" ||
          (apt?.patient.name === patientFilter);

        const payDate = new Date(p.createdAt);
        const matchDate =
          dateFilter === "all" ||
          (dateFilter === "today" && p.createdAt.slice(0, 10) === todayStr) ||
          (dateFilter === "this_week" && payDate >= weekAgo) ||
          (dateFilter === "this_month" && payDate >= monthAgo) ||
          (dateFilter === "past" && payDate < now);

        return matchSearch && matchStatus && matchDoctor && matchPatient && matchDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [payments, appointmentMap, search, statusFilter, doctorFilter, patientFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters =
    search || statusFilter !== "all" || dateFilter !== "all" || doctorFilter !== "all" || patientFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("all");
    setDoctorFilter("all");
    setPatientFilter("all");
  };

  // Reset page on filter change
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    handlePageChange(1);
  }, [search, statusFilter, dateFilter, doctorFilter, patientFilter, handlePageChange]);

  useEffect(() => {
    if (!loading && filtered.length > 0 && page > totalPages) {
      handlePageChange(totalPages);
    }
  }, [loading, filtered.length, page, totalPages, handlePageChange]);

  const openDrawer = (payment: Payment) => {
    setSelectedPayment(payment);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedPayment(null), 300);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-7xl mx-auto">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--ink)]">Payment Management</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          View all platform transactions, payment statuses, and refund details.
        </p>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total Revenue"
          value={`₹${metrics.totalRevenue.toLocaleString()}`}
          sub="From paid transactions"
          icon={TrendingUp}
          iconBg="bg-teal-50"
          iconColor="text-[var(--brand)]"
        />
        <MetricCard
          label="Transactions"
          value={metrics.total}
          sub="All records"
          icon={CreditCard}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <MetricCard
          label="Paid"
          value={metrics.paid}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <MetricCard
          label="Pending"
          value={metrics.pending}
          icon={Hourglass}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <MetricCard
          label="Failed"
          value={metrics.failed}
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
        <MetricCard
          label="Refunded"
          value={metrics.refunded}
          icon={RotateCcw}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        {/* Search row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
            />
            <input
              id="payments-search"
              type="text"
              placeholder="Search ID, transaction, doctor, patient…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-white py-2.5 pl-9 pr-9 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] placeholder:text-stone-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition"
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

          <FilterSelect id="status-filter" value={statusFilter} onChange={(v) => setStatusFilter(v as StatusFilter)}>
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </FilterSelect>

          <FilterSelect id="doctor-filter" value={doctorFilter} onChange={setDoctorFilter}>
            <option value="all">All Doctors</option>
            {doctorNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </FilterSelect>

          <FilterSelect id="patient-filter" value={patientFilter} onChange={setPatientFilter}>
            <option value="all">All Patients</option>
            {patientNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </FilterSelect>

          <FilterSelect id="date-filter" value={dateFilter} onChange={(v) => setDateFilter(v as DateFilter)}>
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="past">Past</option>
          </FilterSelect>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-[var(--muted)]">
          Showing{" "}
          <span className="font-semibold text-[var(--ink)]">{filtered.length}</span>{" "}
          transaction{filtered.length !== 1 ? "s" : ""}
          {hasActiveFilters && (
            <span>
              {" "}·{" "}
              <button
                onClick={clearFilters}
                className="text-[var(--brand)] hover:underline"
              >
                clear filters
              </button>
            </span>
          )}
        </p>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Loading payments…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={26} />}
            title="No payments found"
            message={
              hasActiveFilters
                ? "No payments match the selected filters. Try adjusting your search or filters."
                : "No payment records available yet."
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
                    {["Payment ID", "Patient", "Doctor", "Date", "Method", "Amount", "Status", "Actions"].map((h) => (
                      <th
                        key={h}
                        className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)] ${
                          h === "Patient" || h === "Doctor" ? "hidden sm:table-cell" : ""
                        } ${h === "Date" || h === "Method" ? "hidden md:table-cell" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {paginated.map((payment) => {
                    const apt = appointmentMap[payment.appointmentId];
                    return (
                      <tr
                        key={payment.id}
                        className="hover:bg-[var(--canvas)] transition-colors"
                      >
                        {/* Payment ID */}
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-mono text-xs font-semibold text-[var(--ink)]">
                              {payment.id}
                            </p>
                            {payment.transactionId && (
                              <p className="mt-0.5 font-mono text-[10px] text-[var(--muted)]">
                                {payment.transactionId}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Patient */}
                        <td className="hidden px-4 py-3.5 sm:table-cell">
                          {apt ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-[10px] font-bold text-white">
                                {apt.patient.initials}
                              </div>
                              <p className="font-medium text-[var(--ink)] truncate max-w-[120px]">
                                {apt.patient.name}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--muted)]">—</span>
                          )}
                        </td>

                        {/* Doctor */}
                        <td className="hidden px-4 py-3.5 sm:table-cell">
                          {apt ? (
                            <div>
                              <p className="font-medium text-[var(--ink)] truncate max-w-[140px]">
                                {apt.clinician}
                              </p>
                              <p className="text-xs text-[var(--muted)]">{apt.specialty}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--muted)]">—</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="hidden px-4 py-3.5 md:table-cell">
                          <p className="font-medium text-[var(--ink)]">
                            {fmtDate(payment.createdAt)}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {fmtTime(payment.createdAt)}
                          </p>
                        </td>

                        {/* Method */}
                        <td className="hidden px-4 py-3.5 md:table-cell">
                          <span className="flex items-center gap-1.5 text-sm text-[var(--ink)]">
                            {payment.method === "upi" ? (
                              <Smartphone size={13} className="text-[var(--brand)]" />
                            ) : (
                              <CreditCard size={13} className="text-[var(--brand)]" />
                            )}
                            {payment.method === "upi" ? "UPI" : "Card"}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-[var(--ink)]">
                            ₹{payment.amount.toLocaleString()}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge status={payment.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            id={`pay-view-${payment.id}`}
                            onClick={() => openDrawer(payment)}
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--line)] px-4 py-3">
                <p className="text-xs text-[var(--muted)]">
                  Showing{" "}
                  <strong className="text-[var(--ink)]">
                    {(page - 1) * PAGE_SIZE + 1}
                  </strong>
                  –
                  <strong className="text-[var(--ink)]">
                    {Math.min(page * PAGE_SIZE, filtered.length)}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-[var(--ink)]">{filtered.length}</strong>{" "}
                  transactions
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

      {/* Payment Detail Drawer */}
      <PaymentDetailDrawer
        payment={selectedPayment}
        appointment={selectedPayment ? (appointmentMap[selectedPayment.appointmentId] ?? null) : null}
        open={drawerOpen}
        onClose={closeDrawer}
      />
    </div>
  );
}
