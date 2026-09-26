import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Payment } from "@/types/payment";
import { getAllPayments } from "@/lib/mock-data/payments";

export interface PaymentsState {
  payments: Payment[];
}

function getInitialPayments(): Payment[] {
  if (typeof window === "undefined") return [];
  try {
    return getAllPayments();
  } catch {
    return [];
  }
}

const initialState: PaymentsState = {
  payments: getInitialPayments(),
};

export const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    /** Loads payments from localStorage (or seed data fallback). */
    hydratePayments: (state) => {
      state.payments = getAllPayments();
    },

    /**
     * Records a finalized paid payment.
     * Persistence is handled outside this reducer by a store subscriber.
     */
    recordPaidPayment: (state, action: PayloadAction<Payment>) => {
      const existingIndex = state.payments.findIndex(
        (p) => p.appointmentId === action.payload.appointmentId
      );
      if (existingIndex >= 0) {
        state.payments[existingIndex] = action.payload;
      } else {
        state.payments.push(action.payload);
      }
    },

    /**
     * Patient requests a refund for a cancelled/missed appointment with a paid payment.
     * Sets refundStatus to "requested" and records the request metadata.
     */
    requestRefund: (
      state,
      action: PayloadAction<{
        appointmentId: string;
        refundReason?: string;
        patientName?: string;
      }>
    ) => {
      const { appointmentId, refundReason, patientName } = action.payload;
      const payment = state.payments.find((p) => p.appointmentId === appointmentId);
      if (payment) {
        payment.refundStatus = "requested";
        payment.refundRequestedAt = new Date().toISOString();
        payment.refundRequestedBy = patientName;
        payment.refundReason = refundReason;
        payment.refundAmount = payment.amount;
        payment.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Doctor approves a refund request.
     * Sets payment.status to "refunded", refundStatus to "refunded",
     * generates a mock refundId and refundedAt timestamp.
     * Revenue automatically recalculates because "paid" filter now excludes this payment.
     */
    approveRefund: (
      state,
      action: PayloadAction<{
        appointmentId: string;
      }>
    ) => {
      const { appointmentId } = action.payload;
      const payment = state.payments.find((p) => p.appointmentId === appointmentId);
      if (payment) {
        const now = new Date().toISOString();
        payment.status = "refunded";
        payment.refundStatus = "refunded";
        payment.refundId = `REFUND-${Math.floor(Math.random() * 90000000 + 10000000)}`;
        payment.refundAmount = payment.amount;
        payment.refundedAt = now;
        payment.updatedAt = now;
      }
    },

    /**
     * Doctor rejects a refund request.
     * Sets refundStatus to "rejected" and records the rejection reason and timestamp.
     */
    rejectRefund: (
      state,
      action: PayloadAction<{
        appointmentId: string;
        rejectionReason: string;
      }>
    ) => {
      const { appointmentId, rejectionReason } = action.payload;
      const payment = state.payments.find((p) => p.appointmentId === appointmentId);
      if (payment) {
        const now = new Date().toISOString();
        payment.refundStatus = "rejected";
        payment.refundRejectedReason = rejectionReason;
        payment.refundRejectedAt = now;
        payment.updatedAt = now;
      }
    },
  },
});

export const {
  hydratePayments,
  recordPaidPayment,
  requestRefund,
  approveRefund,
  rejectRefund,
} = paymentsSlice.actions;

export default paymentsSlice.reducer;
