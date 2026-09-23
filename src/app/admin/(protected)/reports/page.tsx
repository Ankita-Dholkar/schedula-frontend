"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  BarChart2,
  FileText,
  CreditCard,
  Stethoscope,
  Users,
  Download,
  ChevronDown,
  Search,
  X,
  Calendar,
  Filter,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { getAllPatients } from "@/lib/mock-data/patients";
import { EmptyState, LoadingState } from "@/components/ui/StateViews";
import Pagination from "@/components/ui/Pagination";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import {
  exportCSV,
  exportExcel,
  exportPDF,
  type ExportColumn,
} from "@/lib/reports/exportUtils";
import type { Appointment } from "@/types/appointment";
import type { Payment } from "@/types/payment";
import type { Doctor } from "@/types/doctor";
import type { PatientUser } from "@/types/user";

// ── Types ──────────────────────────────────────────────────────────────────────

type ReportCategory = "appointments" | "revenue" | "doctors" | "patients";
type DatePreset = "all" | "today" | "week" | "month" | "30d" | "90d" | "custom";

const REPORT_TABS: { id: ReportCategory; label: string; icon: React.ElementType }[] = [
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "revenue",      label: "Revenue",       icon: CreditCard },
  { id: "doctors",      label: "Doctors",        icon: Stethoscope },
  { id: "patients",     label: "Patients",       icon: Users },
];

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all",    label: "All Time" },
  { value: "today",  label: "Today" },
  { value: "week",   label: "This Week" },
  { value: "month",  label: "This Month" },
  { value: "30d",    label: "Last 30 Days" },
  { value: "90d",    label: "Last 90 Days" },
  { value: "custom", label: "Custom Range" },
];

const PAGE_SIZE = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtCurrency(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

function getPresetRange(preset: DatePreset): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (preset === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { from: start, to: now };
  }
  if (preset === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return { from: start, to: now };
  }
  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: start, to: now };
  }
  if (preset === "30d") {
    return { from: new Date(now.getTime() - 30 * 86400000), to: now };
  }
  if (preset === "90d") {
    return { from: new Date(now.getTime() - 90 * 86400000), to: now };
  }
  return { from: null, to: null };
}

