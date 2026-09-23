/**
 * Audit Log types for the Schedula Admin Portal.
 */

// Action Types 

export type AuditActionType =
  | "DOCTOR_VERIFIED"
  | "DOCTOR_REJECTED"
  | "DOCTOR_STATUS_TOGGLED"
  | "DOCTOR_PROFILE_UPDATED"
  | "PATIENT_STATUS_TOGGLED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_RESCHEDULED"
  | "APPOINTMENT_STATUS_UPDATED"
  | "NOTIFICATION_BROADCAST"
  | "REVIEW_HIDDEN"
  | "REVIEW_RESTORED"
  | "PAYMENT_REFUNDED"
  | "ADMIN_LOGIN"
  | "ADMIN_LOGOUT";

export const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
  DOCTOR_VERIFIED:           "Approved Doctor Verification",
  DOCTOR_REJECTED:           "Rejected Doctor Verification",
  DOCTOR_STATUS_TOGGLED:     "Toggled Doctor Account Status",
  DOCTOR_PROFILE_UPDATED:    "Updated Doctor Profile",
  PATIENT_STATUS_TOGGLED:    "Toggled Patient Account Status",
  APPOINTMENT_CANCELLED:     "Cancelled Appointment",
  APPOINTMENT_RESCHEDULED:   "Rescheduled Appointment",
  APPOINTMENT_STATUS_UPDATED:"Updated Appointment Status",
  NOTIFICATION_BROADCAST:    "Sent Broadcast Notification",
  REVIEW_HIDDEN:             "Hidden Reported Review",
  REVIEW_RESTORED:           "Restored Hidden Review",
  PAYMENT_REFUNDED:          "Recorded Payment Refund",
  ADMIN_LOGIN:               "Admin Login",
  ADMIN_LOGOUT:              "Admin Logout",
};

export type AuditActionCategory =
  | "all"
  | "doctor_management"
  | "patient_management"
  | "appointments"
  | "payments"
  | "reviews"
  | "notifications"
  | "auth";

export const ACTION_CATEGORY_MAP: Record<AuditActionType, AuditActionCategory> = {
  DOCTOR_VERIFIED:           "doctor_management",
  DOCTOR_REJECTED:           "doctor_management",
  DOCTOR_STATUS_TOGGLED:     "doctor_management",
  DOCTOR_PROFILE_UPDATED:    "doctor_management",
  PATIENT_STATUS_TOGGLED:    "patient_management",
  APPOINTMENT_CANCELLED:     "appointments",
  APPOINTMENT_RESCHEDULED:   "appointments",
  APPOINTMENT_STATUS_UPDATED:"appointments",
  NOTIFICATION_BROADCAST:    "notifications",
  REVIEW_HIDDEN:             "reviews",
  REVIEW_RESTORED:           "reviews",
  PAYMENT_REFUNDED:          "payments",
  ADMIN_LOGIN:               "auth",
  ADMIN_LOGOUT:              "auth",
};

// Actor 

export type AuditActor = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "doctor" | "patient";
};

// Entity 

export type AuditEntityType =
  | "doctor"
  | "patient"
  | "appointment"
  | "payment"
  | "review"
  | "notification"
  | "system"
  | "auth";

// Severity 

export type AuditSeverity = "info" | "warning" | "critical";

// Main Interface

export interface AuditLog {
  id: string;
  timestamp: string; // ISO
  actor: AuditActor;
  action: AuditActionType;
  actionLabel: string;
  entityType: AuditEntityType;
  entityId: string;
  entityName: string;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  severity: AuditSeverity;
}
