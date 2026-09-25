"use client";

import { useEffect, useRef } from "react";
import {
  X,
  User,
  Tag,
  Calendar,
  Info,
  Database,
  Wifi,
  ShieldAlert,
} from "lucide-react";
import type { AuditLog, AuditSeverity, AuditActionCategory } from "@/types/auditLog";
import { ACTION_CATEGORY_MAP } from "@/types/auditLog";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function severityConfig(severity: AuditSeverity) {
  if (severity === "critical")
    return { label: "Critical", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
  if (severity === "warning")
    return { label: "Warning", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
  return { label: "Info", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200" };
}

function categoryLabel(log: AuditLog): string {
  const cat: AuditActionCategory = ACTION_CATEGORY_MAP[log.action] ?? "all";
  const labels: Record<AuditActionCategory, string> = {
    all: "All",
    doctor_management: "Doctor Management",
    patient_management: "Patient Management",
    appointments: "Appointments",
    payments: "Payments",
    reviews: "Reviews",
    notifications: "Notifications",
    admin_management: "Admin Management",
    settings: "Platform Settings",
    auth: "Authentication",
  };
  return labels[cat] ?? cat;
}

function entityTypeLabel(type: AuditLog["entityType"]): string {
  const map: Record<AuditLog["entityType"], string> = {
    doctor: "Doctor",
    patient: "Patient",
    appointment: "Appointment",
    payment: "Payment",
    review: "Review",
    notification: "Notification",
    system: "System",
    auth: "Auth",
    settings: "Platform Settings",
    admin_user: "Admin User",
  };
  return map[type] ?? type;
}

function getActorRoleBadge(actor: AuditLog["actor"]): { label: string; cls: string } {
  if (actor.role === "admin") {
    if (actor.adminRole === "super_admin") {
      return { label: "Super Admin", cls: "bg-purple-100 text-purple-700 border border-purple-200" };
    }
    if (actor.adminRole === "admin") {
      return { label: "Operations Admin", cls: "bg-blue-100 text-blue-700 border border-blue-200" };
    }
    if (actor.adminRole === "support") {
      return { label: "Support Staff", cls: "bg-slate-100 text-slate-700 border border-slate-200" };
    }
    return { label: "Administrator", cls: "bg-violet-100 text-violet-700 border border-violet-200" };
  }
  if (actor.role === "doctor") {
    return { label: "Doctor", cls: "bg-sky-100 text-sky-700 border border-sky-200" };
  }
  return { label: "Patient", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
}

// ── Row Component ─────────────────────────────────────────────────────────────

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-[var(--line)] last:border-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      <div className="text-sm text-[var(--ink)]">{children}</div>
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

type Props = {
  log: AuditLog | null;
  onClose: () => void;
};

export default function AuditLogDetailDrawer({ log, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!log) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timeout = setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handler);
    };
  }, [log, onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const severity = log ? severityConfig(log.severity) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          log ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl
          transition-transform duration-300 ease-in-out
          ${log ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Audit Log Details"
      >
        {log && severity ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">
                  Audit Log
                </p>
                <h2 className="text-sm font-bold text-[var(--ink)] leading-snug">
                  {log.actionLabel}
                </h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {fmtDateTime(log.timestamp)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)] transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Severity Badge */}
            <div className={`mx-5 mt-4 flex items-center gap-2 rounded-xl border px-3 py-2.5 ${severity.bg} ${severity.border}`}>
              <ShieldAlert size={15} className={severity.color} />
              <p className={`text-xs font-semibold ${severity.color}`}>
                Severity: {severity.label}
              </p>
              <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-md ${severity.bg} border ${severity.border} ${severity.color}`}>
                {log.id}
              </span>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">

              {/* Actor */}
              <div className="mb-4 rounded-xl border border-[var(--line)] p-3.5 bg-[var(--canvas)]/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><User size={11} /> Performed By</span>
                  <span className="font-mono text-[10px] text-[var(--muted)]">ID: {log.actor.id}</span>
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white text-xs font-bold">
                    {log.actor.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--ink)] truncate">{log.actor.name}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{log.actor.email}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold rounded-full px-2.5 py-0.5 ${getActorRoleBadge(log.actor).cls}`}>
                    {getActorRoleBadge(log.actor).label}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="rounded-xl border border-[var(--line)] px-3.5 divide-y divide-[var(--line)]">
                <DetailRow label="Action">
                  <span className="font-semibold">{log.actionLabel}</span>
                </DetailRow>

                <DetailRow label="Category">
                  {categoryLabel(log)}
                </DetailRow>

                <DetailRow label="Entity Type & Name">
                  <span className="font-medium">{entityTypeLabel(log.entityType)}</span>
                  <span className="mx-2 text-[var(--muted)]">—</span>
                  <span>{log.entityName}</span>
                </DetailRow>

                <DetailRow label="Entity ID">
                  <span className="font-mono text-xs text-[var(--muted)]">{log.entityId}</span>
                </DetailRow>

                <DetailRow label="Timestamp">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-[var(--muted)]" />
                    {fmtDateTime(log.timestamp)}
                  </div>
                </DetailRow>

                {log.ipAddress && (
                  <DetailRow label="IP Address">
                    <div className="flex items-center gap-1.5">
                      <Wifi size={12} className="text-[var(--muted)]" />
                      <span className="font-mono text-xs">{log.ipAddress}</span>
                    </div>
                  </DetailRow>
                )}
              </div>

              {/* Description */}
              <div className="mt-4 rounded-xl border border-[var(--line)] p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-2 flex items-center gap-1.5">
                  <Info size={11} /> Description
                </p>
                <p className="text-sm text-[var(--ink)] leading-relaxed">{log.details}</p>
              </div>

              {/* Metadata */}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="mt-4 rounded-xl border border-[var(--line)] p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-2 flex items-center gap-1.5">
                    <Database size={11} /> Metadata
                  </p>
                  <div className="space-y-1.5">
                    {Object.entries(log.metadata).map(([key, val]) => (
                      <div key={key} className="flex items-start justify-between gap-3 text-xs">
                        <span className="text-[var(--muted)] font-medium capitalize shrink-0">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="font-mono text-right text-[var(--ink)] break-all">
                          {typeof val === "object" ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--line)] px-5 py-3">
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-[var(--canvas)] py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--line)] transition-colors"
              >
                Close
              </button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
