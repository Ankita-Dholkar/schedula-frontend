import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AdminUser } from "@/types/user";

// localStorage is intentionally NOT accessed inside this reducer.
// Session hydration is handled by a client-side effect in the AdminAuthProvider.
export type AdminAuthState = {
  admin: AdminUser | null;
  isAuthenticated: boolean;
};

const initialState: AdminAuthState = {
  admin: null,
  isAuthenticated: false,
};

export const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    setAdminUser: (state, action: PayloadAction<AdminUser>) => {
      state.admin = action.payload;
      state.isAuthenticated = true;
    },
    clearAdminUser: (state) => {
      state.admin = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setAdminUser, clearAdminUser } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
