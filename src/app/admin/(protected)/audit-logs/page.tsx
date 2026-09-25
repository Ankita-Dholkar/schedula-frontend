"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ClipboardList,
  Search,
  X,
  Filter,
  Download,
  ChevronDown,
  ShieldAlert,
  Info,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { hydrateAuditLogs } from "@/store/slices/auditLogsSlice";
import AuditLogDetailDrawer from "@/features/admin-portal/components/AuditLogDetailDrawer";
import { EmptyState, LoadingState } from "@/components/ui/StateViews";
import Pagination from "@/components/ui/Pagination";
import {
  exportCSV,
  exportExcel,
  exportPDF,
  type ExportColumn,
} from "@/lib/reports/exportUtils";
import type { AuditLog, AuditActionCategory, AuditSeverity } from "@/types/auditLog";
import { ACTION_CATEGORY_MAP } from "@/types/auditLog";

// ── Types & Constants ─────────────────────────────────────────────────────────

type DateRange = "all" | "today" | "7d" | "30d" | "custom";
type ActorRole = "all" | "admin" | "super_admin" | "admin_role" | "support" | "doctor" | "patient";

const CATEGORY_OPTIONS: { value: AuditActionCategory; label: string }[] = [
  { value: "all",                label: "All Actions" },
  { value: "doctor_management",  label: "Doctor Management" },
  { value: "patient_management", label: "Patient Management" },
  { value: "appointments",       label: "Appointments" },
  { value: "payments",           label: "Payments" },
  { value: "reviews",            label: "Reviews" },
  { value: "notifications",      label: "Notifications" },
  { value: "admin_management",   label: "Admin Management" },
  { value: "settings",           label: "Platform Settings" },
  { value: "auth",               label: "Auth" },
];

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "all",    label: "All Time" },
  { value: "today",  label: "Today" },
  { value: "7d",     label: "Last 7 Days" },
  { value: "30d",    label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

const ACTOR_ROLE_OPTIONS: { value: ActorRole; label: string }[] = [
  { value: "all",         label: "All Actors" },
  { value: "admin",       label: "All Admins" },
  { value: "super_admin", label: "Super Admin" },
  { value: "admin_role",  label: "Operations Admin" },
  { value: "support",     label: "Support Staff" },
  { value: "doctor",      label: "Doctors" },
  { value: "patient",     label: "Patients" },
];

const PAGE_SIZE = 15;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function getDateStart(range: DateRange): Date | null {
  const now = new Date();
  if (range === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "7d")  return new Date(now.getTime() - 7 * 86400000);
  if (range === "30d") return new Date(now.getTime() - 30 * 86400000);
  return null;
}

function severityBadge(severity: AuditSeverity) {
  if (severity === "critical")
    return { icon: ShieldAlert, label: "Critical", cls: "bg-red-50 text-red-700 border-red-200" };
  if (severity === "warning")
    return { icon: AlertTriangle, label: "Warning", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { icon: Info, label: "Info", cls: "bg-sky-50 text-sky-700 border-sky-200" };
}

function actionBadgeColor(category: AuditActionCategory): string {
  const map: Partial<Record<AuditActionCategory, string>> = {
    doctor_management:  "bg-teal-50 text-teal-700",
    patient_management: "bg-violet-50 text-violet-700",
    appointments:       "bg-blue-50 text-blue-700",
    payments:           "bg-emerald-50 text-emerald-700",
    reviews:            "bg-amber-50 text-amber-700",
    notifications:      "bg-indigo-50 text-indigo-700",
    admin_management:   "bg-purple-50 text-purple-700",
    settings:           "bg-rose-50 text-rose-700",
    auth:               "bg-slate-100 text-slate-600",
  };
  return map[category] ?? "bg-gray-100 text-gray-600";
}

// ── Export Dropdown ───────────────────────────────────────────────────────────

function ExportDropdown({ onExport, loading }: { onExport: (f: "csv" | "excel" | "pdf") => void; loading: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-deep)] transition-colors disabled:opacity-60"
        id="audit-export-btn"
      >
        <Download size={15} />
        {loading ? "Exporting…" : "Export"}
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[var(--line)] bg-white py-1.5 shadow-xl z-30">
          {([
            { format: "csv" as const,   label: "Export as CSV",   sub: ".csv" },
            { format: "excel" as const, label: "Export as Excel", sub: ".xlsx" },
            { format: "pdf" as const,   label: "Export as PDF",   sub: ".pdf" },
          ]).map(({ format, label, sub }) => (
            <button
              key={format}
              id={`audit-export-${format}`}
              onClick={() => { onExport(format); setOpen(false); }}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors"
            >
              <span>{label}</span>
              <span className="text-[10px] text-[var(--muted)] font-mono bg-[var(--canvas)] rounded px-1.5 py-0.5">{sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const dispatch = useAppDispatch();
  const logs = useAppSelector((s) => s.auditLogs.logs);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AuditActionCategory>("all");
  const [actorRole, setActorRole] = useState<ActorRole>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    dispatch(hydrateAuditLogs());
    setLoading(false);
  }, [dispatch]);

  // Reset page on filter changes
  useEffect(() => { setPage(1); }, [search, category, actorRole, dateRange, customFrom, customTo]);

  // ── Filtered logs ─────────────────────────────────────────────────────────────

  const filteredLogs = useMemo(() => {
    const dateStart = dateRange === "custom"
      ? (customFrom ? new Date(customFrom) : null)
      : getDateStart(dateRange);
    const dateEnd = dateRange === "custom"
      ? (customTo ? new Date(customTo + "T23:59:59") : null)
      : null;

    return logs.filter((log) => {
      // Date
      if (dateStart && new Date(log.timestamp) < dateStart) return false;
      if (dateEnd   && new Date(log.timestamp) > dateEnd)   return false;
      // Category
      if (category !== "all" && ACTION_CATEGORY_MAP[log.action] !== category) return false;
      // Actor role
      if (actorRole !== "all") {
        if (actorRole === "admin") {
          if (log.actor.role !== "admin") return false;
        } else if (actorRole === "super_admin") {
          if (log.actor.adminRole !== "super_admin") return false;
        } else if (actorRole === "admin_role") {
          if (log.actor.adminRole !== "admin") return false;
        } else if (actorRole === "support") {
          if (log.actor.adminRole !== "support") return false;
        } else {
          if (log.actor.role !== actorRole) return false;
        }
      }
      // Search
      if (search) {
        const q = search.toLowerCase();
        if (
          !log.actor.name.toLowerCase().includes(q) &&
          !log.actor.email.toLowerCase().includes(q) &&
          !(log.actor.adminRole && log.actor.adminRole.toLowerCase().includes(q)) &&
          !log.actionLabel.toLowerCase().includes(q) &&
          !log.entityName.toLowerCase().includes(q) &&
          !log.details.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [logs, search, category, actorRole, dateRange, customFrom, customTo]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const pagedLogs  = useMemo(
    () => filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredLogs, page]
  );

  // ── Summary stats ─────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total:    filteredLogs.length,
    info:     filteredLogs.filter((l) => l.severity === "info").length,
    warning:  filteredLogs.filter((l) => l.severity === "warning").length,
    critical: filteredLogs.filter((l) => l.severity === "critical").length,
  }), [filteredLogs]);

  // ── Export ────────────────────────────────────────────────────────────────────

  const handleExport = useCallback(async (format: "csv" | "excel" | "pdf") => {
    setExporting(true);
    try {
      const cols: ExportColumn[] = [
        { header: "Timestamp",   key: "timestamp" },
        { header: "Actor",       key: "actorName" },
        { header: "Actor Email", key: "actorEmail" },
        { header: "Actor Role",  key: "actorRole" },
        { header: "Action",      key: "actionLabel" },
        { header: "Entity Type", key: "entityType" },
        { header: "Entity Name", key: "entityName" },
        { header: "Entity ID",   key: "entityId" },
        { header: "Severity",    key: "severity" },
        { header: "Details",     key: "details" },
        { header: "IP Address",  key: "ipAddress" },
      ];
      const rows = filteredLogs.map((l) => ({
        timestamp:   fmtDateTime(l.timestamp),
        actorName:   l.actor.name,
        actorEmail:  l.actor.email,
        actorRole:   l.actor.role === "admin"
          ? (l.actor.adminRole === "super_admin"
              ? "Super Admin"
              : l.actor.adminRole === "admin"
              ? "Operations Admin"
              : l.actor.adminRole === "support"
              ? "Support Staff"
              : "Admin")
          : l.actor.role.charAt(0).toUpperCase() + l.actor.role.slice(1),
        actionLabel: l.actionLabel,
        entityType:  l.entityType.charAt(0).toUpperCase() + l.entityType.slice(1),
        entityName:  l.entityName,
        entityId:    l.entityId,
        severity:    l.severity.charAt(0).toUpperCase() + l.severity.slice(1),
        details:     l.details,
        ipAddress:   l.ipAddress ?? "—",
      }));
      const meta = {
        title: "Admin Audit Logs",
        subtitle: `${filteredLogs.length} log entries`,
        filters: `Category: ${category} | Actor: ${actorRole} | Date: ${dateRange}${search ? ` | Search: "${search}"` : ""}`,
      };
      if (format === "csv")   exportCSV(cols, rows, "audit_logs.csv");
      else if (format === "excel") await exportExcel(cols, rows, meta, "audit_logs.xlsx");
      else await exportPDF(cols, rows, meta, "audit_logs.pdf");
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [filteredLogs, category, actorRole, dateRange, search]);

  const hasFilters = search || category !== "all" || actorRole !== "all" || dateRange !== "all";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-5 lg:p-7 space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)]">Audit Logs</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Track and review all admin actions across the platform
          </p>
        </div>
        <ExportDropdown onExport={handleExport} loading={exporting} />
      </div>

      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Logs",      value: stats.total,    color: "text-[var(--ink)]",   bg: "bg-slate-50",   icon: ClipboardList },
          { label: "Informational",   value: stats.info,     color: "text-sky-700",         bg: "bg-sky-50",     icon: Info },
          { label: "Warnings",        value: stats.warning,  color: "text-amber-700",       bg: "bg-amber-50",   icon: AlertTriangle },
          { label: "Critical Events", value: stats.critical, color: "text-red-700",         bg: "bg-red-50",     icon: ShieldAlert },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`rounded-2xl border border-[var(--line)] p-4 shadow-sm ${bg}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
                <p className={`mt-1.5 text-2xl font-bold ${color}`}>{value}</p>
              </div>
              <Icon size={18} className={`${color} opacity-70`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
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
              placeholder="Search actor, action, entity, details…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--canvas)] py-2 pl-9 pr-9 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
              id="audit-search-input"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as AuditActionCategory)}
            className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
            id="audit-category-filter"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Actor Role */}
          <select
            value={actorRole}
            onChange={(e) => setActorRole(e.target.value as ActorRole)}
            className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
            id="audit-actor-filter"
          >
            {ACTOR_ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Date range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
            id="audit-date-filter"
          >
            {DATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Custom date range */}
          {dateRange === "custom" && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
                id="audit-date-from" />
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
                id="audit-date-to" />
            </>
          )}

          {/* Reset */}
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setCategory("all"); setActorRole("all"); setDateRange("all"); setCustomFrom(""); setCustomTo(""); }}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors"
              id="audit-reset-filters"
            >
              <X size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Records count ── */}
      <p className="text-sm text-[var(--muted)]">
        <span className="font-semibold text-[var(--ink)]">{filteredLogs.length.toLocaleString("en-IN")}</span>
        {" "}{filteredLogs.length === 1 ? "log entry" : "log entries"} found
      </p>

      {/* ── Log List ── */}
      {loading ? (
        <LoadingState message="Loading audit logs…" />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          title="No audit logs found"
          message="Try adjusting your filters or search terms."
          action={
            hasFilters ? (
              <button
                onClick={() => { setSearch(""); setCategory("all"); setActorRole("all"); setDateRange("all"); setCustomFrom(""); setCustomTo(""); }}
                className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-deep)] transition-colors"
              >
                Reset Filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--canvas)]">
                  {["Timestamp", "Actor", "Action", "Entity", "Severity", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedLogs.map((log) => {
                  const sev = severityBadge(log.severity);
                  const cat = ACTION_CATEGORY_MAP[log.action] ?? "all";
                  const SevIcon = sev.icon;
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--canvas)] transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Timestamp */}
                      <td className="px-4 py-3 min-w-[140px]">
                        <p className="text-sm font-medium text-[var(--ink)]">
                          {fmtDate(log.timestamp)}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {new Date(log.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </p>
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3 min-w-[150px]">
                        <p className="text-sm font-semibold text-[var(--ink)] leading-snug">{log.actor.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {log.actor.role === "admin" ? (
                            <span
                              className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                log.actor.adminRole === "super_admin"
                                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                                  : log.actor.adminRole === "admin"
                                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                                  : log.actor.adminRole === "support"
                                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                                  : "bg-violet-100 text-violet-700 border border-violet-200"
                              }`}
                            >
                              {log.actor.adminRole === "super_admin"
                                ? "Super Admin"
                                : log.actor.adminRole === "admin"
                                ? "Operations Admin"
                                : log.actor.adminRole === "support"
                                ? "Support Staff"
                                : "Admin"}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--muted)] capitalize">{log.actor.role}</span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 min-w-[200px]">
                        <p className="text-sm font-medium text-[var(--ink)]">{log.actionLabel}</p>
                        <span className={`mt-1 inline-block text-xs font-medium rounded-full px-2 py-0.5 ${actionBadgeColor(cat)}`}>
                          {CATEGORY_OPTIONS.find((o) => o.value === cat)?.label ?? cat}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="px-4 py-3 min-w-[160px]">
                        <p className="text-sm text-[var(--ink)] line-clamp-1">{log.entityName}</p>
                        <p className="text-xs text-[var(--muted)] capitalize">{log.entityType}</p>
                      </td>

                      {/* Severity */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sev.cls}`}>
                          <SevIcon size={12} />
                          {sev.label}
                        </span>
                      </td>

                      {/* Details arrow */}
                      <td className="px-4 py-3">
                        <ChevronRight size={14} className="text-[var(--muted)]" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center border-t border-[var(--line)] px-4 py-3">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      {/* Detail Drawer */}
      <AuditLogDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
