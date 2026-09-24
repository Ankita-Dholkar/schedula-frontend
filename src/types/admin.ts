// ── Admin Role & Permission System ─────────────────────────────────────────

/** The three predefined admin roles in the system. */
export type AdminRole = "super_admin" | "admin" | "support";

/** All navigable modules in the admin portal. */
export type AdminModule =
  | "dashboard"
  | "analytics"
  | "doctors"
  | "doctor_verification"
  | "patients"
  | "appointments"
  | "payments"
  | "reviews"
  | "notifications"
  | "reports"
  | "audit_logs"
  | "admin_users"
  | "settings";

/** Granular actions that can be performed within a module. */
export type AdminAction = "view" | "create" | "edit" | "delete" | "approve_reject";

/** Map of module → allowed actions for a given role. */
export type PermissionMap = Partial<Record<AdminModule, AdminAction[]>>;

// ── Role Permission Definitions ─────────────────────────────────────────────

const ALL_ACTIONS: AdminAction[] = ["view", "create", "edit", "delete", "approve_reject"];

export const ROLE_PERMISSIONS: Record<AdminRole, PermissionMap> = {
  /** Super Admin: Full access to every module and every action. */
  super_admin: {
    dashboard:           ALL_ACTIONS,
    analytics:           ALL_ACTIONS,
    doctors:             ALL_ACTIONS,
    doctor_verification: ALL_ACTIONS,
    patients:            ALL_ACTIONS,
    appointments:        ALL_ACTIONS,
    payments:            ALL_ACTIONS,
    reviews:             ALL_ACTIONS,
    notifications:       ALL_ACTIONS,
    reports:             ALL_ACTIONS,
    audit_logs:          ALL_ACTIONS,
    admin_users:         ALL_ACTIONS,
    settings:            ALL_ACTIONS,
  },

  /**
   * Admin (Operations): View/Create/Edit on operational modules,
   * Approve/Reject on doctor_verification, View on audit_logs,
   * no access to admin_users or platform settings management.
   */
  admin: {
    dashboard:           ["view"],
    analytics:           ["view"],
    doctors:             ["view", "create", "edit"],
    doctor_verification: ["view", "approve_reject"],
    patients:            ["view", "create", "edit"],
    appointments:        ["view", "create", "edit"],
    payments:            ["view", "create", "edit"],
    reviews:             ["view", "create", "edit"],
    notifications:       ["view", "create", "edit"],
    reports:             ["view", "create", "edit"],
    audit_logs:          ["view"],
    // admin_users: intentionally absent — no access
    settings:            ["view", "edit"], // profile + notifications only; platform settings tab is hidden
  },

  /**
   * Support: View-only access to operational/support-facing modules.
   * All create, edit, delete, and approve/reject actions are disabled.
   * No access to audit_logs, admin_users, or platform settings.
   */
  support: {
    dashboard:           ["view"],
    analytics:           ["view"],
    doctors:             ["view"],
    doctor_verification: ["view"],
    patients:            ["view"],
    appointments:        ["view"],
    payments:            ["view"],
    reviews:             ["view"],
    notifications:       ["view"],
    reports:             ["view"],
    // audit_logs:   intentionally absent — no access
    // admin_users:  intentionally absent — no access
    settings:            ["view", "edit"], // profile + notifications only; platform settings tab is hidden
  },
};

// ── Role Metadata ─────────────────────────────────────────────────────────

export type RoleMeta = {
  label: string;
  description: string;
  badgeColor: string;  // Tailwind classes for badge background + text
  badgeBorder: string; // Tailwind border class
};

export const ROLE_META: Record<AdminRole, RoleMeta> = {
  super_admin: {
    label: "Super Admin",
    description: "Full access to all modules, actions, role assignments, and platform settings.",
    badgeColor: "bg-violet-50 text-violet-700",
    badgeBorder: "border-violet-200",
  },
  admin: {
    label: "Operations Admin",
    description: "View, create, and edit access to operational modules. Approve/Reject doctor verifications. No access to Admin User management or platform configuration.",
    badgeColor: "bg-blue-50 text-blue-700",
    badgeBorder: "border-blue-200",
  },
  support: {
    label: "Support Staff",
    description: "View-only access to patient, doctor, appointment, and support-facing modules. All write actions are disabled.",
    badgeColor: "bg-slate-100 text-slate-600",
    badgeBorder: "border-slate-200",
  },
};

// ── Admin Managed User ──────────────────────────────────────────────────────

/**
 * Full admin user record stored in localStorage and Redux.
 * Extends the base user shape with admin-specific fields.
 */
export type AdminManagedUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: "admin"; // legacy compatibility with BaseUser
  adminRole: AdminRole;
  isActive: boolean;
  /** ISO timestamp of when the admin was created. */
  createdAt: string;
  /** ISO timestamp of the last login. */
  lastLoginAt?: string;
  /** Notification preferences. */
  notificationPreferences?: NotificationPreferences;
};

// ── Notification Preferences ───────────────────────────────────────────────

export type NotificationPreferences = {
  doctorVerificationAlerts: boolean;
  appointmentAnomalyAlerts: boolean;
  auditSecurityAlerts: boolean;
  weeklyDigest: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  doctorVerificationAlerts: true,
  appointmentAnomalyAlerts: true,
  auditSecurityAlerts: true,
  weeklyDigest: false,
};

// ── Platform Settings ──────────────────────────────────────────────────────

/** Global platform configuration — Super Admin only. */
export type PlatformSettings = {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  appointmentBufferMinutes: number;
  maxAdvanceBookingDays: number;
  currency: "INR" | "USD";
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: "Schedula",
  supportEmail: "support@schedula.com",
  maintenanceMode: false,
  appointmentBufferMinutes: 15,
  maxAdvanceBookingDays: 60,
  currency: "INR",
};
