"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Bell,
  Send,
  Users,
  Stethoscope,
  UserCheck,
  Search,
  X,
  Filter,
  Trash2,
  Loader2,
  Megaphone,
  Wrench,
  Tag,
  AlarmClock,
  AlertCircle,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  hydrateNotifications,
  deleteNotification,
} from "@/store/slices/adminNotificationsSlice";
import type { AdminNotification, NotificationCategory, NotificationTarget } from "@/types/notification";
import Pagination from "@/components/ui/Pagination";
import { LoadingState, EmptyState } from "@/components/ui/StateViews";
import SendNotificationModal from "@/features/admin-portal/components/SendNotificationModal";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
type TargetFilter = "all" | NotificationTarget;
type CategoryFilter = "all" | NotificationCategory;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days >= 30) return `${Math.floor(days / 30)}mo ago`;
  if (days >= 1) return `${days}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  return "Just now";
};

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

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  NotificationCategory,
  { label: string; cls: string; Icon: React.ElementType }
> = {
  announcement: { label: "Announcement", cls: "bg-blue-50 text-blue-700 border-blue-200", Icon: Megaphone },
  maintenance: { label: "Maintenance", cls: "bg-orange-50 text-orange-700 border-orange-200", Icon: Wrench },
  promotion: { label: "Promotion", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: Tag },
  reminder: { label: "Reminder", cls: "bg-violet-50 text-violet-700 border-violet-200", Icon: AlarmClock },
  alert: { label: "Alert", cls: "bg-red-50 text-red-700 border-red-200", Icon: AlertCircle },
};

const TARGET_CONFIG: Record<NotificationTarget, { label: string; Icon: React.ElementType }> = {
  all_patients: { label: "All Patients", Icon: Users },
  all_doctors: { label: "All Doctors", Icon: Stethoscope },
  selected_users: { label: "Selected Users", Icon: UserCheck },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  sub,
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

function CategoryBadge({ category }: { category: NotificationCategory }) {
  const { label, cls, Icon } = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.announcement;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${cls}`}>
      <Icon size={9} />
      {label}
    </span>
  );
}

function TargetBadge({ target }: { target: NotificationTarget }) {
  const { label, Icon } = TARGET_CONFIG[target] ?? TARGET_CONFIG.all_patients;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--canvas)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--muted)]">
      <Icon size={9} />
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

// ─── Notification Detail Drawer (inline) ─────────────────────────────────────

