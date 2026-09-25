"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Plus,
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronRight,
  Users,
  Shield,
  Eye,
  Edit2,
  Power,
  PowerOff,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hydrateAdminManagement,
  addAdmin,
  updateAdmin,
  setAdminActiveStatus,
  selectAllAdmins,
} from "@/store/slices/adminManagementSlice";
import { updateAdminProfile } from "@/store/slices/adminAuthSlice";
import { logAdminAction } from "@/store/slices/auditLogsSlice";
import { getAuditActor } from "@/types/auditLog";
import { saveAdminUsers } from "@/lib/mock-data/admins";
import {
  wouldRemoveLastSuperAdmin,
  wouldStripLastSuperAdminRole,
  hasPermission,
} from "@/lib/admin/permissions";
import {
  ROLE_META,
  type AdminManagedUser,
  type AdminRole,
  type NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "@/types/admin";
import Badge from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/StateViews";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import AdminDetailsDrawer from "@/features/admin-portal/components/AdminDetailsDrawer";
import AdminFormModal from "@/features/admin-portal/components/AdminFormModal";
import AdminDeactivateDialog from "@/features/admin-portal/components/AdminDeactivateDialog";

const PAGE_SIZE = 10;

type RoleFilter = "all" | AdminRole;
type StatusFilter = "all" | "active" | "inactive";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function AdminUsersPage() {
  const dispatch = useAppDispatch();
  const allAdmins = useAppSelector(selectAllAdmins);
  const currentAdmin = useAppSelector((s) => s.adminAuth.admin);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  // Modal/drawer states
  const [selectedAdmin, setSelectedAdmin] = useState<AdminManagedUser | null>(null);
  const [drawerAdmin, setDrawerAdmin] = useState<AdminManagedUser | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminManagedUser | null>(null);

  // Safeguard error state
  const [safeguardError, setSafeguardError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(hydrateAdminManagement());
    setLoading(false);
  }, [dispatch]);

  useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter]);

  // ── Filtered & Paged ──────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return allAdmins.filter((a) => {
      if (roleFilter !== "all" && a.adminRole !== roleFilter) return false;
      if (statusFilter === "active" && !a.isActive) return false;
      if (statusFilter === "inactive" && a.isActive) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.name.toLowerCase().includes(q) &&
          !a.email.toLowerCase().includes(q) &&
          !a.mobile.includes(q)
        ) return false;
      }
      return true;
    });
  }, [allAdmins, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // ── KPI Stats ─────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total:       allAdmins.length,
    superAdmin:  allAdmins.filter((a) => a.adminRole === "super_admin" && a.isActive).length,
    operations:  allAdmins.filter((a) => a.adminRole === "admin" && a.isActive).length,
    support:     allAdmins.filter((a) => a.adminRole === "support" && a.isActive).length,
    deactivated: allAdmins.filter((a) => !a.isActive).length,
  }), [allAdmins]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleAddAdmin = useCallback((data: Omit<AdminManagedUser, "id" | "createdAt">) => {
    const newAdmin: AdminManagedUser = {
      ...data,
      id: `admin-${Date.now()}`,
      createdAt: new Date().toISOString(),
      notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
    };
    dispatch(addAdmin(newAdmin));
    dispatch(logAdminAction({
      actor: getAuditActor(currentAdmin),
      action: "ADMIN_USER_CREATED",
      entityType: "admin_user",
      entityId: newAdmin.id,
      entityName: newAdmin.name,
      details: `Created new admin user ${newAdmin.name} (${ROLE_META[newAdmin.adminRole]?.label ?? newAdmin.adminRole}).`,
      metadata: { role: newAdmin.adminRole, email: newAdmin.email },
      ipAddress: "127.0.0.1",
      severity: "info",
    }));
    setFormMode(null);
  }, [dispatch, currentAdmin]);

  const handleEditAdmin = useCallback((data: Partial<AdminManagedUser>) => {
    if (!selectedAdmin) return;

    // Safeguard: stripping last super admin role
    if (data.adminRole && data.adminRole !== "super_admin") {
      if (wouldStripLastSuperAdminRole(allAdmins, selectedAdmin.id, data.adminRole)) {
        setSafeguardError("Cannot change role — this is the last active Super Admin.");
        return;
      }
    }

    dispatch(updateAdmin({ id: selectedAdmin.id, changes: data }));
    dispatch(logAdminAction({
      actor: getAuditActor(currentAdmin),
      action: "ADMIN_USER_UPDATED",
      entityType: "admin_user",
      entityId: selectedAdmin.id,
      entityName: selectedAdmin.name,
      details: `Updated admin user ${selectedAdmin.name}.`,
      metadata: { changes: data },
      ipAddress: "127.0.0.1",
      severity: "info",
    }));

    // If editing self, also update Redux auth state and localStorage session
    if (currentAdmin?.id === selectedAdmin.id) {
      dispatch(updateAdminProfile(data));
      try {
        const raw = localStorage.getItem("loggedInAdmin");
        if (raw) {
          const stored = JSON.parse(raw);
          localStorage.setItem("loggedInAdmin", JSON.stringify({ ...stored, ...data }));
        }
      } catch { /* ignore */ }
    }

    setFormMode(null);
    setSelectedAdmin(null);
  }, [dispatch, selectedAdmin, allAdmins, currentAdmin]);

  const handleDeactivateConfirm = useCallback((targetId: string, activate: boolean) => {
    setSafeguardError(null);

    if (!activate) {
      // Safeguard: cannot deactivate self
      if (targetId === currentAdmin?.id) {
        setSafeguardError("You cannot deactivate your own account.");
        setDeactivateTarget(null);
        return;
      }
      // Safeguard: cannot deactivate last active super admin
      if (wouldRemoveLastSuperAdmin(allAdmins, targetId)) {
        setSafeguardError("Cannot deactivate — this is the last active Super Admin.");
        setDeactivateTarget(null);
        return;
      }
    }

    dispatch(setAdminActiveStatus({ id: targetId, isActive: activate }));
    const targetAdmin = allAdmins.find((a) => a.id === targetId);
    dispatch(logAdminAction({
      actor: getAuditActor(currentAdmin),
      action: "ADMIN_USER_STATUS_TOGGLED",
      entityType: "admin_user",
      entityId: targetId,
      entityName: targetAdmin?.name ?? targetId,
      details: `Admin user ${targetAdmin?.name ?? targetId} ${activate ? "activated" : "deactivated"} by admin.`,
      metadata: { targetId, isActive: activate },
      ipAddress: "127.0.0.1",
      severity: activate ? "info" : "warning",
    }));
    setDeactivateTarget(null);
  }, [dispatch, allAdmins, currentAdmin]);

  const canManage = hasPermission(currentAdmin, "admin_users", "edit");
  const canCreate = hasPermission(currentAdmin, "admin_users", "create");

  const hasFilters = search || roleFilter !== "all" || statusFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-5 lg:p-7 space-y-5 max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2">
            <ShieldCheck size={20} className="text-[var(--brand)]" />
            Admin Users
          </h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Manage administrator accounts, roles, and access control.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setSelectedAdmin(null); setFormMode("add"); }}
            className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-deep)] transition-colors"
            id="add-admin-btn"
          >
            <Plus size={16} />
            Add Admin
          </button>
        )}
      </div>

      {/* Safeguard Error */}
      {safeguardError && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <Shield size={16} className="shrink-0 text-rose-500" />
          <span>{safeguardError}</span>
          <button onClick={() => setSafeguardError(null)} className="ml-auto text-rose-400 hover:text-rose-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Total Admins",   value: stats.total,       icon: Users,       color: "text-[var(--ink)]",    bg: "bg-slate-50"    },
          { label: "Super Admins",   value: stats.superAdmin,  icon: ShieldCheck, color: "text-violet-700",      bg: "bg-violet-50"   },
          { label: "Operations",     value: stats.operations,  icon: Shield,      color: "text-blue-700",        bg: "bg-blue-50"     },
          { label: "Support",        value: stats.support,     icon: Users,       color: "text-slate-600",       bg: "bg-slate-100"   },
          { label: "Deactivated",    value: stats.deactivated, icon: PowerOff,    color: "text-rose-600",        bg: "bg-rose-50"     },
        ].map(({ label, value, icon: Icon, color, bg }) => (
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

      {/* Filters */}
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
              id="admin-search"
              type="text"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--canvas)] py-2 pl-9 pr-9 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Role */}
          <select
            id="admin-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Operations Admin</option>
            <option value="support">Support Staff</option>
          </select>

          {/* Status */}
          <select
            id="admin-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors"
            >
              <X size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <p className="text-sm text-[var(--muted)]">
        <span className="font-semibold text-[var(--ink)]">{filtered.length}</span>{" "}
        {filtered.length === 1 ? "admin" : "admins"} found
      </p>

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading admin users…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No admins found"
          message="Try adjusting your search or filters."
          action={hasFilters ? (
            <button onClick={resetFilters} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-deep)] transition-colors">
              Reset Filters
            </button>
          ) : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--canvas)]">
                  {["Admin", "Email", "Phone", "Role", "Status", "Joined", "Last Login", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((admin) => {
                  const rm = ROLE_META[admin.adminRole];
                  const isSelf = admin.id === currentAdmin?.id;
                  return (
                    <tr
                      key={admin.id}
                      className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--canvas)] transition-colors"
                    >
                      {/* Name */}
                      <td className="px-4 py-3 min-w-[160px]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white text-xs font-bold">
                            {admin.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--ink)]">{admin.name}</p>
                            {isSelf && (
                              <span className="text-[10px] text-[var(--brand)] font-semibold">You</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 min-w-[200px]">
                        <p className="text-[var(--ink)] truncate max-w-[200px]">{admin.email}</p>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 min-w-[130px]">
                        <p className="text-[var(--muted)]">{admin.mobile}</p>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${rm.badgeColor} ${rm.badgeBorder}`}>
                          {rm.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge variant={admin.isActive ? "active" : "inactive"} dot />
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 min-w-[110px]">
                        <p className="text-[var(--muted)] text-xs">{fmtDate(admin.createdAt)}</p>
                      </td>

                      {/* Last Login */}
                      <td className="px-4 py-3 min-w-[140px]">
                        <p className="text-[var(--muted)] text-xs">{fmtDateTime(admin.lastLoginAt)}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* View */}
                          <button
                            onClick={() => setDrawerAdmin(admin)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--brand)] transition-colors"
                            title="View details"
                            id={`admin-view-${admin.id}`}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit */}
                          {canManage && (
                            <button
                              onClick={() => { setSelectedAdmin(admin); setFormMode("edit"); }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-blue-600 transition-colors"
                              title="Edit admin"
                              id={`admin-edit-${admin.id}`}
                            >
                              <Edit2 size={14} />
                            </button>
                          )}

                          {/* Deactivate / Activate */}
                          {canManage && !isSelf && (
                            <button
                              onClick={() => setDeactivateTarget(admin)}
                              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                                admin.isActive
                                  ? "text-[var(--muted)] hover:bg-amber-50 hover:text-amber-600"
                                  : "text-[var(--muted)] hover:bg-emerald-50 hover:text-emerald-600"
                              }`}
                              title={admin.isActive ? "Deactivate" : "Activate"}
                              id={`admin-toggle-${admin.id}`}
                            >
                              {admin.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                            </button>
                          )}

                          <ChevronRight size={14} className="text-[var(--muted)] ml-1" />
                        </div>
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

      {/* ── Drawers & Modals ── */}

      {/* View Details Drawer */}
      <AdminDetailsDrawer
        admin={drawerAdmin}
        onClose={() => setDrawerAdmin(null)}
        onEdit={canManage ? (a) => { setSelectedAdmin(a); setDrawerAdmin(null); setFormMode("edit"); } : undefined}
      />

      {/* Add / Edit Modal */}
      <AdminFormModal
        mode={formMode}
        admin={selectedAdmin}
        allAdmins={allAdmins}
        currentAdminId={currentAdmin?.id}
        onClose={() => { setFormMode(null); setSelectedAdmin(null); setSafeguardError(null); }}
        onSubmitAdd={handleAddAdmin}
        onSubmitEdit={handleEditAdmin}
        onSafeguardError={setSafeguardError}
      />

      {/* Deactivate / Activate Dialog */}
      {deactivateTarget && (
        <AdminDeactivateDialog
          admin={deactivateTarget}
          allAdmins={allAdmins}
          currentAdminId={currentAdmin?.id ?? ""}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={handleDeactivateConfirm}
        />
      )}
    </div>
  );
}
