"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare, TrendingUp, BarChart2 } from "lucide-react";
import DoctorPortalHeader from "@/features/doctor-portal/components/DoctorPortalHeader";
import RatingDistributionBar from "@/features/doctor-portal/components/RatingDistributionBar";
import RatingTrendChart from "@/features/doctor-portal/components/RatingTrendChart";
import { useAppSelector } from "@/store/hooks";
import {
  selectAverageRating,
  selectRatingDistribution,
  selectRatingTrend,
  selectRecentReviews,
  selectDoctorReviews,
} from "@/store/slices/reviewsSlice";

type StoredUser = { id: string; name: string; role: string };

function StarDisplay({ rating, size = 20 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={
            s <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-stone-200"
          }
        />
      ))}
    </span>
  );
}

function RelativeTime({ iso }: { iso: string }) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days >= 30) return <>{Math.floor(days / 30)} mo ago</>;
  if (days >= 1) return <>{days} day{days > 1 ? "s" : ""} ago</>;
  if (hours >= 1) return <>{hours} hr{hours > 1 ? "s" : ""} ago</>;
  return <>Just now</>;
}

export default function DoctorRatingsPage() {
  const [doctorKey, setDoctorKey] = useState<string>("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loggedInUser");
      if (stored) {
        const user: StoredUser = JSON.parse(stored);
        // Use doctorId if available, otherwise fall back to name for mock compatibility
        setDoctorKey(user.id || user.name);
      }
    } catch {
      // ignore
    }
  }, []);

  const avg = useAppSelector((state) => selectAverageRating(state, doctorKey));
  const distribution = useAppSelector((state) => selectRatingDistribution(state, doctorKey));
  const trend = useAppSelector((state) => selectRatingTrend(state, doctorKey));
  const recent = useAppSelector((state) => selectRecentReviews(state, doctorKey, 10));
  const allReviews = useAppSelector((state) => selectDoctorReviews(state, doctorKey));
  const total = allReviews.length;
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  const hasData = total > 0;

  return (
    <>
      <DoctorPortalHeader title="Rating Analyzer" />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">Rating Analyzer</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Real-time insights from patient reviews for your practice.
          </p>
        </div>

        {/* ── Top metric cards ── */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Average Rating */}
          <div className="col-span-1 flex flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-white px-6 py-8 shadow-sm sm:col-span-1">
            {hasData ? (
              <>
                <p className="text-6xl font-extrabold tracking-tight text-[var(--brand)]">
                  {avg.toFixed(1)}
                </p>
                <StarDisplay rating={avg} size={22} />
                <p className="mt-2 text-sm text-[var(--muted)]">Average Rating</p>
              </>
            ) : (
              <>
                <Star size={40} className="mb-2 text-stone-200" strokeWidth={1.5} />
                <p className="text-lg font-semibold text-[var(--muted)]">No ratings yet</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Completed patients can leave a review
                </p>
              </>
            )}
          </div>

          {/* Total Reviews */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-white px-6 py-8 shadow-sm">
            <p className="text-6xl font-extrabold tracking-tight text-[var(--brand)]">
              {total}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">Total Reviews</p>
          </div>

          {/* 5-star count */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-white px-6 py-8 shadow-sm">
            <p className="text-6xl font-extrabold tracking-tight text-amber-500">
              {distribution.find((d) => d.star === 5)?.count ?? 0}
            </p>
            <div className="mt-1 flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={16} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">5-Star Reviews</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── Rating Distribution ── */}
          <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <BarChart2 size={18} className="text-[var(--brand)]" strokeWidth={1.8} />
              <h3 className="font-semibold text-[var(--ink)]">Rating Distribution</h3>
            </div>

            {hasData ? (
              <div className="space-y-3">
                {distribution.map((d) => (
                  <RatingDistributionBar
                    key={d.star}
                    star={d.star as 1 | 2 | 3 | 4 | 5}
                    count={d.count}
                    percentage={d.percentage}
                    maxCount={maxCount}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BarChart2 size={36} className="mb-3 text-stone-200" strokeWidth={1.4} />
                <p className="text-sm text-[var(--muted)]">No distribution data yet</p>
              </div>
            )}
          </div>

          {/* ── Monthly Rating Trend ── */}
          <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <TrendingUp size={18} className="text-[var(--brand)]" strokeWidth={1.8} />
              <h3 className="font-semibold text-[var(--ink)]">Rating Trend</h3>
            </div>
            <RatingTrendChart data={trend} />
          </div>
        </div>

        {/* ── Recent Patient Reviews ── */}
        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[var(--line)] px-6 py-4">
            <MessageSquare size={18} className="text-[var(--brand)]" strokeWidth={1.8} />
            <h3 className="font-semibold text-[var(--ink)]">Recent Patient Reviews</h3>
            {total > 0 && (
              <span className="ml-auto text-xs text-[var(--muted)]">
                Showing {Math.min(recent.length, 10)} of {total}
              </span>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare size={36} className="mb-3 text-stone-200" strokeWidth={1.4} />
              <p className="font-medium text-[var(--muted)]">No patient reviews yet</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Reviews appear here after patients complete their appointments.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {recent.map((review) => (
                <li key={review.id} className="flex flex-col gap-2 px-6 py-4 transition hover:bg-[var(--canvas)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Patient avatar */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-[var(--brand)]">
                        {review.patientName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">
                          {review.patientName}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          <RelativeTime iso={review.createdAt} />
                        </p>
                      </div>
                    </div>
                    {/* Star badge */}
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 ring-1 ring-inset ring-amber-200">
                      <Star size={11} className="fill-amber-500 text-amber-500" />
                      {review.rating}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="ml-12 text-sm text-[var(--muted)] leading-relaxed">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
