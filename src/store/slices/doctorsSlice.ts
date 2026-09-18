import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Doctor, DoctorVerificationStatus, DoctorAccountStatus } from "@/types/doctor";
import {
  getAllDoctors,
  doctors as staticDoctors,
  updateDoctorVerification,
  updateDoctorAccountStatus,
  resubmitDoctorVerification,
} from "@/lib/mock-data/doctors";

export type DoctorsState = {
  doctors: Doctor[];
  selectedSpecialty: string;
  searchQuery: string;
};

function getInitialDoctors(): Doctor[] {
  if (typeof window === "undefined") {
    return staticDoctors.map((doc) =>
      doc.verificationStatus === "rejected" ? { ...doc, status: "inactive" as const } : doc
    );
  }
  try {
    return getAllDoctors();
  } catch {
    return staticDoctors.map((doc) =>
      doc.verificationStatus === "rejected" ? { ...doc, status: "inactive" as const } : doc
    );
  }
}

const initialState: DoctorsState = {
  doctors: getInitialDoctors(),
  selectedSpecialty: "all",
  searchQuery: "",
};

export const doctorsSlice = createSlice({
  name: "doctors",
  initialState,
  reducers: {
    /** Reload all doctors from static + localStorage data (including overrides). */
    refreshDoctors: (state) => {
      state.doctors = getAllDoctors();
    },

    setSelectedSpecialty: (state, action: PayloadAction<string>) => {
      state.selectedSpecialty = action.payload;
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    /**
     * Admin: Approve or Reject a doctor's verification.
     * Also persists the change to localStorage via the helper.
     */
    setDoctorVerificationStatus: (
      state,
      action: PayloadAction<{
        id: string;
        status: DoctorVerificationStatus;
        rejectionReason?: string;
      }>
    ) => {
      const { id, status, rejectionReason } = action.payload;
      // Persist to localStorage so the change survives page reloads
      if (status === "approved" || status === "rejected") {
        updateDoctorVerification(id, status, rejectionReason);
      }
      // Update in-memory Redux state
      state.doctors = state.doctors.map((doc) => {
        if (doc.id !== id) return doc;
        return {
          ...doc,
          verificationStatus: status,
          ...(status === "rejected" ? { status: "inactive" as const } : {}),
          rejectionReason: status === "rejected" ? (rejectionReason ?? "") : undefined,
          rejectionDate: status === "rejected" ? new Date().toISOString() : undefined,
        };
      });
    },

    /**
     * Admin: Activate or Deactivate a doctor's account.
     * Also persists the change to localStorage via the helper.
     */
    setDoctorAccountStatus: (
      state,
      action: PayloadAction<{ id: string; status: DoctorAccountStatus }>
    ) => {
      const { id, status } = action.payload;
      const target = state.doctors.find((d) => d.id === id);
      if (status === "active" && target?.verificationStatus === "rejected") {
        return;
      }
      updateDoctorAccountStatus(id, status);
      state.doctors = state.doctors.map((doc) =>
        doc.id === id ? { ...doc, status } : doc
      );
    },

    /**
     * Doctor: Resubmit verification after rejection.
     * Resets status back to "pending", clears rejection info.
     * Also persists the change to localStorage via the helper.
     */
    resubmitVerification: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      resubmitDoctorVerification(id);
      const now = new Date().toISOString();
      state.doctors = state.doctors.map((doc) => {
        if (doc.id !== id) return doc;
        return {
          ...doc,
          verificationStatus: "pending",
          rejectionReason: undefined,
          rejectionDate: undefined,
          submittedAt: now,
        };
      });
    },
  },
});

export const {
  refreshDoctors,
  setSelectedSpecialty,
  setSearchQuery,
  setDoctorVerificationStatus,
  setDoctorAccountStatus,
  resubmitVerification,
} = doctorsSlice.actions;

export default doctorsSlice.reducer;
