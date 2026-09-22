import type { Review } from "@/types/review";

const STORAGE_KEY = "doctorReviews";

// Seed data 
// Used ONLY when no persisted doctorReviews data exists in localStorage.
// Spread across past months so the Rating Analyzer has meaningful initial data.

const SEED_REVIEWS: Review[] = [
  // Dr. Prakash Das (doc-1)
  {
    id: "seed-r1",
    doctorId: "doc-1",
    doctorName: "Dr. Prakash Das",
    patientName: "Alice Johnson",
    appointmentId: "seed-apt-1",
    rating: 5,
    comment: "Incredibly empathetic and thorough. Highly recommend.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-r2",
    doctorId: "doc-1",
    doctorName: "Dr. Prakash Das",
    patientName: "Mark Evans",
    appointmentId: "seed-apt-2",
    rating: 4,
    comment: "Very helpful session. Explained things clearly.",
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-r3",
    doctorId: "doc-1",
    doctorName: "Dr. Prakash Das",
    patientName: "Priya Sharma",
    appointmentId: "seed-apt-3",
    rating: 5,
    comment: "Best consultation I've had. Felt genuinely heard.",
    createdAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-r4",
    doctorId: "doc-1",
    doctorName: "Dr. Prakash Das",
    patientName: "Sam Wilson",
    appointmentId: "seed-apt-4",
    rating: 3,
    comment: "Good doctor but the session felt rushed.",
    createdAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-r5",
    doctorId: "doc-1",
    doctorName: "Dr. Prakash Das",
    patientName: "Neha Patel",
    appointmentId: "seed-apt-5",
    rating: 5,
    comment: "Outstanding care. Very professional.",
    createdAt: new Date(Date.now() - 125 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Dr. Anika Rao (doc-2)
  {
    id: "seed-r6",
    doctorId: "doc-2",
    doctorName: "Dr. Anika Rao",
    patientName: "Robert Chen",
    appointmentId: "seed-apt-6",
    rating: 5,
    comment: "Very thorough and professional.",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-r7",
    doctorId: "doc-2",
    doctorName: "Dr. Anika Rao",
    patientName: "Fatima Al-Hassan",
    appointmentId: "seed-apt-7",
    rating: 4,
    comment: "Great experience overall.",
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-r8",
    doctorId: "doc-2",
    doctorName: "Dr. Anika Rao",
    patientName: "James Mitchell",
    appointmentId: "seed-apt-8",
    rating: 4,
    comment: "Knowledgeable and caring.",
    createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Dr. Martin Cole (doc-3)
  {
    id: "seed-r9",
    doctorId: "doc-3",
    doctorName: "Dr. Martin Cole",
    patientName: "Sophie Turner",
    appointmentId: "seed-apt-9",
    rating: 5,
    comment: "Skin issues resolved quickly. Excellent work.",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-r10",
    doctorId: "doc-3",
    doctorName: "Dr. Martin Cole",
    patientName: "David Kim",
    appointmentId: "seed-apt-10",
    rating: 3,
    comment: "Treatment worked but the wait time was long.",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // ── Reported reviews (Admin moderation queue) ──────────────────────────────
  {
    id: "seed-r11",
    doctorId: "doc-1",
    doctorName: "Dr. Prakash Das",
    patientName: "Unknown User",
    appointmentId: "seed-apt-11",
    rating: 1,
    comment: "This doctor is a fraud! Avoid at all costs. I will post this everywhere.",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isReported: true,
    reportReason: "Abusive language and unverified claims",
    reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    reportedBy: "Dr. Prakash Das",
  },
  {
    id: "seed-r12",
    doctorId: "doc-2",
    doctorName: "Dr. Anika Rao",
    patientName: "Spam Bot",
    appointmentId: "seed-apt-12",
    rating: 1,
    comment: "Buy cheap meds at www.fakepharma.com!!! Best prices guaranteed!!!",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isReported: true,
    reportReason: "Spam content with external promotional links",
    reportedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    reportedBy: "Dr. Anika Rao",
  },
  {
    id: "seed-r13",
    doctorId: "doc-4",
    doctorName: "Dr. Priya Nair",
    patientName: "Arjun M.",
    appointmentId: "seed-apt-13",
    rating: 2,
    comment: "The receptionist was rude and I had to wait 2 hours. This is completely unacceptable behaviour.",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    isReported: true,
    reportReason: "Review is about clinic staff, not the doctor",
    reportedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    reportedBy: "Admin System",
  },
  // ── Hidden review (Admin already moderated) ────────────────────────────────
  {
    id: "seed-r14",
    doctorId: "doc-3",
    doctorName: "Dr. Martin Cole",
    patientName: "Anonymous",
    appointmentId: "seed-apt-14",
    rating: 1,
    comment: "Worst experience ever. Personal attacks and offensive content here.",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    isReported: true,
    reportReason: "Personal attacks and offensive language",
    reportedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
    reportedBy: "Dr. Martin Cole",
    isHidden: true,
    moderatedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    moderatedBy: "admin",
  },
];

// ─── Persistence helpers ───────────────────────────────────────────────────────

/**
 * Reads all reviews from localStorage. Falls back to SEED_REVIEWS only if
 * no persisted `doctorReviews` data exists.
 * Safe to call only inside useEffect / client-side code.
 */
export function getAllReviews(): Review[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: Review[] = JSON.parse(raw);
      // Return persisted data if the array is valid and non-empty
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  // No persisted data — seed localStorage and return seed data
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REVIEWS));
  } catch {
    // ignore storage errors
  }
  return SEED_REVIEWS;
}

/**
 * Writes the entire reviews collection to localStorage.
 * This is the single persistence write path — called by reviewsSlice reducers only.
 */
export function persistReviews(reviews: Review[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // ignore
  }
}
