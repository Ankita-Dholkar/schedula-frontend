import {
  ROLE_PERMISSIONS,
  type AdminManagedUser,
  type AdminModule,
  type AdminAction,
  type AdminRole,
} from "@/types/admin";

// ── Core Permission Check ──────────────────────────────────────────────────

/**
 * Checks if a given admin user has a specific action permission on a module.
 * Returns false if the admin is inactive or the module/action is not in their role's permission map.
 */
export function hasPermission(
  admin: AdminManagedUser | null | undefined,
  module: AdminModule,
  action: AdminAction
): boolean {
  if (!admin || !admin.isActive) return false;
  const permissions = ROLE_PERMISSIONS[admin.adminRole];
  return permissions[module]?.includes(action) ?? false;
}

/**
 * Checks if an admin can VIEW a specific module at all.
 * Useful for hiding sidebar items and guarding routes.
 */
export function canViewModule(
  admin: AdminManagedUser | null | undefined,
  module: AdminModule
): boolean {
  return hasPermission(admin, module, "view");
}

// ── Route → Module Mapping ─────────────────────────────────────────────────

const ROUTE_MODULE_MAP: Partial<Record<string, AdminModule>> = {
  "/admin/dashboard":           "dashboard",
  "/admin/analytics":           "analytics",
  "/admin/doctors":             "doctors",
  "/admin/doctor-verification": "doctor_verification",
  "/admin/patients":            "patients",
  "/admin/appointments":        "appointments",
  "/admin/payments":            "payments",
  "/admin/reviews":             "reviews",
  "/admin/notifications":       "notifications",
  "/admin/reports":             "reports",
  "/admin/audit-logs":          "audit_logs",
  "/admin/admin-users":         "admin_users",
  "/admin/settings":            "settings",
};

/**
 * Returns the AdminModule that corresponds to a given route path, or null if unknown.
 */
export function getModuleForRoute(routePath: string): AdminModule | null {
  return ROUTE_MODULE_MAP[routePath] ?? null;
}

/**
 * Checks whether an admin can access (view) a given route path.
 * Returns true for unregistered routes (not blocked) to avoid over-restricting navigation.
 */
export function canAccessRoute(
  admin: AdminManagedUser | null | undefined,
  routePath: string
): boolean {
  const module = getModuleForRoute(routePath);
  if (!module) return true; // unknown routes are not blocked
  return hasPermission(admin, module, "view");
}

// ── Safeguard Checks ───────────────────────────────────────────────────────

/**
 * Returns true if deactivating the given target would leave no active Super Admins.
 * Used to prevent the last Super Admin from being deactivated.
 */
export function wouldRemoveLastSuperAdmin(
  allAdmins: AdminManagedUser[],
  targetId: string
): boolean {
  const activeSuperAdmins = allAdmins.filter(
    (a) => a.adminRole === "super_admin" && a.isActive && a.id !== targetId
  );
  return activeSuperAdmins.length === 0;
}

/**
 * Returns true if changing a Super Admin's role would leave no active Super Admins.
 * Used to prevent stripping the last Super Admin of their role.
 */
export function wouldStripLastSuperAdminRole(
  allAdmins: AdminManagedUser[],
  targetId: string,
  newRole: AdminRole
): boolean {
  if (newRole === "super_admin") return false; // upgrading or keeping same
  const remainingSuperAdmins = allAdmins.filter(
    (a) => a.adminRole === "super_admin" && a.isActive && a.id !== targetId
  );
  return remainingSuperAdmins.length === 0;
}
