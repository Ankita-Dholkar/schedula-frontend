import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/user";

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
};

function getInitialUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("loggedInUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const initialUser = getInitialUser();

const initialState: AuthState = {
  user: initialUser,
  isAuthenticated: !!initialUser,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      try {
        localStorage.setItem("loggedInUser", JSON.stringify(action.payload));
      } catch {
        /* ignore */
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      try {
        localStorage.removeItem("loggedInUser");
      } catch {
        /* ignore */
      }
    },
    updateAuthUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload } as User;
        try {
          localStorage.setItem("loggedInUser", JSON.stringify(state.user));
        } catch {
          /* ignore */
        }
      }
    },
    hydrateAuth: (state) => {
      const u = getInitialUser();
      state.user = u;
      state.isAuthenticated = !!u;
    },
  },
});

export const { setAuthUser, logout, updateAuthUser, hydrateAuth } =
  authSlice.actions;
export default authSlice.reducer;
