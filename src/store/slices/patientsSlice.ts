import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { PatientUser } from "@/types/user";
import {
  getAllPatients,
  updatePatientAccountStatus as persistStatusUpdate,
} from "@/lib/mock-data/patients";

export type PatientsState = {
  patients: PatientUser[];
  searchQuery: string;
  statusFilter: "all" | "active" | "inactive";
};

function getInitialPatients(): PatientUser[] {
  if (typeof window === "undefined") return [];
  try {
    return getAllPatients();
  } catch {
    return [];
  }
}

const initialState: PatientsState = {
  patients: getInitialPatients(),
  searchQuery: "",
  statusFilter: "all",
};

export const patientsSlice = createSlice({
  name: "patients",
  initialState,
  reducers: {
    /** Reload all patients from static mock + localStorage data (including runtime signups and status overrides). */
    refreshPatients: (state) => {
      state.patients = getAllPatients();
    },

    /**
     * Admin: Activate or Deactivate a patient account.
     * Persists the change via the mock-data helper (pure reducer — no localStorage inside reducer).
     * Does NOT modify any appointment records.
     */
    setPatientAccountStatus: (
      state,
      action: PayloadAction<{ id: string; accountStatus: "active" | "inactive" }>
    ) => {
      const { id, accountStatus } = action.payload;
      // Persist to localStorage so the change survives page reloads
      persistStatusUpdate(id, accountStatus);
      // Update in-memory Redux state
      state.patients = state.patients.map((p) =>
        p.id === id ? { ...p, accountStatus } : p
      );
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setStatusFilter: (
      state,
      action: PayloadAction<"all" | "active" | "inactive">
    ) => {
      state.statusFilter = action.payload;
    },
  },
});

export const {
  refreshPatients,
  setPatientAccountStatus,
  setSearchQuery,
  setStatusFilter,
} = patientsSlice.actions;

export default patientsSlice.reducer;