function inRange(isoDate: string, from: Date | null, to: Date | null): boolean {
  if (!from && !to) return true;
  const d = new Date(isoDate);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Status Badges ─────────────────────────────────────────────────────────────

function payStatusBadge(status: string): BadgeVariant {
  if (status === "paid") return "approved";
  if (status === "pending") return "pending";
  if (status === "refunded") return "confirmed";
  return "rejected";
}

function apptStatusVariant(status: string): BadgeVariant {
  if (status === "completed") return "completed";
  if (status === "pending") return "pending";
  if (status === "cancelled") return "cancelled";
  if (status === "confirmed") return "confirmed";
  if (status === "missed") return "missed";
  return "default";
}

function verificationVariant(v?: string): BadgeVariant {
  if (v === "approved" || v === "verified") return "approved";
  if (v === "pending") return "pending";
  if (v === "rejected") return "rejected";
  return "default";
}

// ── Export Dropdown Component ─────────────────────────────────────────────────

type ExportDropdownProps = {
  onExport: (format: "csv" | "excel" | "pdf") => void;
  loading: boolean;
};

function ExportDropdown({ onExport, loading }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-deep)] transition-colors disabled:opacity-60"
        id="reports-export-btn"
      >
        <Download size={15} />
        {loading ? "Exporting…" : "Export"}
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[var(--line)] bg-white py-1.5 shadow-xl z-30">
          {[
            { format: "csv" as const, label: "Export as CSV", sub: ".csv" },
            { format: "excel" as const, label: "Export as Excel", sub: ".xlsx" },
            { format: "pdf" as const, label: "Export as PDF", sub: ".pdf" },
          ].map(({ format, label, sub }) => (
            <button
              key={format}
              id={`export-${format}-btn`}
              onClick={() => { onExport(format); setOpen(false); }}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors"
            >
              <span>{label}</span>
              <span className="text-[10px] text-[var(--muted)] font-mono bg-[var(--canvas)] rounded px-1.5 py-0.5">
                {sub}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const appointments = useAppSelector((s) => s.appointments.appointments);
  const payments     = useAppSelector((s) => s.payments.payments);
  const doctors      = useAppSelector((s) => s.doctors.doctors);

  const [category, setCategory] = useState<ReportCategory>("appointments");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [allPatients, setAllPatients] = useState<PatientUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAllPatients(getAllPatients() as PatientUser[]);
    setLoading(false);
  }, []);

  // Reset page/filters on category change
  useEffect(() => {
    setPage(1);
    setStatusFilter("all");
    setModeFilter("all");
    setSearch("");
  }, [category]);

  useEffect(() => { setPage(1); }, [datePreset, statusFilter, modeFilter, search, customFrom, customTo]);

  // ── Date range ───────────────────────────────────────────────────────────────

  const { from: rangeFrom, to: rangeTo } = useMemo(() => {
    if (datePreset === "custom") {
      return {
        from: customFrom ? new Date(customFrom) : null,
        to: customTo ? new Date(customTo + "T23:59:59") : null,
      };
    }
    return getPresetRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  // ── Status options per category ───────────────────────────────────────────────

  const statusOptions = useMemo(() => {
    if (category === "appointments")
      return ["all", "completed", "confirmed", "pending", "cancelled", "missed"];
    if (category === "revenue")
      return ["all", "paid", "pending", "failed", "refunded"];
    if (category === "doctors")
      return ["all", "approved", "pending", "rejected"];
    if (category === "patients")
      return ["all", "active", "inactive"];
    return ["all"];
  }, [category]);

  // ── Mode filter options (appointments only) ───────────────────────────────────

  const showModeFilter = category === "appointments";

  // ── Filtered Appointments ─────────────────────────────────────────────────────

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a: Appointment) => {
      if (!inRange(a.startsAt, rangeFrom, rangeTo)) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (modeFilter !== "all" && a.appointmentMode !== modeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.patient.name.toLowerCase().includes(q) &&
          !a.clinician.toLowerCase().includes(q) &&
          !a.specialty.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [appointments, rangeFrom, rangeTo, statusFilter, modeFilter, search]);

  // ── Filtered Payments ─────────────────────────────────────────────────────────

  const filteredPayments = useMemo(() => {
    return payments.filter((p: Payment) => {
      if (!inRange(p.createdAt, rangeFrom, rangeTo)) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (modeFilter !== "all" && p.method !== modeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const appt = appointments.find((a) => a.id === p.appointmentId);
        if (
          !(p.transactionId?.toLowerCase().includes(q)) &&
          !(appt?.patient.name.toLowerCase().includes(q)) &&
          !(appt?.clinician.toLowerCase().includes(q))
        ) return false;
      }
      return true;
    });
  }, [payments, appointments, rangeFrom, rangeTo, statusFilter, modeFilter, search]);

  // ── Filtered Doctors ──────────────────────────────────────────────────────────

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d: Doctor) => {
      if (statusFilter !== "all") {
        if (statusFilter === "approved" || statusFilter === "rejected" || statusFilter === "pending") {
          const vs = d.verificationStatus === "verified" ? "approved" : d.verificationStatus;
          if (vs !== statusFilter) return false;
        }
      }
      if (search) {
        const q = search.toLowerCase();
        if (
          !d.name.toLowerCase().includes(q) &&
          !d.specialization.toLowerCase().includes(q) &&
          !(d.city?.toLowerCase().includes(q))
        ) return false;
      }
      return true;
    });
  }, [doctors, statusFilter, search]);

  // ── Filtered Patients ─────────────────────────────────────────────────────────

  const filteredPatients = useMemo(() => {
    return allPatients.filter((p: PatientUser) => {
      if (statusFilter !== "all") {
        const status = p.accountStatus ?? "active";
        if (status !== statusFilter) return false;
      }
      if (rangeFrom || rangeTo) {
        if (p.registeredAt && !inRange(p.registeredAt, rangeFrom, rangeTo)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.email.toLowerCase().includes(q) &&
          !(p.mobile?.toLowerCase().includes(q))
        ) return false;
      }
      return true;
    });
  }, [allPatients, rangeFrom, rangeTo, statusFilter, search]);

  // ── Active data source ────────────────────────────────────────────────────────

  const activeData = useMemo(() => {
    if (category === "appointments") return filteredAppointments;
    if (category === "revenue")      return filteredPayments;
    if (category === "doctors")      return filteredDoctors;
    return filteredPatients;
  }, [category, filteredAppointments, filteredPayments, filteredDoctors, filteredPatients]);

  // ── Pagination ────────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(activeData.length / PAGE_SIZE));
  const pagedData = useMemo(
    () => activeData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [activeData, page]
  );

  // ── Summary KPIs ──────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    if (category === "appointments") {
      const total = filteredAppointments.length;
      const completed = filteredAppointments.filter((a) => a.status === "completed").length;
      const cancelled = filteredAppointments.filter((a) => a.status === "cancelled").length;
      const rate = total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%";
      return [
        { label: "Total Appointments", value: total },
        { label: "Completed", value: completed, color: "text-emerald-600" },
        { label: "Cancelled", value: cancelled, color: "text-red-600" },
        { label: "Completion Rate", value: rate, color: "text-[var(--brand)]" },
      ];
    }
    if (category === "revenue") {
      const totalRev = filteredPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
      const pending = filteredPayments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
      const refunded = filteredPayments.filter((p) => p.status === "refunded").reduce((s, p) => s + (p.refundAmount ?? p.amount), 0);
      const failed = filteredPayments.filter((p) => p.status === "failed").length;
      return [
        { label: "Total Revenue", value: fmtCurrency(totalRev), color: "text-emerald-600" },
        { label: "Pending", value: fmtCurrency(pending), color: "text-amber-600" },
        { label: "Refunded", value: fmtCurrency(refunded), color: "text-violet-600" },
        { label: "Failed Transactions", value: failed, color: "text-red-600" },
      ];
    }
    if (category === "doctors") {
      const total = filteredDoctors.length;
      const approved = filteredDoctors.filter((d) => d.verificationStatus === "approved" || d.verificationStatus === "verified").length;
      const pending = filteredDoctors.filter((d) => d.verificationStatus === "pending").length;
      const active = filteredDoctors.filter((d) => d.status === "active").length;
      return [
        { label: "Total Doctors", value: total },
        { label: "Verified", value: approved, color: "text-emerald-600" },
        { label: "Pending Verification", value: pending, color: "text-amber-600" },
        { label: "Active Accounts", value: active, color: "text-[var(--brand)]" },
      ];
    }
    const total = filteredPatients.length;
    const active = filteredPatients.filter((p) => (p.accountStatus ?? "active") === "active").length;
    const inactive = filteredPatients.filter((p) => p.accountStatus === "inactive").length;
    const recent = filteredPatients.filter((p) => {
      if (!p.registeredAt) return false;
      return new Date(p.registeredAt) > new Date(Date.now() - 30 * 86400000);
    }).length;
    return [
      { label: "Total Patients", value: total },
      { label: "Active", value: active, color: "text-emerald-600" },
      { label: "Inactive", value: inactive, color: "text-red-600" },
      { label: "New (Last 30d)", value: recent, color: "text-[var(--brand)]" },
    ];
  }, [category, filteredAppointments, filteredPayments, filteredDoctors, filteredPatients]);

  // ── Columns ───────────────────────────────────────────────────────────────────

  const apptColumns: Column<Appointment>[] = [
    {
      key: "startsAt", header: "Date & Time",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{fmtDate(r.startsAt)}</p>
          <p className="text-xs text-[var(--muted)]">
            {new Date(r.startsAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
          </p>
        </div>
      ),
    },
    {
      key: "patient", header: "Patient",
      render: (r) => <span className="font-medium text-sm">{r.patient.name}</span>,
    },
    {
      key: "clinician", header: "Doctor",
      render: (r) => <span className="text-sm">{r.clinician}</span>,
    },
    {
      key: "specialty", header: "Specialty",
      render: (r) => <span className="text-sm text-[var(--muted)]">{r.specialty}</span>,
    },
    {
      key: "appointmentMode", header: "Mode",
      render: (r) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          r.appointmentMode === "online"
            ? "bg-indigo-50 text-indigo-700"
            : r.appointmentMode === "in-person"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-stone-50 text-stone-500"
        }`}>
          {r.appointmentMode === "online" ? "Online" : r.appointmentMode === "in-person" ? "In-Person" : "—"}
        </span>
      ),
    },
    {
      key: "consultationFee", header: "Fee",
      render: (r) => <span className="text-sm font-semibold">{r.consultationFee ? fmtCurrency(r.consultationFee) : "—"}</span>,
    },
    {
      key: "status", header: "Status",
      render: (r) => <Badge variant={apptStatusVariant(r.status)} label={capitalize(r.status)} />,
    },
  ];

  const revenueColumns: Column<Payment>[] = [
    {
      key: "id", header: "Payment ID",
      render: (r) => <span className="font-mono text-xs text-[var(--muted)]">{r.id}</span>,
    },
    {
      key: "transactionId", header: "Transaction ID",
      render: (r) => (
        <span className="font-mono text-xs">
          {r.transactionId ?? <span className="text-[var(--muted)]">—</span>}
        </span>
      ),
    },
    {
      key: "appointmentId", header: "Patient",
      render: (r) => {
        const appt = appointments.find((a) => a.id === r.appointmentId);
        return <span className="text-sm font-medium">{appt?.patient.name ?? "—"}</span>;
      },
    },
    {
      key: "doctorId", header: "Doctor",
      render: (r) => {
        const appt = appointments.find((a) => a.id === r.appointmentId);
        return <span className="text-sm">{appt?.clinician ?? "—"}</span>;
      },
    },
    {
      key: "amount", header: "Amount",
      render: (r) => <span className="text-sm font-semibold">{fmtCurrency(r.amount)}</span>,
    },
    {
      key: "method", header: "Method",
      render: (r) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          r.method === "card" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
        }`}>
          {r.method === "card" ? "Card" : "UPI"}
        </span>
      ),
    },
    {
      key: "status", header: "Status",
      render: (r) => <Badge variant={payStatusBadge(r.status)} label={capitalize(r.status)} />,
    },
    {
      key: "createdAt", header: "Date",
      render: (r) => <span className="text-sm">{fmtDate(r.createdAt)}</span>,
    },
    {
      key: "refundId", header: "Refund",
      render: (r) => r.status === "refunded" ? (
        <div className="text-xs">
          <p className="font-mono text-violet-700">{r.refundId}</p>
          <p className="text-[var(--muted)]">{r.refundAmount ? fmtCurrency(r.refundAmount) : ""}</p>
        </div>
      ) : <span className="text-[var(--muted)]">—</span>,
    },
  ];

  const doctorColumns: Column<Doctor>[] = [
    {
      key: "name", header: "Doctor",
      render: (d) => (
        <div>
          <p className="font-medium text-sm">{d.name}</p>
          <p className="text-xs text-[var(--muted)]">{d.email ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "specialization", header: "Specialization",
      render: (d) => <span className="text-sm">{d.specialization}</span>,
    },
    {
      key: "experience", header: "Experience",
      render: (d) => <span className="text-sm">{d.experience}y</span>,
    },
    {
      key: "licenseNumber", header: "License No.",
      render: (d) => <span className="font-mono text-xs">{d.licenseNumber ?? "—"}</span>,
    },
    {
      key: "verificationStatus", header: "Verification",
      render: (d) => (
        <Badge
          variant={verificationVariant(d.verificationStatus)}
          label={capitalize(d.verificationStatus === "verified" ? "approved" : d.verificationStatus ?? "unknown")}
        />
      ),
    },
    {
      key: "status", header: "Account",
      render: (d) => (
        <Badge
          variant={d.status === "active" ? "approved" : "rejected"}
          label={capitalize(d.status ?? "active")}
        />
      ),
    },
    {
      key: "submittedAt", header: "Joined",
      render: (d) => <span className="text-sm">{d.submittedAt ? fmtDate(d.submittedAt) : "—"}</span>,
    },
  ];

  const patientColumns: Column<PatientUser>[] = [
    {
      key: "name", header: "Patient",
      render: (p) => (
        <div>
          <p className="font-medium text-sm">{p.name}</p>
          <p className="text-xs text-[var(--muted)]">{p.email}</p>
        </div>
      ),
    },
    {
      key: "mobile", header: "Mobile",
      render: (p) => <span className="font-mono text-xs">{p.mobile}</span>,
    },
    {
      key: "gender", header: "Gender",
      render: (p) => <span className="text-sm">{p.gender ?? "—"}</span>,
    },
    {
      key: "age", header: "Age",
      render: (p) => <span className="text-sm">{p.age ?? "—"}</span>,
    },
    {
      key: "bloodGroup", header: "Blood Grp",
      render: (p) => <span className="text-sm font-semibold">{p.bloodGroup ?? "—"}</span>,
    },
    {
      key: "registeredAt", header: "Registered",
      render: (p) => <span className="text-sm">{p.registeredAt ? fmtDate(p.registeredAt) : "—"}</span>,
    },
    {
      key: "accountStatus", header: "Status",
      render: (p) => (
        <Badge
          variant={(p.accountStatus ?? "active") === "active" ? "approved" : "rejected"}
          label={capitalize(p.accountStatus ?? "active")}
        />
      ),
    },
  ];

  //  Export Handler 

  const handleExport = useCallback(async (format: "csv" | "excel" | "pdf") => {
    setExporting(true);
    try {
      const dateLabel =
        datePreset === "custom"
          ? `${customFrom || "All"} to ${customTo || "All"}`
          : DATE_PRESETS.find((p) => p.value === datePreset)?.label ?? "All Time";
      const filterSummary = `Date: ${dateLabel}${statusFilter !== "all" ? ` | Status: ${statusFilter}` : ""}${modeFilter !== "all" ? ` | Mode: ${modeFilter}` : ""}${search ? ` | Search: "${search}"` : ""}`;

      if (category === "appointments") {
        const cols: ExportColumn[] = [
          { header: "Date", key: "startsAt" },
          { header: "Patient", key: "patientName" },
          { header: "Doctor", key: "clinician" },
          { header: "Specialty", key: "specialty" },
          { header: "Mode", key: "appointmentMode" },
          { header: "Fee (INR)", key: "consultationFee" },
          { header: "Status", key: "status" },
          { header: "Reason", key: "reason" },
        ];
        const rows = filteredAppointments.map((a) => ({
          startsAt: fmtDate(a.startsAt),
          patientName: a.patient.name,
          clinician: a.clinician,
          specialty: a.specialty,
          appointmentMode: a.appointmentMode ?? "—",
          consultationFee: a.consultationFee ?? 0,
          status: capitalize(a.status),
          reason: a.reason,
        }));
        const meta = { title: "Appointments Report", subtitle: `${filteredAppointments.length} records`, filters: filterSummary };
        if (format === "csv") exportCSV(cols, rows, "appointments_report.csv");
        else if (format === "excel") await exportExcel(cols, rows, meta, "appointments_report.xlsx");
        else await exportPDF(cols, rows, meta, "appointments_report.pdf");
      }

      else if (category === "revenue") {
        const cols: ExportColumn[] = [
          { header: "Payment ID", key: "id" },
          { header: "Transaction ID", key: "transactionId" },
          { header: "Patient", key: "patientName" },
          { header: "Doctor", key: "doctorName" },
          { header: "Amount (INR)", key: "amount" },
          { header: "Method", key: "method" },
          { header: "Status", key: "status" },
          { header: "Date", key: "createdAt" },
          { header: "Refund ID", key: "refundId" },
          { header: "Refund Amount", key: "refundAmount" },
          { header: "Refund Reason", key: "refundReason" },
        ];
        const rows = filteredPayments.map((p) => {
          const appt = appointments.find((a) => a.id === p.appointmentId);
          return {
            id: p.id,
            transactionId: p.transactionId ?? "—",
            patientName: appt?.patient.name ?? "—",
            doctorName: appt?.clinician ?? "—",
            amount: p.amount,
            method: p.method === "card" ? "Card" : "UPI",
            status: capitalize(p.status),
            createdAt: fmtDate(p.createdAt),
            refundId: p.refundId ?? "—",
            refundAmount: p.refundAmount ?? "—",
            refundReason: p.refundReason ?? "—",
          };
        });
        const meta = { title: "Revenue Report", subtitle: `${filteredPayments.length} transactions`, filters: filterSummary };
        if (format === "csv") exportCSV(cols, rows, "revenue_report.csv");
        else if (format === "excel") await exportExcel(cols, rows, meta, "revenue_report.xlsx");
        else await exportPDF(cols, rows, meta, "revenue_report.pdf");
      }

      else if (category === "doctors") {
        const cols: ExportColumn[] = [
          { header: "Name", key: "name" },
          { header: "Email", key: "email" },
          { header: "Specialization", key: "specialization" },
          { header: "Experience (yrs)", key: "experience" },
          { header: "License No.", key: "licenseNumber" },
          { header: "City", key: "city" },
          { header: "Verification", key: "verificationStatus" },
          { header: "Account Status", key: "status" },
          { header: "Joined", key: "submittedAt" },
        ];
        const rows = filteredDoctors.map((d) => ({
          name: d.name,
          email: d.email ?? "—",
          specialization: d.specialization,
          experience: d.experience,
          licenseNumber: d.licenseNumber ?? "—",
          city: d.city ?? "—",
          verificationStatus: capitalize(d.verificationStatus === "verified" ? "approved" : d.verificationStatus ?? "unknown"),
          status: capitalize(d.status ?? "active"),
          submittedAt: d.submittedAt ? fmtDate(d.submittedAt) : "—",
        }));
        const meta = { title: "Doctors Report", subtitle: `${filteredDoctors.length} doctors`, filters: filterSummary };
        if (format === "csv") exportCSV(cols, rows, "doctors_report.csv");
        else if (format === "excel") await exportExcel(cols, rows, meta, "doctors_report.xlsx");
        else await exportPDF(cols, rows, meta, "doctors_report.pdf");
      }

      else {
        const cols: ExportColumn[] = [
          { header: "Name", key: "name" },
          { header: "Email", key: "email" },
          { header: "Mobile", key: "mobile" },
          { header: "Gender", key: "gender" },
          { header: "Age", key: "age" },
          { header: "Blood Group", key: "bloodGroup" },
          { header: "Registered", key: "registeredAt" },
          { header: "Status", key: "accountStatus" },
        ];
        const rows = filteredPatients.map((p) => ({
          name: p.name,
          email: p.email,
          mobile: p.mobile,
          gender: p.gender ?? "—",
          age: p.age ?? "—",
          bloodGroup: p.bloodGroup ?? "—",
          registeredAt: p.registeredAt ? fmtDate(p.registeredAt) : "—",
          accountStatus: capitalize(p.accountStatus ?? "active"),
        }));
        const meta = { title: "Patients Report", subtitle: `${filteredPatients.length} patients`, filters: filterSummary };
        if (format === "csv") exportCSV(cols, rows, "patients_report.csv");
        else if (format === "excel") await exportExcel(cols, rows, meta, "patients_report.xlsx");
        else await exportPDF(cols, rows, meta, "patients_report.pdf");
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [category, filteredAppointments, filteredPayments, filteredDoctors, filteredPatients, appointments, datePreset, statusFilter, modeFilter, search, customFrom, customTo]);

  // Render 

  if (loading) return <LoadingState message="Loading reports…" className="mt-20" />;

  return (
    <div className="p-5 lg:p-7 space-y-5 max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)]">Reports</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            View, filter, and export platform data
          </p>
        </div>
        <ExportDropdown onExport={handleExport} loading={exporting} />
      </div>

      {/* ── Report Category Tabs ── */}
      <div className="flex items-center gap-1.5 flex-wrap rounded-xl border border-[var(--line)] bg-white p-1.5 shadow-sm w-fit">
        {REPORT_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`report-tab-${id}`}
            onClick={() => setCategory(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              category === id
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)]"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Filters Bar ── */}
      <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
          <Filter size={14} className="text-[var(--brand)]" />
          Filters
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder={`Search ${category}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--canvas)] py-2 pl-9 pr-9 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
              id="reports-search-input"
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

          {/* Date preset */}
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DatePreset)}
            className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
            id="reports-date-filter"
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {/* Custom range pickers */}
          {datePreset === "custom" && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
                id="reports-date-from"
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
                id="reports-date-to"
              />
            </>
          )}

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
            id="reports-status-filter"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Statuses" : capitalize(s)}</option>
            ))}
          </select>

          {/* Mode filter (appointments / revenue only) */}
          {category === "appointments" && (
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
              id="reports-mode-filter"
            >
              <option value="all">All Modes</option>
              <option value="online">Online</option>
              <option value="in-person">In-Person</option>
            </select>
          )}
          {category === "revenue" && (
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
              id="reports-method-filter"
            >
              <option value="all">All Methods</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          )}

          {/* Reset */}
          {(search || datePreset !== "all" || statusFilter !== "all" || modeFilter !== "all") && (
            <button
              onClick={() => {
                setSearch(""); setDatePreset("all"); setStatusFilter("all");
                setModeFilter("all"); setCustomFrom(""); setCustomTo("");
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors"
              id="reports-reset-filters"
            >
              <X size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-[var(--muted)]">{kpi.label}</p>
            <p className={`mt-1.5 text-2xl font-bold ${kpi.color ?? "text-[var(--ink)]"}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Data Table ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--ink)]">
              {activeData.length.toLocaleString("en-IN")}
            </span>{" "}
            {activeData.length === 1 ? "record" : "records"} found
          </p>
        </div>

        {category === "appointments" && (
          <Table
            columns={apptColumns}
            data={pagedData as Appointment[]}
            rowKey={(r) => r.id}
            emptyState={
              <EmptyState
                title="No appointments found"
                message="Try adjusting your filters or date range."
              />
            }
          />
        )}
        {category === "revenue" && (
          <Table
            columns={revenueColumns}
            data={pagedData as Payment[]}
            rowKey={(r) => r.id}
            emptyState={
              <EmptyState
                title="No payment records found"
                message="Try adjusting your filters or date range."
              />
            }
          />
        )}
        {category === "doctors" && (
          <Table
            columns={doctorColumns}
            data={pagedData as Doctor[]}
            rowKey={(r) => r.id}
            emptyState={
              <EmptyState title="No doctors found" message="Try adjusting your filters." />
            }
          />
        )}
        {category === "patients" && (
          <Table
            columns={patientColumns}
            data={pagedData as PatientUser[]}
            rowKey={(r) => r.id}
            emptyState={
              <EmptyState title="No patients found" message="Try adjusting your filters." />
            }
          />
        )}

        {totalPages > 1 && (
          <div className="flex justify-center pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
