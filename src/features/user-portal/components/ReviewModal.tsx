"use client";

import { useState } from "react";
import { X, Star, CheckCircle } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { Review } from "@/types/review";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { addReview } from "@/store/slices/reviewsSlice";
import { selectHasReviewedAppointment } from "@/store/slices/reviewsSlice";
import { addDoctorNotification } from "@/store/slices/appointmentsSlice";
import { getAllDoctors } from "@/lib/mock-data/doctors";

type Props = {
  appointment: Appointment;
  onClose: () => void;
};

export default function ReviewModal({ appointment, onClose }: Props) {
  const dispatch = useAppDispatch();

  const alreadyReviewed = useAppSelector((state) =>
    selectHasReviewedAppointment(state, appointment.id)
  );
  const patientName = useAppSelector(
    (state) => state.auth.user?.name ?? appointment.patient.name
  );

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || alreadyReviewed) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));

    // Resolve doctorId from catalog (name is the fallback only)
    const doctorEntry = getAllDoctors().find(
      (d) => d.name === appointment.clinician
    );

    const review: Review = {
      id: `review-${appointment.id}-${Date.now()}`,
      doctorId: doctorEntry?.id,
      doctorName: appointment.clinician,
      patientName,
      appointmentId: appointment.id,
      rating: rating as Review["rating"],
      comment: comment.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    // Single dispatch — Redux updates state and persists to localStorage
    dispatch(addReview(review));

    // Notify doctor
    dispatch(
      addDoctorNotification({
        appointmentId: appointment.id,
        patientName,
        message: `New ${rating}-star review: "${comment.trim() || "No written feedback"}"`,
      })
    );

    setIsSubmitting(false);
    setSubmitted(true);

    // Auto-close after 1.5 s so the user sees the success state
    setTimeout(onClose, 1500);
  };

  const displayName = appointment.clinician;
  const initials = displayName
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[70] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--canvas)] px-5 py-4">
          <h3 className="text-lg font-semibold text-[var(--ink)]">Review Doctor</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--muted)] hover:bg-stone-200 hover:text-[var(--ink)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Doctor avatar */}
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-xl font-bold text-[var(--brand)]">
              {initials}
            </div>
            <h4 className="mt-3 text-lg font-bold text-[var(--ink)]">{displayName}</h4>
            <p className="text-sm text-[var(--muted)]">{appointment.specialty}</p>
          </div>

          {/* ── Already reviewed ── */}
          {alreadyReviewed && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle size={40} className="text-emerald-500" />
              <p className="text-center font-semibold text-[var(--ink)]">
                You have already reviewed this appointment.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 rounded-xl border border-[var(--line)] px-6 py-2 text-sm font-medium text-[var(--ink)] hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          )}

          {/* ── Success state ── */}
          {!alreadyReviewed && submitted && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle size={40} className="text-emerald-500" />
              <p className="text-center font-semibold text-[var(--ink)]">
                Thank you for your review!
              </p>
              <p className="text-sm text-[var(--muted)]">Closing…</p>
            </div>
          )}

          {/* ── Review form ── */}
          {!alreadyReviewed && !submitted && (
            <form onSubmit={handleSubmit}>
              {/* Star picker — rating is required */}
              <div className="mb-1 flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Star
                      size={32}
                      className={`${
                        (hoverRating || rating) >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-stone-300"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              {rating === 0 && (
                <p className="mb-4 text-center text-xs text-[var(--muted)]">
                  Select a rating to continue
                </p>
              )}
              {rating > 0 && <div className="mb-4" />}

              {/* Comment — optional */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
                  Write a review{" "}
                  <span className="text-[var(--muted)] font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="How was your experience?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                />
              </div>

              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="w-full rounded-xl bg-[var(--brand)] py-3 font-semibold text-white transition hover:bg-[var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Submitting…" : "Submit Review"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
