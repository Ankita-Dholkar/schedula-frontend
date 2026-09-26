/**
 * Demo payment types for Schedula.
 * No real money or payment gateway is involved — this is a frontend simulation only.
 */

export type PaymentMethod = "card" | "upi";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

/**
 * Refund lifecycle status on a payment.
 * "none"      — no refund requested
 * "requested" — patient has requested; doctor has not reviewed yet
 * "refunded"  — doctor approved; payment.status is also "refunded"
 * "rejected"  — doctor rejected the refund request
 */
export type RefundStatus = "none" | "requested" | "refunded" | "rejected";

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

  // ── Refund workflow fields ────────────────────────────────────────────────────
  /** Overall refund lifecycle state for this payment. */
  refundStatus?: RefundStatus;
  /** ISO timestamp of when the patient first submitted the refund request. */
  refundRequestedAt?: string;
  /** Name or ID of the patient who requested the refund. */
  refundRequestedBy?: string;
  /** Patient's stated reason for the refund request. */
  refundReason?: string;
  /** Final refund amount approved by the doctor. Equals payment.amount for full refunds. */
  refundAmount?: number;
  /** Mock refund transaction ID generated on approval (e.g. "REFUND-58321472"). */
  refundId?: string;
  /** ISO timestamp of when the doctor approved the refund. */
  refundedAt?: string;
  /** ISO timestamp of when the doctor rejected the refund. */
  refundRejectedAt?: string;
  /** Doctor's stated reason for rejecting the refund request. */
  refundRejectedReason?: string;
}
