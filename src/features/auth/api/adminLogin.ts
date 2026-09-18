import { ADMIN_USERS } from "@/lib/mock-data/admins";
import type { AdminUser } from "@/types/user";

export type AdminLoginResult =
  | { success: true; admin: AdminUser }
  | { success: false; error: string };

/**
 * Mock admin authentication.
 * Searches ADMIN_USERS for a matching email + password.
 * Only allows accounts with isActive === true.
 * Completely separate from the Patient/Doctor login flow.
 */
export function adminLogin(email: string, password: string): AdminLoginResult {
  const trimmedEmail = email.trim().toLowerCase();

  const match = ADMIN_USERS.find(
    (a) => a.email.toLowerCase() === trimmedEmail && a.password === password
  );

  if (!match) {
    return { success: false, error: "Invalid email or password." };
  }

  if (!match.isActive) {
    return {
      success: false,
      error: "This admin account has been deactivated. Please contact support.",
    };
  }

  // Return admin without password field for safety
  const { password: _omit, ...safeAdmin } = match;
  return { success: true, admin: { ...safeAdmin, role: "admin", isActive: true } };
}
