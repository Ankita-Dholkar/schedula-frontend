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
  },
});

export const {
  hydratePayments,
  recordPaidPayment,
} = paymentsSlice.actions;

export default paymentsSlice.reducer;
