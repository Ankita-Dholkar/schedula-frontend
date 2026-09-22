import type { PaymentStatus, PaymentMethod } from "@/types/payment";

export type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed" | "missed" | "starting-soon" | "live";

export type Appointment = {
  id: string;
  patient: { name: string; initials: string; age: number };
  clinician: string;
  specialty: string;
  startsAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string;
  room?: string;
  /** Clinic/location for in-person appointments only. Online appointments omit this. */
  location?: {
    name: string;
    address?: string;
  };
  type?: string;
  appointmentMode?: "in-person" | "online";
  consultationStarted?: boolean;
  notes?: string;
  updatedAt?: string;
  prescriptionAvailable?: boolean;
  prescriptionUrl?: string;
  // ── Payment convenience fields (source of truth: paymentsSlice) 
  /** Mirrors the associated Payment.status for UI rendering. */
  paymentStatus?: PaymentStatus;
  /** Mirrors CONSULTATION_FEE at time of booking. */
  consultationFee?: number;
  /** Mirrors Payment.transactionId once paid. */
  transactionId?: string;
  /** Mirrors Payment.method once a method is selected. */
  paymentMethod?: PaymentMethod;
  // ── Cancellation audit (admin view) 
  /** The reason provided when the appointment was cancelled. */
  cancellationReason?: string;
  /** ISO timestamp of when the appointment was cancelled. */
  cancelledAt?: string;
  /** Who initiated the cancellation. */
  cancelledBy?: "patient" | "doctor" | "admin";
  // ── Reschedule audit (admin view) 
  /** True if the appointment has been rescheduled at least once. */
  isRescheduled?: boolean;
  /** The original startsAt value before the first reschedule. */
  originalStartsAt?: string;
  /** ISO timestamp of when the appointment was rescheduled. */
  rescheduledAt?: string;
  /** The reason provided when the appointment was rescheduled. */
  rescheduleReason?: string;
};
