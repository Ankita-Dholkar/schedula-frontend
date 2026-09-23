import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AdminNotification } from "@/types/notification";
import {
  deliverAdminNotificationToPatients,
  deliverAdminNotificationToDoctors,
} from "@/lib/mock-data/appointments";

// ─── Persistence helpers ───────────────────────────────────────────────────────

const STORAGE_KEY = "adminNotifications";

function loadFromStorage(): AdminNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AdminNotification[];
  } catch {
    return [];
  }
}

function saveToStorage(notifications: AdminNotification[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch { /* ignore */ }
}

// ─── Seed data ─────────────────────────────────────────────────────────────────

const SEED_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "notif-seed-001",
    title: "Platform Scheduled Maintenance",
    message:
      "We will be performing scheduled maintenance on Sunday, 28 Sep 2026 from 02:00 AM to 04:00 AM IST. During this window, the platform will be temporarily unavailable. We apologize for any inconvenience.",
    target: "all_patients",
    category: "maintenance",
    status: "sent",
    sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: "admin",
    recipientCount: 120,
  },
  {
    id: "notif-seed-002",
    title: "New Feature: Online Consultations Now Available",
    message:
      "We are excited to announce that Online Video Consultations are now live on Schedula! Book a video appointment with your doctor from the comfort of your home. Visit the Doctors section to get started.",
    target: "all_patients",
    category: "announcement",
    status: "sent",
    sentAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: "admin",
    recipientCount: 120,
  },
  {
    id: "notif-seed-003",
    title: "Profile Verification Reminder",
    message:
      "This is a reminder to complete your profile verification on Schedula. Unverified profiles may experience limited access to appointment features. Please upload your credentials via the Doctor Portal.",
    target: "all_doctors",
    category: "reminder",
    status: "sent",
    sentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: "admin",
    recipientCount: 18,
  },
  {
    id: "notif-seed-004",
    title: "Updated Terms of Service",
    message:
      "Our Terms of Service and Privacy Policy have been updated effective 15 Sep 2026. Please review the changes in the Settings section. Continued use of the platform constitutes acceptance of the updated terms.",
    target: "all_patients",
    category: "alert",
    status: "sent",
    sentAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: "admin",
    recipientCount: 238,
  },
  {
    id: "notif-seed-005",
    title: "Special Offer: ₹100 Off Your Next Consultation",
    message:
      "As a thank-you to our loyal patients, we are offering ₹100 off your next consultation booked before 30 Sep 2026. Use code SCHEDULA100 at checkout. Terms and conditions apply.",
    target: "selected_users",
    selectedUsers: ["Priya Sharma", "Arjun Mehta", "Sunita Patel"],
    category: "promotion",
    status: "sent",
    sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: "admin",
    recipientCount: 3,
  },
];

// ─── Slice ─────────────────────────────────────────────────────────────────────

interface AdminNotificationsState {
  notifications: AdminNotification[];
  /** True after the first hydration from localStorage. */
  hydrated: boolean;
}

const initialState: AdminNotificationsState = {
  notifications: [],
  hydrated: false,
};

const adminNotificationsSlice = createSlice({
  name: "adminNotifications",
  initialState,
  reducers: {
    /**
     * Loads persisted notifications from localStorage.
     * Falls back to seed data if no records are found in storage.
     */
    hydrateNotifications: (state) => {
      if (state.hydrated) return;
      const stored = loadFromStorage();
      state.notifications = stored.length > 0 ? stored : SEED_NOTIFICATIONS;
      state.hydrated = true;
      if (stored.length === 0) {
        saveToStorage(state.notifications);
      }
    },

    /**
     * Adds a new notification record, persists to localStorage,
     * AND delivers it into the relevant user/doctor notification queues
     * so it appears in the patient/doctor portal bell dropdowns.
     */
    sendNotification: (state, action: PayloadAction<AdminNotification>) => {
      state.notifications.unshift(action.payload);
      saveToStorage(state.notifications);

      const { id, title, message, target, sentAt } = action.payload;
      const deliveryPayload = { adminNotifId: id, title, message, sentAt };

      if (target === "all_patients" || target === "selected_users") {
        deliverAdminNotificationToPatients(deliveryPayload);
      }
      if (target === "all_doctors" || target === "selected_users") {
        deliverAdminNotificationToDoctors(deliveryPayload);
      }
    },

    /**
     * Removes a notification by ID and persists.
     */
    deleteNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
      saveToStorage(state.notifications);
    },
  },
});

export const {
  hydrateNotifications,
  sendNotification,
  deleteNotification,
} = adminNotificationsSlice.actions;

export default adminNotificationsSlice.reducer;
