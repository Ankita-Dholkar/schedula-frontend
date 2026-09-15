import type { Payment } from "@/types/payment";

const STORAGE_KEY = "schedula_payments";

/**
 * Seed payments for the static mock appointments that ship with the app.
 * These are used as a fallback only when no persisted payment data exists in localStorage.
 */
const seedPayments: Payment[] = [
  // Completed appointments → paid
  {
    id: "pay-1042",
    appointmentId: "apt-1042",
    amount: 500,
    method: "demo-card",
    status: "paid",
    transactionId: "DEMO-10420000",
    createdAt: "2026-08-29T09:00:00.000Z",
    updatedAt: "2026-08-29T09:05:00.000Z",
  },
  {
    id: "pay-1044",
    appointmentId: "apt-1044",
    amount: 500,
    method: "upi",
    status: "paid",
    transactionId: "DEMO-10440000",
    createdAt: "2026-08-30T11:15:00.000Z",
    updatedAt: "2026-08-30T11:20:00.000Z",
  },
  {
    id: "pay-1046",
    appointmentId: "apt-1046",
    amount: 500,
    method: "demo-card",
    status: "paid",
    transactionId: "DEMO-10460000",
    createdAt: "2026-08-31T09:30:00.000Z",
    updatedAt: "2026-08-31T09:35:00.000Z",
  },
  {
    id: "pay-1048",
    appointmentId: "apt-1048",
    amount: 500,
    method: "upi",
    status: "paid",
    transactionId: "DEMO-10480000",
    createdAt: "2026-08-31T10:30:00.000Z",
    updatedAt: "2026-08-31T10:35:00.000Z",
  },
  // Cancelled / missed → failed
  {
    id: "pay-1043",
    appointmentId: "apt-1043",
    amount: 500,
    method: "demo-card",
    status: "failed",
    createdAt: "2026-08-29T10:00:00.000Z",
    updatedAt: "2026-08-29T10:01:00.000Z",
  },
  {
    id: "pay-1045",
    appointmentId: "apt-1045",
    amount: 500,
    method: "demo-card",
    status: "failed",
    createdAt: "2026-08-30T14:00:00.000Z",
    updatedAt: "2026-08-30T14:01:00.000Z",
  },
  {
    id: "pay-1047",
    appointmentId: "apt-1047",
    amount: 500,
    method: "upi",
    status: "failed",
    createdAt: "2026-08-31T11:00:00.000Z",
    updatedAt: "2026-08-31T11:01:00.000Z",
  },
  {
    id: "pay-1049",
    appointmentId: "apt-1049",
    amount: 500,
    method: "demo-card",
    status: "failed",
    createdAt: "2026-08-31T14:30:00.000Z",
    updatedAt: "2026-08-31T14:31:00.000Z",
  },
  // Confirmed / upcoming → paid
  {
    id: "pay-1050",
    appointmentId: "apt-1050",
    amount: 500,
    method: "demo-card",
    status: "paid",
    transactionId: "DEMO-10500000",
    createdAt: "2026-09-03T09:30:00.000Z",
    updatedAt: "2026-09-03T09:32:00.000Z",
  },
  {
    id: "pay-1051",
    appointmentId: "apt-1051",
    amount: 500,
    method: "upi",
    status: "paid",
    transactionId: "DEMO-10510000",
    createdAt: "2026-09-04T11:00:00.000Z",
    updatedAt: "2026-09-04T11:03:00.000Z",
  },
  {
    id: "pay-1052",
    appointmentId: "apt-1052",
    amount: 500,
    method: "demo-card",
    status: "paid",
    transactionId: "DEMO-10520000",
    createdAt: "2026-09-05T09:00:00.000Z",
    updatedAt: "2026-09-05T09:02:00.000Z",
  },
  {
    id: "pay-1053",
    appointmentId: "apt-1053",
    amount: 500,
    method: "upi",
    status: "paid",
    transactionId: "DEMO-10530000",
    createdAt: "2026-09-06T14:00:00.000Z",
    updatedAt: "2026-09-06T14:01:00.000Z",
  },
  {
    id: "pay-1054",
    appointmentId: "apt-1054",
    amount: 500,
    method: "demo-card",
    status: "paid",
    transactionId: "DEMO-10540000",
    createdAt: "2026-09-08T09:00:00.000Z",
    updatedAt: "2026-09-08T09:02:00.000Z",
  },
  // Pending appointments → pending payment
  {
    id: "pay-1055",
    appointmentId: "apt-1055",
    amount: 500,
    method: "demo-card",
    status: "pending",
    createdAt: "2026-09-10T10:30:00.000Z",
  },
  {
    id: "pay-1056",
    appointmentId: "apt-1056",
    amount: 500,
    method: "demo-card",
    status: "pending",
    createdAt: "2026-09-11T09:30:00.000Z",
  },
  {
    id: "pay-1057",
    appointmentId: "apt-1057",
    amount: 500,
    method: "demo-card",
    status: "pending",
    createdAt: "2026-09-12T15:00:00.000Z",
  },
];

/**
 * Reads all payments from localStorage.
 * Falls back to seedPayments when no persisted data exists yet.
 */
export function getAllPayments(): Payment[] {
  if (typeof window === "undefined") return seedPayments;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Payment[];
  } catch {
    /* ignore parse errors */
  }
  return seedPayments;
}

/**
 * Replaces the entire payment collection in localStorage.
 * Called by the Redux persistence layer after any payment action.
 */
export function persistPayments(payments: Payment[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
  } catch {
    /* ignore storage errors */
  }
}
