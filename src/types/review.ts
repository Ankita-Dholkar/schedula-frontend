export interface Review {
  id: string;
  /** Primary identifier resolved from the doctor catalog at submission time. */
  doctorId?: string;
  /** Fallback identifier using appointment clinician name — mock compatibility only, not a unique identity. */
  doctorName: string;
  patientId?: string;
  patientName: string;
  /** Unique appointment reference used for duplicate-review prevention. */
  appointmentId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  /** ISO 8601 timestamp */
  createdAt: string;
  // Reporting (patient-initiated) 
  /** True if a user has flagged this review for admin moderation. */
  isReported?: boolean;
  /** The reason provided by the reporter. */
  reportReason?: string;
  /** ISO 8601 timestamp of when the report was filed. */
  reportedAt?: string;
  /** Name or ID of the user who reported the review. */
  reportedBy?: string;
  // Moderation (admin-initiated) 
  /** True if an admin has hidden this review from public-facing views. */
  isHidden?: boolean;
  /** ISO 8601 timestamp of when the moderation action was taken. */
  moderatedAt?: string;
  /** Admin identifier who performed the moderation. */
  moderatedBy?: string;
}
