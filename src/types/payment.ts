/**
 * Demo payment types for Schedula.
 * No real money or payment gateway is involved — this is a frontend simulation only.
 */

export type PaymentMethod = "card" | "upi";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

/** Single source-of-truth for the consultation fee across all portals. */
export const CONSULTATION_FEE = 500;

export interface Payment {
  id: string;
  /** Links this payment record to its appointment. */
  appointmentId: string;
  patientId?: string;
  doctorId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  /** Populated only after a successful demo payment (e.g. "DEMO-58321472"). */
  transactionId?: string;
  createdAt: string;
  updatedAt?: string;
  /** Populated when a demo refund has been recorded. */
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
}
