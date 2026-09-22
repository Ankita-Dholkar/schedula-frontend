"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Star,
  AlertTriangle,
  EyeOff,
  Eye,
  Flag,
  User,
  Stethoscope,
  Calendar,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { Review } from "@/types/review";
import { useAppDispatch } from "@/store/hooks";
import { toggleHideReview } from "@/store/slices/reviewsSlice";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  if (days >= 30) return `${Math.floor(days / 30)} mo ago`;
  if (days >= 1) return `${days}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  return "Just now";
};

// ─── Star display ─────────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={16}
          className={
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-stone-200"
          }
        />
      ))}
    </span>
  );
}

// ─── Confirmation overlay ─────────────────────────────────────────────────────

function ConfirmOverlay({
  isHidden,
  onConfirm,
  onCancel,
  loading,
}: {
  isHidden: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm">
      <div className="mx-6 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xl text-center max-w-xs w-full">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            isHidden ? "bg-emerald-50" : "bg-amber-50"
          }`}
        >
          {isHidden ? (
            <Eye size={26} className="text-emerald-600" />
          ) : (
            <EyeOff size={26} className="text-amber-600" />
          )}
        </div>
        <h4 className="text-base font-bold text-[var(--ink)]">
          {isHidden ? "Unhide Review?" : "Hide from Public?"}
        </h4>
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          {isHidden
            ? "This review will become visible again to patients and doctors."
            : "This review will be hidden from all public-facing views. You can restore it any time."}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[var(--line)] py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-stone-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-60 ${
              isHidden
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isHidden ? (
              "Unhide"
            ) : (
              "Hide Review"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  review: Review | null;
  open: boolean;
  onClose: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReviewDetailModal({ review, open, onClose }: Props) {
  const dispatch = useAppDispatch();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [justActioned, setJustActioned] = useState(false);

  // Reset confirmation state when modal closes
  useEffect(() => {
    if (!open) {
      setShowConfirm(false);
      setJustActioned(false);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showConfirm) setShowConfirm(false);
        else onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, showConfirm]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!review) return null;

  const handleConfirmToggle = async () => {
    setConfirmLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    dispatch(toggleHideReview({ reviewId: review.id }));
    setConfirmLoading(false);
    setShowConfirm(false);
    setJustActioned(true);
    setTimeout(() => setJustActioned(false), 2000);
  };

  const isNowHidden = justActioned ? !review.isHidden : review.isHidden;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => {
          if (e.target === overlayRef.current && !showConfirm) onClose();
        }}
        aria-modal="true"
        role="dialog"
        aria-label="Review Details"
      >
        {/* Modal card */}
        <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

          {/* Confirmation overlay */}
          {showConfirm && (
            <ConfirmOverlay
              isHidden={review.isHidden ?? false}
              onConfirm={handleConfirmToggle}
              onCancel={() => setShowConfirm(false)}
              loading={confirmLoading}
            />
          )}

          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--canvas)] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                <Star size={16} className="fill-amber-400 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--ink)]">Review Details</p>
                <p className="font-mono text-xs text-[var(--muted)]">{review.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-stone-100 hover:text-[var(--ink)]"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-5 space-y-4">

            {/* ── Reported alert ── */}
            {review.isReported && !review.isHidden && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-700">This review has been reported</p>
                  {review.reportReason && (
                    <p className="mt-0.5 text-xs text-red-600">
                      <span className="font-medium">Reason:</span> {review.reportReason}
                    </p>
                  )}
                  {review.reportedBy && (
                    <p className="mt-0.5 text-xs text-red-500">
                      Reported by{" "}
                      <span className="font-medium">{review.reportedBy}</span>
                      {review.reportedAt && ` · ${relativeTime(review.reportedAt)}`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Hidden alert ── */}
            {(review.isHidden || (justActioned && !review.isHidden)) && (
              <div
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                  isNowHidden
                    ? "border-slate-200 bg-slate-50"
                    : "border-emerald-200 bg-emerald-50"
                }`}
              >
                {isNowHidden ? (
                  <EyeOff size={16} className="mt-0.5 shrink-0 text-slate-500" />
                ) : (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                )}
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      isNowHidden ? "text-slate-600" : "text-emerald-700"
                    }`}
                  >
                    {isNowHidden
                      ? "This review is hidden from the public"
                      : "Review is now visible to the public"}
                  </p>
                  {review.moderatedAt && isNowHidden && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      Moderated {relativeTime(review.moderatedAt)}
                      {review.moderatedBy && ` by ${review.moderatedBy}`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Review card ── */}
            <div className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                    {review.patientName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{review.patientName}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {relativeTime(review.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 ring-1 ring-inset ring-amber-200">
                  <Star size={10} className="fill-amber-500" />
                  {review.rating}
                </span>
              </div>
              <StarRow rating={review.rating} />
              {review.comment ? (
                <p className="mt-3 text-sm text-[var(--ink)] leading-relaxed">
                  &ldquo;{review.comment}&rdquo;
                </p>
              ) : (
                <p className="mt-3 text-sm italic text-[var(--muted)]">No written feedback provided.</p>
              )}
              <p className="mt-3 text-xs text-[var(--muted)]">
                {fmtDateTime(review.createdAt)}
              </p>
            </div>

            {/* ── Metadata ── */}
            <div className="rounded-xl border border-[var(--line)] bg-white divide-y divide-[var(--line)]">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <User size={13} /> Patient
                </span>
                <span className="text-sm font-medium text-[var(--ink)]">{review.patientName}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <Stethoscope size={13} /> Doctor
                </span>
                <span className="text-sm font-medium text-[var(--ink)]">{review.doctorName}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <Calendar size={13} /> Appointment ID
                </span>
                <span className="font-mono text-xs font-medium text-[var(--ink)]">
                  {review.appointmentId}
                </span>
              </div>
              {review.isReported && review.reportReason && (
                <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <span className="flex items-center gap-2 text-xs text-[var(--muted)] shrink-0">
                    <Flag size={13} /> Report Reason
                  </span>
                  <span className="text-right text-sm text-red-600">{review.reportReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--line)] bg-[var(--canvas)] px-5 py-4">
            <button
              onClick={onClose}
              className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-stone-100 transition"
            >
              Close
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
                review.isHidden
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-amber-500 hover:bg-amber-600"
              }`}
            >
              {review.isHidden ? (
                <>
                  <Eye size={14} /> Unhide Review
                </>
              ) : (
                <>
                  <EyeOff size={14} /> Hide from Public
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
