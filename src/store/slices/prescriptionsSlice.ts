import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Prescription } from "@/types/prescription";
import {
  getAllPrescriptions,
  savePrescription as persistSavePrescription,
  updatePrescription as persistUpdatePrescription,
} from "@/lib/mock-data/prescriptions";

export type PrescriptionsState = {
  prescriptions: Record<string, Prescription>;
};

function getInitialPrescriptions(): Record<string, Prescription> {
  if (typeof window === "undefined") return {};
  try {
    return getAllPrescriptions();
  } catch {
    return {};
  }
}

const initialState: PrescriptionsState = {
  prescriptions: getInitialPrescriptions(),
};

export const prescriptionsSlice = createSlice({
  name: "prescriptions",
  initialState,
  reducers: {
    refreshPrescriptions: (state) => {
      state.prescriptions = getAllPrescriptions();
    },
    savePrescriptionAction: (state, action: PayloadAction<Prescription>) => {
      const rx = action.payload;
      state.prescriptions[rx.appointmentId] = rx;
      persistSavePrescription(rx);
    },
    updatePrescriptionAction: (
      state,
      action: PayloadAction<{
        appointmentId: string;
        updates: Partial<Prescription>;
      }>
    ) => {
      const { appointmentId, updates } = action.payload;
      if (state.prescriptions[appointmentId]) {
        state.prescriptions[appointmentId] = {
          ...state.prescriptions[appointmentId],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        persistUpdatePrescription(appointmentId, updates);
      }
    },
  },
});

export const {
  refreshPrescriptions,
  savePrescriptionAction,
  updatePrescriptionAction,
} = prescriptionsSlice.actions;

export default prescriptionsSlice.reducer;
