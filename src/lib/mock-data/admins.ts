import type { AdminManagedUser } from "@/types/admin";

/** localStorage key for persisted admin user records. */
export const ADMIN_USERS_STORAGE_KEY = "schedula_admin_users";

/**
 * Seed admin accounts used as fallback when no persisted records exist in localStorage.
 * These are the three predefined demo accounts for testing all role levels.
 */
export const SEED_ADMIN_USERS: AdminManagedUser[] = [
  {
    id: "admin-001",
    name: "Schedula Admin",
    email: "admin123@schedula.com",
    mobile: "9000000001",
    password: "admin123",
    role: "admin",
    adminRole: "super_admin",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    lastLoginAt: "2026-09-24T08:00:00.000Z",
    notificationPreferences: {
      doctorVerificationAlerts: true,
      appointmentAnomalyAlerts: true,
      auditSecurityAlerts: true,
      weeklyDigest: true,
    },
  },
  {
    id: "admin-002",
    name: "Ops Admin",
    email: "ops@schedula.com",
    mobile: "9000000002",
    password: "ops123",
    role: "admin",
    adminRole: "admin",
    isActive: true,
    createdAt: "2024-02-15T00:00:00.000Z",
    lastLoginAt: "2026-09-23T14:30:00.000Z",
    notificationPreferences: {
      doctorVerificationAlerts: true,
      appointmentAnomalyAlerts: true,
      auditSecurityAlerts: false,
      weeklyDigest: false,
    },
  },
  {
    id: "admin-003",
    name: "Support Staff",
    email: "support@schedula.com",
    mobile: "9000000003",
    password: "support123",
    role: "admin",
    adminRole: "support",
    isActive: true,
    createdAt: "2024-03-10T00:00:00.000Z",
    lastLoginAt: "2026-09-22T11:00:00.000Z",
    notificationPreferences: {
      doctorVerificationAlerts: false,
      appointmentAnomalyAlerts: true,
      auditSecurityAlerts: false,
      weeklyDigest: false,
    },
  },
];

/**
 * Loads admin users from localStorage.
 * Falls back to SEED_ADMIN_USERS if no persisted data exists.
 */
export function loadAdminUsers(): AdminManagedUser[] {
  try {
    const raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AdminManagedUser[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore parse errors */
  }
  return SEED_ADMIN_USERS;
}

/**
 * Persists admin users to localStorage.
 */
export function saveAdminUsers(users: AdminManagedUser[]): void {
  try {
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    /* ignore storage errors */
  }
}
