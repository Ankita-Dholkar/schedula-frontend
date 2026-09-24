"use client";

import { CheckCircle2, XCircle, Edit2, X, ShieldCheck } from "lucide-react";
import {
  type AdminManagedUser,
  ROLE_META,
  ROLE_PERMISSIONS,
  type AdminModule,
  type AdminAction,
} from "@/types/admin";
import Badge from "@/components/ui/Badge";

type Props = {
  admin: AdminManagedUser | null;
  onClose: () => void;
  onEdit?: (admin: AdminManagedUser) => void;
};

const MODULE_LABELS: Record<AdminModule, string> = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  doctors: "Doctors",
  doctor_verification: "Doctor Verification",
  patients: "Patients",
  appointments: "Appointments",
  payments: "Payments",
  reviews: "Reviews",
  notifications: "Notifications",
  reports: "Reports",
  audit_logs: "Audit Logs",
  admin_users: "Admin Users",
  settings: "Settings",
};

const ALL_MODULES: AdminModule[] = Object.keys(MODULE_LABELS) as AdminModule[];
const ALL_ACTIONS: AdminAction[] = ["view", "create", "edit", "delete", "approve_reject"];
const ACTION_LABELS: Record<AdminAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  approve_reject: "Approve/Reject",
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function AdminDetailsDrawer({ admin, onClose, onEdit }: Props) {
  if (!admin) return null;

  const rm = ROLE_META[admin.adminRole];
  const perms = ROLE_PERMISSIONS[admin.adminRole];

  const initials = admin.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[var(--brand)]" />
            <h2 className="text-base font-bold text-[var(--ink)]">Admin Details</h2>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(admin)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors"
                id="drawer-edit-btn"
              >
                <Edit2 size={12} />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)] transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand)] text-white text-lg font-bold shadow-sm">
              {initials}
            </div>
            <div>
              <p className="text-base font-bold text-[var(--ink)]">{admin.name}</p>
              <p className="text-sm text-[var(--muted)]">{admin.email}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rm.badgeColor} ${rm.badgeBorder}`}>
                  {rm.label}
                </span>
                <Badge variant={admin.isActive ? "active" : "inactive"} dot />
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--line)] bg-[var(--canvas)] p-4">
            {[
              { label: "Phone", value: admin.mobile },
              { label: "Admin ID", value: admin.id },
              { label: "Joined", value: fmtDate(admin.createdAt) },
              { label: "Last Login", value: fmtDate(admin.lastLoginAt) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
                <p className="mt-0.5 text-sm font-medium text-[var(--ink)] break-all">{value || "—"}</p>
              </div>
            ))}
          </div>

          {/* Role Description */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--canvas)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Role Description</p>
            <p className="text-sm text-[var(--ink)] leading-relaxed">{rm.description}</p>
          </div>

          {/* Permission Matrix */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">Module Permissions</p>
            <div className="rounded-2xl border border-[var(--line)] bg-white overflow-hidden shadow-sm">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--canvas)]">
                    <th className="px-3 py-2 text-left font-semibold text-[var(--muted)] uppercase tracking-wider">Module</th>
                    {ALL_ACTIONS.map((a) => (
                      <th key={a} className="px-2 py-2 text-center font-semibold text-[var(--muted)] uppercase tracking-wider text-[9px]">
                        {ACTION_LABELS[a]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_MODULES.map((mod) => {
                    const modulePerms = perms[mod] ?? [];
                    return (
                      <tr key={mod} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--canvas)] transition-colors">
                        <td className="px-3 py-2 font-medium text-[var(--ink)]">{MODULE_LABELS[mod]}</td>
                        {ALL_ACTIONS.map((action) => {
                          const has = modulePerms.includes(action);
                          return (
                            <td key={action} className="px-2 py-2 text-center">
                              {has ? (
                                <CheckCircle2 size={13} className="mx-auto text-emerald-500" />
                              ) : (
                                <XCircle size={13} className="mx-auto text-slate-200" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
