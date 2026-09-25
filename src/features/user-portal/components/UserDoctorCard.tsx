"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserCircle2, ShieldCheck, ChevronRight, MapPin } from "lucide-react";
import type { Doctor } from "@/types/doctor";
import { useAppSelector } from "@/store/hooks";
import { selectAverageRating, selectDoctorReviews } from "@/store/slices/reviewsSlice";
import { formatDoctorLocation } from "@/lib/mock-data/doctors";
import ReviewsDrawer from "@/features/doctors/components/ReviewsDrawer";

type Props = {
  doctor: Doctor;
  priority?: boolean;
};

/** Inline star bar — rendered inside the card. */
function StarRating({
  rating,
  count,
  onViewReviews,
}: {
  rating: number;
  count: number;
  onViewReviews: (e: React.MouseEvent) => void;
}) {
  if (count === 0) {
    return (
      <button
        type="button"
        onClick={onViewReviews}
        title="View reviews (no reviews yet)"
        className="
          mt-1.5 flex self-start items-center gap-1.5 rounded-md px-1 -ml-1
          transition-colors hover:bg-gray-50 group
        "
      >
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className="text-[11px] text-gray-200">
              ★
            </span>
          ))}
        </div>
        <span className="text-[10px] text-[var(--muted)]">No reviews yet</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onViewReviews}
      title="View patient reviews"
      className="
        mt-1.5 flex self-start items-center gap-1.5 rounded-md px-1 -ml-1
        transition-colors hover:bg-amber-50 group
      "
    >
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rating >= star;
          const half = !filled && rating >= star - 0.5;
          return (
            <span
              key={star}
              className={`text-[11px] ${
                filled ? "text-amber-400" : half ? "text-amber-300" : "text-gray-200"
              }`}
            >
              ★
            </span>
          );
        })}
      </div>
      {/* Score */}
      <span className="text-[10px] font-semibold text-[#4B5563]">
        {rating.toFixed(1)}
      </span>
      {/* Count */}
      <span className="text-[10px] text-[var(--muted)]">
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
      {/* Hint arrow */}
      <ChevronRight
        size={10}
        className="text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </button>
  );
}

export default function UserDoctorCard({ doctor, priority = false }: Props) {
  const hasImage = !!doctor.image;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const avgRating = useAppSelector((state) =>
    selectAverageRating(state, doctor.id || doctor.name)
  );
  const reviews = useAppSelector((state) =>
    selectDoctorReviews(state, doctor.id || doctor.name)
  );
  const reviewCount = reviews.length;

  const openDrawer = (e: React.MouseEvent) => {
    e.preventDefault();   // prevent Link navigation
    e.stopPropagation();
    setDrawerOpen(true);
  };

  return (
    <>
      <Link href={`/user/doctors/${doctor.id}`} className="block h-full">
        <article className="flex h-full min-h-[190px] w-full cursor-pointer gap-4 rounded-[18px] border border-[var(--line)] bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-md">
          {/* Doctor Image / Avatar */}
          <div className="relative h-[120px] w-[105px] shrink-0 overflow-hidden rounded-[12px] sm:h-[130px] sm:w-[115px] lg:h-[140px] lg:w-[125px]">
            {hasImage ? (
              <Image
                src={doctor.image}
                alt={doctor.name}
                fill
                sizes="(max-width: 640px) 105px, (max-width: 1024px) 115px, 125px"
                className="object-cover"
                priority={priority}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-teal-50">
                <UserCircle2 size={60} className="text-[var(--brand)] opacity-60" />
              </div>
            )}
          </div>

          {/* Doctor Information */}
          <div className="min-w-0 flex-1 flex flex-col py-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="truncate text-[16px] font-semibold text-[var(--ink)] sm:text-[17px]">
                {doctor.name}
              </h2>
              {(doctor.verificationStatus === "approved" || doctor.verificationStatus === "verified") && (
                <div title="Verified Doctor" className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5">
                  <ShieldCheck size={11} className="text-emerald-600" />
                  <span className="text-[9px] font-bold text-emerald-700">Verified</span>
                </div>
              )}
            </div>

            <p className="mt-1 text-[12px] text-[var(--brand)]">{doctor.specialization}</p>

            {/* Star rating — clickable to open reviews drawer */}
            <StarRating rating={avgRating} count={reviewCount} onViewReviews={openDrawer} />

            {/* Clinic / Hospital Location */}
            <div className="mt-1 flex items-center gap-1 text-[11px] text-[var(--muted)]">
              <MapPin size={11} className="shrink-0 text-[var(--brand)]" />
              <span className="truncate">{formatDoctorLocation(doctor)}</span>
            </div>

            {/* Consultation & Check-up Fees */}
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] flex-wrap">
              <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 font-medium text-[var(--ink)]">
                Consult: <strong className="text-[var(--brand)]">₹{doctor.consultationFee ?? 500}</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 font-medium text-[var(--ink)]">
                Check-up: <strong className="text-teal-700">₹{doctor.checkupFee ?? 800}</strong>
              </span>
            </div>

            <div className="mt-1.5">
              <span className="inline-block rounded bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                {doctor.availability}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 min-h-[32px] text-[11px] leading-relaxed text-[var(--muted)]">
              {doctor.description}
            </p>
            <p className="mt-auto pt-2 text-[11px] font-medium text-[var(--muted)]">
              {doctor.availableTime}
            </p>
          </div>
        </article>
      </Link>

      {/* Reviews slide-in drawer */}
      <ReviewsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        doctorName={doctor.name}
        avgRating={avgRating}
        reviews={reviews}
      />
    </>
  );
}
