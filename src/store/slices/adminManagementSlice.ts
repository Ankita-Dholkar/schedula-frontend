import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  type AdminManagedUser,
  type PlatformSettings,
  type NotificationPreferences,
  DEFAULT_PLATFORM_SETTINGS,
} from "@/types/admin";
import {
  loadAdminUsers,
  saveAdminUsers,
  ADMIN_USERS_STORAGE_KEY,
} from "@/lib/mock-data/admins";

const PLATFORM_SETTINGS_KEY = "schedula_platform_settings";

function loadPlatformSettings(): PlatformSettings {
  try {
    const raw = localStorage.getItem(PLATFORM_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_PLATFORM_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_PLATFORM_SETTINGS;
}

function savePlatformSettings(settings: PlatformSettings): void {
  try {
    localStorage.setItem(PLATFORM_SETTINGS_KEY, JSON.stringify(settings));
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("schedula_platform_settings_changed", { detail: settings })
      );
    }
  } catch {
    /* ignore */
  }
}

export type AdminManagementState = {
  admins: AdminManagedUser[];
  platformSettings: PlatformSettings;
  hydrated: boolean;
};

const initialState: AdminManagementState = {
  admins: [],
  platformSettings:
    typeof window !== "undefined"
      ? loadPlatformSettings()
      : DEFAULT_PLATFORM_SETTINGS,
  hydrated: false,
};

export const adminManagementSlice = createSlice({
  name: "adminManagement",
  initialState,
  reducers: {
    /** Hydrate admin users and platform settings from localStorage (run once on mount). */
    hydrateAdminManagement: (state) => {
      state.admins = loadAdminUsers();
      state.platformSettings = loadPlatformSettings();
      state.hydrated = true;
    },

    // ── Admin User CRUD ──────────────────────────────────────────────────────

    /** Add a new admin user. Persists to localStorage. */
    addAdmin: (state, action: PayloadAction<AdminManagedUser>) => {
      state.admins.push(action.payload);
      saveAdminUsers(state.admins);
    },

    /** Update an existing admin's profile or role. Persists to localStorage. */
    updateAdmin: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<AdminManagedUser> }>
    ) => {
      const idx = state.admins.findIndex((a) => a.id === action.payload.id);
      if (idx !== -1) {
        state.admins[idx] = { ...state.admins[idx], ...action.payload.changes };
        saveAdminUsers(state.admins);
      }
    },

    /** Toggle an admin's active status. Persists to localStorage. */
    setAdminActiveStatus: (
      state,
      action: PayloadAction<{ id: string; isActive: boolean }>
    ) => {
      const idx = state.admins.findIndex((a) => a.id === action.payload.id);
      if (idx !== -1) {
        state.admins[idx].isActive = action.payload.isActive;
        saveAdminUsers(state.admins);
      }
    },

    /**
     * Update the notification preferences for a specific admin.
     * Also updates the stored admin list so changes are reflected on next login.
     */
    updateAdminNotificationPrefs: (
      state,
      action: PayloadAction<{
        id: string;
        prefs: Partial<NotificationPreferences>;
      }>
    ) => {
      const idx = state.admins.findIndex((a) => a.id === action.payload.id);
      if (idx !== -1) {
        state.admins[idx].notificationPreferences = {
          ...(state.admins[idx].notificationPreferences ?? {
            doctorVerificationAlerts: true,
            appointmentAnomalyAlerts: true,
            auditSecurityAlerts: true,
            weeklyDigest: false,
          }),
          ...action.payload.prefs,
        };
        saveAdminUsers(state.admins);
      }
    },

    // ── Platform Settings ────────────────────────────────────────────────────

    /** Update platform settings (Super Admin only — enforced at the UI level). */
    updatePlatformSettings: (
      state,
      action: PayloadAction<Partial<PlatformSettings>>
    ) => {
      state.platformSettings = { ...state.platformSettings, ...action.payload };
      savePlatformSettings(state.platformSettings);
    },

    /** Reset platform settings back to defaults. */
    resetPlatformSettings: (state) => {
      state.platformSettings = DEFAULT_PLATFORM_SETTINGS;
      savePlatformSettings(DEFAULT_PLATFORM_SETTINGS);
    },

    /** Force a full reload of admin users from localStorage (e.g. after an external write). */
    reloadAdminUsers: (state) => {
      state.admins = loadAdminUsers();
    },
  },
});

export const {
  hydrateAdminManagement,
  addAdmin,
  updateAdmin,
  setAdminActiveStatus,
  updateAdminNotificationPrefs,
  updatePlatformSettings,
  resetPlatformSettings,
  reloadAdminUsers,
} = adminManagementSlice.actions;

export default adminManagementSlice.reducer;

// ── Selectors ──────────────────────────────────────────────────────────────

import type { RootState } from "@/store/store";

export const selectAllAdmins = (state: RootState) =>
  state.adminManagement.admins;

export const selectAdminById = (id: string) => (state: RootState) =>
  state.adminManagement.admins.find((a) => a.id === id);

export const selectPlatformSettings = (state: RootState) =>
  state.adminManagement.platformSettings;

export const selectAdminManagementHydrated = (state: RootState) =>
  state.adminManagement.hydrated;

/** Storage key re-export so other modules don't need to import from admins.ts */
export { ADMIN_USERS_STORAGE_KEY };
