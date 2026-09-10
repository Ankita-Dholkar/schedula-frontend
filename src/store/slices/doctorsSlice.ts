import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Doctor } from "@/types/doctor";
import { getAllDoctors, doctors as staticDoctors } from "@/lib/mock-data/doctors";

export type DoctorsState = {
  doctors: Doctor[];
  selectedSpecialty: string;
  searchQuery: string;
};

function getInitialDoctors(): Doctor[] {
  if (typeof window === "undefined") return staticDoctors;
  try {
    return getAllDoctors();
  } catch {
    return staticDoctors;
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
    refreshDoctors: (state) => {
      state.doctors = getAllDoctors();
    },
    setSelectedSpecialty: (state, action: PayloadAction<string>) => {
      state.selectedSpecialty = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const { refreshDoctors, setSelectedSpecialty, setSearchQuery } =
  doctorsSlice.actions;

export default doctorsSlice.reducer;
