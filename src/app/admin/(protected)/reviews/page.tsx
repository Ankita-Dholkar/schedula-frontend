"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Star,
  MessageSquare,
  Flag,
  EyeOff,
  Search,
  X,
  Filter,
  Eye,
  Loader2,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { hydrateReviews, toggleHideReview, selectAllReviewsForAdmin } from "@/store/slices/reviewsSlice";
import { logAdminAction } from "@/store/slices/auditLogsSlice";
import { getAuditActor } from "@/types/auditLog";
import type { Review } from "@/types/review";
import Pagination from "@/components/ui/Pagination";
import { LoadingState, EmptyState } from "@/components/ui/StateViews";
import ReviewDetailModal from "@/features/admin-portal/components/ReviewDetailModal";
import { hasPermission } from "@/lib/admin/permissions";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
type TabType = "all" | "reported" | "hidden";
type RatingFilter = "all" | "1" | "2" | "3" | "4" | "5";
type DateFilter = "all" | "today" | "this_week" | "this_month" | "past";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
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
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={s <= rating ? "fill-amber-400 text-amber-400" : "text-stone-200"}
        />
      ))}
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

export default function AdminReviewsPage() {
  const dispatch = useAppDispatch();
  const allReviews = useAppSelector(selectAllReviewsForAdmin);
  const currentAdmin = useAppSelector((s) => s.adminAuth.admin);
  const canEditReviews = hasPermission(currentAdmin, "reviews", "edit");

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [page, setPage] = useState<number>(() => getStoredPage("admin_reviews_page"));
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [quickActionLoading, setQuickActionLoading] = useState<string | null>(null);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("admin_reviews_page", String(newPage));
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(newPage));
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    dispatch(hydrateReviews());
    setLoading(false);
  }, [dispatch]);

  // ── Derived metrics ──────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = allReviews.length;
    const reported = allReviews.filter((r) => r.isReported).length;
    const hidden = allReviews.filter((r) => r.isHidden).length;
    const visible = allReviews.filter((r) => !r.isHidden);
    const avg =
      visible.length > 0
        ? Math.round(
            (visible.reduce((s, r) => s + r.rating, 0) / visible.length) * 10
          ) / 10
        : 0;
    return { avg, total, reported, hidden };
  }, [allReviews]);

  // Unique doctor names
  const doctorNames = useMemo(() => {
    const names = new Set(allReviews.map((r) => r.doctorName));
    return Array.from(names).sort();
  }, [allReviews]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo<Review[]>(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30);

    return allReviews
      .filter((r) => {
        const matchTab =
          activeTab === "all" ||
          (activeTab === "reported" && r.isReported) ||
          (activeTab === "hidden" && r.isHidden);

        const matchSearch =
          !q ||
          r.doctorName.toLowerCase().includes(q) ||
          r.patientName.toLowerCase().includes(q) ||
          (r.comment?.toLowerCase().includes(q) ?? false) ||
          r.id.toLowerCase().includes(q);

        const matchDoctor = doctorFilter === "all" || r.doctorName === doctorFilter;
        const matchRating = ratingFilter === "all" || r.rating === Number(ratingFilter);

        const revDate = new Date(r.createdAt);
        const matchDate =
          dateFilter === "all" ||
          (dateFilter === "today" && r.createdAt.slice(0, 10) === todayStr) ||
          (dateFilter === "this_week" && revDate >= weekAgo) ||
          (dateFilter === "this_month" && revDate >= monthAgo) ||
          (dateFilter === "past" && revDate < now);

        return matchTab && matchSearch && matchDoctor && matchRating && matchDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allReviews, activeTab, search, doctorFilter, ratingFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters =
    search || doctorFilter !== "all" || ratingFilter !== "all" || dateFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setDoctorFilter("all");
    setRatingFilter("all");
    setDateFilter("all");
  };

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    handlePageChange(1);
  }, [search, activeTab, doctorFilter, ratingFilter, dateFilter, handlePageChange]);

  useEffect(() => {
    if (!loading && filtered.length > 0 && page > totalPages) {
      handlePageChange(totalPages);
    }
  }, [loading, filtered.length, page, totalPages, handlePageChange]);

  const openModal = (review: Review) => {
    setSelectedReview(review);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedReview(null), 200);
  };

  const handleQuickToggle = async (review: Review, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickActionLoading(review.id);
    await new Promise((r) => setTimeout(r, 400));
    const willBeHidden = !review.isHidden;
    dispatch(toggleHideReview({ reviewId: review.id }));
    dispatch(logAdminAction({
      actor: getAuditActor(currentAdmin),
      action: willBeHidden ? "REVIEW_HIDDEN" : "REVIEW_RESTORED",
      entityType: "review",
      entityId: review.id,
      entityName: `Review by ${review.patientName} on ${review.doctorName ?? "Doctor"}`,
      details: willBeHidden
        ? `Review by ${review.patientName} hidden by admin after moderation.`
        : `Hidden review by ${review.patientName} restored by admin.`,
      metadata: { reviewRating: review.rating, isReported: review.isReported ?? false },
      ipAddress: "127.0.0.1",
      severity: willBeHidden ? "warning" : "info",
    }));
    setQuickActionLoading(null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-7xl mx-auto">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--ink)]">Reviews & Moderation</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Monitor patient reviews, manage reported content, and moderate public visibility.
        </p>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Avg. Platform Rating"
          value={metrics.avg > 0 ? `${metrics.avg} / 5` : "—"}
          icon={Star}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
        />
        <MetricCard
          label="Total Reviews"
          value={metrics.total}
          icon={MessageSquare}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <MetricCard
          label="Reported Reviews"
          value={metrics.reported}
          icon={Flag}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
        <MetricCard
          label="Hidden Reviews"
          value={metrics.hidden}
          icon={EyeOff}
          iconBg="bg-slate-100"
          iconColor="text-slate-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-[var(--line)] bg-white p-1 w-fit">
        {(
          [
            { key: "all", label: "All Reviews", count: allReviews.length },
            { key: "reported", label: "Reported", count: metrics.reported },
            { key: "hidden", label: "Hidden", count: metrics.hidden },
          ] as { key: TabType; label: string; count: number }[]
        ).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {label}
            {count > 0 && (
              <span
                className={`min-w-[18px] rounded-full px-1 py-0.5 text-[10px] font-bold leading-none text-center ${
                  activeTab === key
                    ? "bg-white/20 text-white"
                    : key === "reported"
                    ? "bg-red-100 text-red-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
            <input
              id="reviews-search"
              type="text"
              placeholder="Search doctor, patient, or review text…"
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
            <Filter size={12} /> Filters:
          </span>
          <FilterSelect id="doctor-filter" value={doctorFilter} onChange={setDoctorFilter}>
            <option value="all">All Doctors</option>
            {doctorNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </FilterSelect>
          <FilterSelect id="rating-filter" value={ratingFilter} onChange={(v) => setRatingFilter(v as RatingFilter)}>
            <option value="all">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={String(r)}>{r} Star{r !== 1 ? "s" : ""}</option>
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
          Showing <span className="font-semibold text-[var(--ink)]">{filtered.length}</span> review{filtered.length !== 1 ? "s" : ""}
          {hasActiveFilters && (
            <span> · <button onClick={clearFilters} className="text-[var(--brand)] hover:underline">clear filters</button></span>
          )}
        </p>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Loading reviews…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={26} />}
            title={
              activeTab === "reported"
                ? "No reported reviews"
                : activeTab === "hidden"
                ? "No hidden reviews"
                : "No reviews found"
            }
            message={
              hasActiveFilters
                ? "Try adjusting your search or filters."
                : activeTab === "reported"
                ? "No reviews have been flagged for moderation."
                : activeTab === "hidden"
                ? "No reviews are currently hidden."
                : "No patient reviews have been submitted yet."
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
                    {["Review", "Patient", "Doctor", "Rating", "Date", "Status", "Actions"].map((h) => (
                      <th
                        key={h}
                        className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)] ${
                          h === "Patient" || h === "Doctor" ? "hidden sm:table-cell" : ""
                        } ${h === "Date" ? "hidden md:table-cell" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {paginated.map((review) => {
                    const isLoading = quickActionLoading === review.id;
                    return (
                      <tr
                        key={review.id}
                        className={`hover:bg-[var(--canvas)] transition-colors cursor-pointer ${
                          review.isHidden ? "opacity-60" : ""
                        }`}
                        onClick={() => openModal(review)}
                      >
                        {/* Review snippet */}
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <p className="text-sm text-[var(--ink)] line-clamp-2 leading-snug">
                            {review.comment || (
                              <span className="italic text-[var(--muted)]">No comment</span>
                            )}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-[var(--muted)]">{review.id}</p>
                        </td>

                        {/* Patient */}
                        <td className="hidden px-4 py-3.5 sm:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-[10px] font-bold text-violet-700">
                              {review.patientName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <p className="font-medium text-[var(--ink)] truncate max-w-[100px]">{review.patientName}</p>
                          </div>
                        </td>

                        {/* Doctor */}
                        <td className="hidden px-4 py-3.5 sm:table-cell">
                          <p className="font-medium text-[var(--ink)] truncate max-w-[130px]">{review.doctorName}</p>
                        </td>

                        {/* Rating */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[var(--ink)]">{review.rating}</span>
                            <StarDisplay rating={review.rating} />
                          </div>
                        </td>

                        {/* Date */}
                        <td className="hidden px-4 py-3.5 md:table-cell">
                          <p className="font-medium text-[var(--ink)]">{fmtDate(review.createdAt)}</p>
                          <p className="text-xs text-[var(--muted)]">{relativeTime(review.createdAt)}</p>
                        </td>

                        {/* Status badges */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {review.isHidden && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                <EyeOff size={9} /> Hidden
                              </span>
                            )}
                            {review.isReported && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                                <Flag size={9} /> Reported
                              </span>
                            )}
                            {!review.isHidden && !review.isReported && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                                <Eye size={9} /> Visible
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button
                              id={`review-view-${review.id}`}
                              onClick={() => openModal(review)}
                              className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                            >
                              View
                            </button>
                            {canEditReviews && (
                              <button
                                id={`review-toggle-${review.id}`}
                                onClick={(e) => handleQuickToggle(review, e)}
                                disabled={isLoading}
                                title={review.isHidden ? "Unhide review" : "Hide from public"}
                                className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors disabled:opacity-50 ${
                                  review.isHidden
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                    : "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                                }`}
                              >
                                {isLoading ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : review.isHidden ? (
                                  <Eye size={12} />
                                ) : (
                                  <EyeOff size={12} />
                                )}
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--line)] px-4 py-3">
                <p className="text-xs text-[var(--muted)]">
                  Showing{" "}
                  <strong className="text-[var(--ink)]">{(page - 1) * PAGE_SIZE + 1}</strong>–
                  <strong className="text-[var(--ink)]">{Math.min(page * PAGE_SIZE, filtered.length)}</strong>{" "}
                  of <strong className="text-[var(--ink)]">{filtered.length}</strong> reviews
                </p>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Detail Modal */}
      <ReviewDetailModal
        review={selectedReview}
        open={modalOpen}
        onClose={closeModal}
      />
    </div>
  );
}
