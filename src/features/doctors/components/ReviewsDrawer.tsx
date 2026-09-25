"use client";

import { useEffect, useRef } from "react";
import { X, Star, MessageSquare, UserCircle2 } from "lucide-react";
import type { Review } from "@/types/review";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-[13px] ${
            rating >= star ? "text-amber-400" : "text-gray-200"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

type ReviewsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  doctorName: string;
  avgRating: number;
  reviews: Review[];
};

// ── Component ──────────────────────────────────────────────────────────────

export default function ReviewsDrawer({
  isOpen,
  onClose,
  doctorName,
  avgRating,
  reviews,
}: ReviewsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const sortedReviews = [...reviews].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <>
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        aria-label="Close reviews panel"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Enter" && onClose()}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Reviews for ${doctorName}`}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-[var(--ink)]">
              Patient Reviews
            </h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">{doctorName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-gray-100 hover:text-[var(--ink)]"
          >
            <X size={17} />
          </button>
        </div>

        {/* Summary Banner */}
        {reviews.length > 0 && (
          <div className="flex items-center gap-4 border-b border-[var(--line)] bg-[var(--canvas)] px-5 py-3">
            {/* Big score */}
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-[var(--ink)]">
                {avgRating.toFixed(1)}
              </span>
              <StarRow rating={Math.round(avgRating)} />
            </div>
            <div className="h-10 w-px bg-[var(--line)]" />
            <div className="text-xs text-[var(--muted)]">
              <span className="block text-sm font-semibold text-[var(--ink)]">
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </span>
              Based on verified patient experiences
            </div>
          </div>
        )}

        {/* Review List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {sortedReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--canvas)] text-[var(--muted)]">
                <MessageSquare size={24} />
              </div>
              <p className="text-sm font-semibold text-[var(--ink)]">No reviews yet</p>
              <p className="text-xs text-[var(--muted)]">
                Be the first to share your experience with {doctorName}.
              </p>
            </div>
          ) : (
            sortedReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm"
              >
                {/* Reviewer header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-[var(--brand)]">
                      {review.patientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-[var(--ink)]">
                        {review.patientName}
                      </p>
                      <p className="text-[10px] text-[var(--muted)]">
                        {fmtDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StarRow rating={review.rating} />
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--muted)]">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
