export type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed" | "missed";

export type Appointment = {
  id: string;
  patient: { name: string; initials: string; age: number };
  clinician: string;
  specialty: string;
  startsAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string;
  room: string;
  type?: string;
  appointmentMode?: "in-person" | "online";
  notes?: string;
  updatedAt?: string;
  prescriptionAvailable?: boolean;
  prescriptionUrl?: string;
  // ── Payment convenience fields (source of truth: paymentsSlice) ──────────
  /** Mirrors the associated Payment.status for UI rendering. */
  paymentStatus?: "pending" | "paid" | "failed";
  /** Mirrors CONSULTATION_FEE at time of booking. */
  consultationFee?: number;
  /** Mirrors Payment.transactionId once paid. */
  transactionId?: string;
  /** Mirrors Payment.method once a method is selected. */
  paymentMethod?: "demo-card" | "upi";
};