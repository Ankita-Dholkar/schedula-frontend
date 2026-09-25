import { loadAdminUsers } from "@/lib/mock-data/admins";
import type { AdminManagedUser } from "@/types/admin";

export type AdminLoginResult =
  | { success: true; admin: AdminManagedUser }
  | { success: false; error: string };

/**
 * Mock admin authentication.
 *
 * Authentication order:
 * 1. Load admin users from localStorage (persisted records).
 * 2. Fall back to SEED_ADMIN_USERS if no persisted data exists.
 * 3. Match on email + password (case-insensitive email).
 * 4. Only allow accounts with isActive === true.
 *
 * This ensures that password changes, newly created admins, and deactivations
 * made in the Admin User Management UI all take effect immediately on the next login.
 */
export function adminLogin(email: string, password: string): AdminLoginResult {
  const trimmedEmail = email.trim().toLowerCase();

  // Load from localStorage first, fall back to seed accounts
  const allAdmins = loadAdminUsers();

  const match = allAdmins.find(
    (a) =>
      (a.email.toLowerCase() === trimmedEmail ||
        (a.id === "admin-001" &&
          (trimmedEmail === "admin@schedula.com" || trimmedEmail === "admin123@schedula.com"))) &&
      a.password === password
  );

  if (!match) {
    return { success: false, error: "Invalid email or password." };
  }

  if (!match.isActive) {
    return {
      success: false,
      error:
        "This admin account has been deactivated. Please contact the Super Admin.",
    };
  }

  // Return the admin record without mutating it (password is kept in the type but
  // the Redux state will hold the full record — acceptable for a mock setup).
  return {
    success: true,
    admin: {
      ...match,
      lastLoginAt: new Date().toISOString(),
    },
  };
}
