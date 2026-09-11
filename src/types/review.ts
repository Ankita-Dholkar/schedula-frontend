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
}
