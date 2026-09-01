"use client";

import { useState } from "react";
import { X, Star } from "lucide-react";
import type { Appointment } from "@/types/appointment";

type Props = {
  appointment: Appointment;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
};

export default function ReviewModal({ appointment, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 600));
    onSubmit(rating, review);
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[70] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--canvas)] px-5 py-4">
          <h3 className="text-lg font-semibold text-[var(--ink)]">Review Doctor</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-[var(--muted)] hover:bg-stone-200 hover:text-[var(--ink)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-2xl font-bold text-[var(--brand)]">
              {appointment.clinician.split(" ").map(n => n[0]).join("").replace("D.", "")}
            </div>
            <h4 className="mt-3 text-lg font-bold text-[var(--ink)]">{appointment.clinician}</h4>
            <p className="text-sm text-[var(--muted)]">{appointment.specialty}</p>
          </div>

          {/* Star Rating */}
          <div className="mb-6 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
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

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
              Write a review (optional)
            </label>
            <textarea
              rows={3}
              placeholder="How was your experience?"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
            />
          </div>

          <button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="w-full rounded-xl bg-[var(--brand)] py-3 font-semibold text-white transition hover:bg-[var(--brand-deep)] disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </>
  );
}
