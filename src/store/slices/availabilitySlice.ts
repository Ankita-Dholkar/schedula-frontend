import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { DoctorAvailability } from "@/types/availability";
import {
  loadPersistedAvailability,
  saveDoctorAvailability,
  getDoctorAvailability,
} from "@/lib/mock-data/availability";

export type AvailabilityState = {
  doctorAvailabilityMap: Record<string, DoctorAvailability>;
  activeDoctorId: string | null;
};

const initialState: AvailabilityState = {
  doctorAvailabilityMap: {},
  activeDoctorId: null,
};

export const availabilitySlice = createSlice({
  name: "availability",
  initialState,
  reducers: {
    setActiveDoctorId: (state, action: PayloadAction<string>) => {
      state.activeDoctorId = action.payload;
      const doctorId = action.payload;
      const persisted = loadPersistedAvailability(doctorId);
      state.doctorAvailabilityMap[doctorId] =
        persisted ?? getDoctorAvailability(doctorId);
    },
    setDoctorAvailability: (
      state,
      action: PayloadAction<{ doctorId: string; availability: DoctorAvailability }>
    ) => {
      const { doctorId, availability } = action.payload;
      state.doctorAvailabilityMap[doctorId] = availability;
      saveDoctorAvailability(availability);
    },
    updateActiveDoctorAvailability: (
      state,
      action: PayloadAction<DoctorAvailability>
    ) => {
      const availability = action.payload;
      state.doctorAvailabilityMap[availability.doctorId] = availability;
      saveDoctorAvailability(availability);
    },
  },
});

export const {
  setActiveDoctorId,
  setDoctorAvailability,
  updateActiveDoctorAvailability,
} = availabilitySlice.actions;

export default availabilitySlice.reducer;