function NotificationDetailPanel({
  notification,
  onClose,
}: {
  notification: AdminNotification;
  onClose: () => void;
}) {
  const { label: catLabel, cls, Icon: CatIcon } = CATEGORY_CONFIG[notification.category] ?? CATEGORY_CONFIG.announcement;
  const { label: tgtLabel, Icon: TgtIcon } = TARGET_CONFIG[notification.target] ?? TARGET_CONFIG.all_patients;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--canvas)] px-4 py-3">
        <p className="text-sm font-bold text-[var(--ink)]">Notification Details</p>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] hover:bg-stone-100 hover:text-[var(--ink)] transition">
          <X size={15} />
        </button>
      </div>
      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <p className="text-base font-bold text-[var(--ink)] leading-snug">{notification.title}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <CategoryBadge category={notification.category} />
            <TargetBadge target={notification.target} />
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              ✓ Sent
            </span>
          </div>
        </div>

        {/* Message */}
        <div className="rounded-xl bg-[var(--canvas)] border border-[var(--line)] p-3">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">Message</p>
          <p className="text-sm text-[var(--ink)] leading-relaxed whitespace-pre-wrap">
            {notification.message}
          </p>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-[var(--canvas)] border border-[var(--line)] p-3">
            <p className="text-[var(--muted)] font-medium">Sent At</p>
            <p className="mt-1 font-semibold text-[var(--ink)]">{fmtDateTime(notification.sentAt)}</p>
          </div>
          <div className="rounded-xl bg-[var(--canvas)] border border-[var(--line)] p-3">
            <p className="text-[var(--muted)] font-medium">Recipients</p>
            <p className="mt-1 font-semibold text-[var(--ink)]">{notification.recipientCount ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-[var(--canvas)] border border-[var(--line)] p-3">
            <p className="text-[var(--muted)] font-medium">Target</p>
            <p className="mt-1 flex items-center gap-1 font-semibold text-[var(--ink)]">
              <TgtIcon size={11} /> {tgtLabel}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--canvas)] border border-[var(--line)] p-3">
            <p className="text-[var(--muted)] font-medium">Category</p>
            <p className="mt-1 flex items-center gap-1 font-semibold text-[var(--ink)]">
              <CatIcon size={11} className={cls.split(" ")[1]} /> {catLabel}
            </p>
          </div>
        </div>

        {/* Selected users */}
        {notification.target === "selected_users" && notification.selectedUsers && notification.selectedUsers.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">Selected Recipients</p>
            <div className="flex flex-wrap gap-1.5">
              {notification.selectedUsers.map((u) => (
                <span key={u} className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                  {u}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((s) => s.adminNotifications.notifications);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [page, setPage] = useState<number>(() => getStoredPage("admin_notifs_page"));
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<AdminNotification | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("admin_notifs_page", String(newPage));
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(newPage));
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    dispatch(hydrateNotifications());
    setLoading(false);
  }, [dispatch]);

  // ── Metrics ─────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = notifications.length;
    const toPatients = notifications.filter((n) => n.target === "all_patients").length;
    const toDoctors = notifications.filter((n) => n.target === "all_doctors").length;
    const totalRecipients = notifications.reduce((s, n) => s + (n.recipientCount ?? 0), 0);
    return { total, toPatients, toDoctors, totalRecipients };
  }, [notifications]);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo<AdminNotification[]>(() => {
    const q = search.trim().toLowerCase();
    return notifications
      .filter((n) => {
        const matchSearch =
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q);
        const matchTarget = targetFilter === "all" || n.target === targetFilter;
        const matchCat = categoryFilter === "all" || n.category === categoryFilter;
        return matchSearch && matchTarget && matchCat;
      })
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }, [notifications, search, targetFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters = search || targetFilter !== "all" || categoryFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setTargetFilter("all");
    setCategoryFilter("all");
  };

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    handlePageChange(1);
  }, [search, targetFilter, categoryFilter, handlePageChange]);

  useEffect(() => {
    if (!loading && filtered.length > 0 && page > totalPages) {
      handlePageChange(totalPages);
    }
  }, [loading, filtered.length, page, totalPages, handlePageChange]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteLoading(id);
    await new Promise((r) => setTimeout(r, 400));
    dispatch(deleteNotification(id));
    if (selectedNotif?.id === id) setSelectedNotif(null);
    setDeleteLoading(null);
  };

  const handleSent = () => {
    setJustSent(true);
    setTimeout(() => setJustSent(false), 3000);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)]">System Notifications</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Broadcast announcements, alerts, and reminders to platform users.
          </p>
        </div>
        <button
          id="send-notification-open"
          onClick={() => setSendModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Send size={15} />
          Send Notification
        </button>
      </div>

      {/* Just-sent toast */}
      {justSent && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          <Bell size={15} className="shrink-0" />
          Notification sent successfully!
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Sent"
          value={metrics.total}
          sub="All-time broadcasts"
          icon={Send}
          iconBg="bg-teal-50"
          iconColor="text-[var(--brand)]"
        />
        <MetricCard
          label="Total Recipients"
          value={metrics.totalRecipients.toLocaleString()}
          sub="Cumulative reach"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <MetricCard
          label="Patient Broadcasts"
          value={metrics.toPatients}
          icon={Users}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <MetricCard
          label="Doctor Broadcasts"
          value={metrics.toDoctors}
          icon={Stethoscope}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
            <input
              id="notifs-search"
              type="text"
              placeholder="Search title or message…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-white py-2.5 pl-9 pr-9 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] placeholder:text-stone-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition">
                <X size={14} />
              </button>
            )}
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-medium text-[var(--muted)] hover:text-red-600 hover:border-red-200 transition-colors">
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
            <Filter size={12} /> Filters:
          </span>
          <FilterSelect id="target-filter" value={targetFilter} onChange={(v) => setTargetFilter(v as TargetFilter)}>
            <option value="all">All Audiences</option>
            <option value="all_patients">All Patients</option>
            <option value="all_doctors">All Doctors</option>
            <option value="selected_users">Selected Users</option>
          </FilterSelect>
          <FilterSelect id="category-filter" value={categoryFilter} onChange={(v) => setCategoryFilter(v as CategoryFilter)}>
            <option value="all">All Categories</option>
            <option value="announcement">Announcement</option>
            <option value="maintenance">Maintenance</option>
            <option value="promotion">Promotion</option>
            <option value="reminder">Reminder</option>
            <option value="alert">Alert</option>
          </FilterSelect>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-[var(--muted)]">
          Showing <span className="font-semibold text-[var(--ink)]">{filtered.length}</span> notification{filtered.length !== 1 ? "s" : ""}
          {hasActiveFilters && (
            <span> · <button onClick={clearFilters} className="text-[var(--brand)] hover:underline">clear filters</button></span>
          )}
        </p>
      )}

      {/* Main layout — table + detail panel */}
      <div className={`grid gap-5 ${selectedNotif ? "lg:grid-cols-[1fr_380px]" : "grid-cols-1"}`}>

        {/* Table */}
        <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
          {loading ? (
            <LoadingState message="Loading notifications…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Bell size={26} />}
              title="No notifications found"
              message={
                hasActiveFilters
                  ? "Try adjusting your search or filters."
                  : "No system notifications have been sent yet. Click 'Send Notification' to get started."
              }
              action={
                hasActiveFilters ? (
                  <button onClick={clearFilters} className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-xs font-medium text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors">
                    Clear filters
                  </button>
                ) : (
                  <button
                    onClick={() => setSendModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors"
                  >
                    <Send size={12} /> Send First Notification
                  </button>
                )
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--line)] bg-[var(--canvas)]">
                      {["Title & Message", "Audience", "Category", "Date", "Recipients", "Actions"].map((h) => (
                        <th
                          key={h}
                          className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)] ${
                            h === "Audience" || h === "Category" ? "hidden sm:table-cell" : ""
                          } ${h === "Date" || h === "Recipients" ? "hidden md:table-cell" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {paginated.map((notif) => {
                      const isSelected = selectedNotif?.id === notif.id;
                      const isDeleting = deleteLoading === notif.id;
                      return (
                        <tr
                          key={notif.id}
                          onClick={() => setSelectedNotif(isSelected ? null : notif)}
                          className={`cursor-pointer transition-colors hover:bg-[var(--canvas)] ${
                            isSelected ? "bg-teal-50/60" : ""
                          }`}
                        >
                          {/* Title & snippet */}
                          <td className="px-4 py-3.5 max-w-[220px]">
                            <p className="font-semibold text-[var(--ink)] truncate">{notif.title}</p>
                            <p className="mt-0.5 text-xs text-[var(--muted)] line-clamp-1">{notif.message}</p>
                          </td>

                          {/* Audience */}
                          <td className="hidden px-4 py-3.5 sm:table-cell">
                            <TargetBadge target={notif.target} />
                          </td>

                          {/* Category */}
                          <td className="hidden px-4 py-3.5 sm:table-cell">
                            <CategoryBadge category={notif.category} />
                          </td>

                          {/* Date */}
                          <td className="hidden px-4 py-3.5 md:table-cell">
                            <p className="font-medium text-[var(--ink)]">{fmtDate(notif.sentAt)}</p>
                            <p className="text-xs text-[var(--muted)]">{relativeTime(notif.sentAt)}</p>
                          </td>

                          {/* Recipients */}
                          <td className="hidden px-4 py-3.5 md:table-cell">
                            <span className="font-bold text-[var(--ink)]">
                              {notif.recipientCount?.toLocaleString() ?? "—"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              <button
                                id={`notif-view-${notif.id}`}
                                onClick={() => setSelectedNotif(isSelected ? null : notif)}
                                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                                  isSelected
                                    ? "border-[var(--brand)] text-[var(--brand)] bg-teal-50"
                                    : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                                }`}
                              >
                                {isSelected ? "Close" : "View"}
                              </button>
                              <button
                                id={`notif-delete-${notif.id}`}
                                onClick={(e) => handleDelete(notif.id, e)}
                                disabled={isDeleting}
                                title="Delete notification"
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                {isDeleting ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Trash2 size={12} />
                                )}
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
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--line)] px-4 py-3">
                  <p className="text-xs text-[var(--muted)]">
                    Showing{" "}
                    <strong className="text-[var(--ink)]">{(page - 1) * PAGE_SIZE + 1}</strong>–
                    <strong className="text-[var(--ink)]">{Math.min(page * PAGE_SIZE, filtered.length)}</strong>{" "}
                    of <strong className="text-[var(--ink)]">{filtered.length}</strong> notifications
                  </p>
                  <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel — right column on desktop */}
        {selectedNotif && (
          <div className="lg:sticky lg:top-5 self-start">
            <NotificationDetailPanel
              notification={selectedNotif}
              onClose={() => setSelectedNotif(null)}
            />
          </div>
        )}
      </div>

      {/* Send Notification Modal */}
      <SendNotificationModal
        open={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        onSent={handleSent}
      />
    </div>
  );
}
