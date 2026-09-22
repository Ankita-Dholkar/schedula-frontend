/**
 * Admin Notification types for Schedula.
 * These represent system-level broadcast messages sent by admins to target audiences.
 * No real push/email infrastructure — frontend simulation only.
 */

export type NotificationTarget = "all_patients" | "all_doctors" | "selected_users";

export type NotificationCategory =
  | "announcement"
  | "maintenance"
  | "promotion"
  | "reminder"
  | "alert";

export type NotificationStatus = "sent" | "scheduled" | "failed";

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  target: NotificationTarget;
  /** Selected user IDs/names when target is "selected_users". */
  selectedUsers?: string[];
  category: NotificationCategory;
  status: NotificationStatus;
  /** ISO 8601 timestamp — when the notification was created/sent. */
  sentAt: string;
  /** Admin identifier who sent the notification. */
  sentBy: string;
  /** Approximate recipient count (derived at send time). */
  recipientCount?: number;
}
