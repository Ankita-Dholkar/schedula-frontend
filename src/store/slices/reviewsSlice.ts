import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import type { Review } from "@/types/review";
import { getAllReviews, persistReviews } from "@/lib/mock-data/reviews";
import type { RootState } from "@/store/store";

// State 

export interface ReviewsState {
  reviews: Review[];
}

function getInitialReviews(): Review[] {
  if (typeof window === "undefined") return [];
  try {
    return getAllReviews();
  } catch {
    return [];
  }
}

const initialState: ReviewsState = {
  reviews: getInitialReviews(),
};

// Slice 

export const reviewsSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {
    /**
     * Hydrates the reviews slice from localStorage (called by StoreProvider on mount).
     */
    hydrateReviews: (state) => {
      state.reviews = getAllReviews();
    },

    /**
     * Appends a new review to Redux state.
     * The existing Redux persistence mechanism synchronizes doctorReviews to localStorage.
     */
    addReview: (state, action: PayloadAction<Review>) => {
      state.reviews.push(action.payload);
      persistReviews(state.reviews);
    },
  },
});

export const { hydrateReviews, addReview } = reviewsSlice.actions;
export default reviewsSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────

const selectAllReviews = (state: RootState) => state.reviews.reviews;

/**
 * Returns all reviews for a doctor.
 * Matches by doctorId when available; falls back to doctorName for mock data compatibility.
 * (doctorName is a fallback identifier only, not a permanent unique identity.)
 */
export const selectDoctorReviews = createSelector(
  [selectAllReviews, (_: RootState, doctorIdOrName: string) => doctorIdOrName],
  (reviews, doctorIdOrName) =>
    reviews.filter(
      (r) => r.doctorId === doctorIdOrName || r.doctorName === doctorIdOrName
    )
);

/**
 * Returns true if a review already exists for the given appointmentId.
 * Used to prevent duplicate review submissions.
 */
export const selectHasReviewedAppointment = createSelector(
  [selectAllReviews, (_: RootState, appointmentId: string) => appointmentId],
  (reviews, appointmentId) => reviews.some((r) => r.appointmentId === appointmentId)
);

/**
 * Computes average rating for a doctor.
 * Returns 0 when the doctor has no reviews.
 */
export const selectAverageRating = createSelector(
  [selectAllReviews, (_: RootState, doctorIdOrName: string) => doctorIdOrName],
  (reviews, doctorIdOrName) => {
    const doctorReviews = reviews.filter(
      (r) => r.doctorId === doctorIdOrName || r.doctorName === doctorIdOrName
    );
    if (doctorReviews.length === 0) return 0;
    const sum = doctorReviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / doctorReviews.length) * 10) / 10;
  }
);

/**
 * Returns count and percentage for each star level (5 down to 1).
 */
export const selectRatingDistribution = createSelector(
  [selectAllReviews, (_: RootState, doctorIdOrName: string) => doctorIdOrName],
  (reviews, doctorIdOrName) => {
    const doctorReviews = reviews.filter(
      (r) => r.doctorId === doctorIdOrName || r.doctorName === doctorIdOrName
    );
    const total = doctorReviews.length;
    return ([5, 4, 3, 2, 1] as const).map((star) => {
      const count = doctorReviews.filter((r) => r.rating === star).length;
      return {
        star,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  }
);

/**
 * Groups reviews by YYYY-MM and computes the monthly average rating.
 * Only months containing reviews are returned (no synthetic zero dips).
 */
export const selectRatingTrend = createSelector(
  [selectAllReviews, (_: RootState, doctorIdOrName: string) => doctorIdOrName],
  (reviews, doctorIdOrName) => {
    const doctorReviews = reviews.filter(
      (r) => r.doctorId === doctorIdOrName || r.doctorName === doctorIdOrName
    );

    const byMonth: Record<string, number[]> = {};
    for (const review of doctorReviews) {
      const month = review.createdAt.slice(0, 7); // "YYYY-MM"
      if (!byMonth[month]) byMonth[month] = [];
      byMonth[month].push(review.rating);
    }

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b)) // chronological order
      .map(([month, ratings]) => ({
        month,
        avg: Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10,
      }));
  }
);

/**
 * Returns the most recent N reviews for a doctor, sorted by createdAt descending.
 */
export const selectRecentReviews = createSelector(
  [
    selectAllReviews,
    (_: RootState, doctorIdOrName: string) => doctorIdOrName,
    (_: RootState, __: string, limit = 10) => limit,
  ],
  (reviews, doctorIdOrName, limit) =>
    reviews
      .filter(
        (r) => r.doctorId === doctorIdOrName || r.doctorName === doctorIdOrName
      )
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
);
