import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AdminManagedUser } from "@/types/admin";

// localStorage is intentionally NOT accessed inside this reducer.
// Session hydration is handled by a client-side effect in the AdminProtectedLayout.
export type AdminAuthState = {
  admin: AdminManagedUser | null;
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
    setAdminUser: (state, action: PayloadAction<AdminManagedUser>) => {
      state.admin = action.payload;
      state.isAuthenticated = true;
    },
    clearAdminUser: (state) => {
      state.admin = null;
      state.isAuthenticated = false;
    },
    /**
     * Updates the logged-in admin's profile fields in Redux state
     * (e.g. after a profile or password change in Settings).
     */
    updateAdminProfile: (
      state,
      action: PayloadAction<Partial<AdminManagedUser>>
    ) => {
      if (state.admin) {
        state.admin = { ...state.admin, ...action.payload };
      }
    },
  },
});

export const { setAdminUser, clearAdminUser, updateAdminProfile } =
  adminAuthSlice.actions;
export default adminAuthSlice.reducer;
