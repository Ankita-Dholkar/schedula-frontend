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
    method: "card",
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
    method: "card",
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
    amount: 750,
    method: "card",
    status: "failed",
    createdAt: "2026-08-29T10:00:00.000Z",
    updatedAt: "2026-08-29T10:01:00.000Z",
  },
  {
    id: "pay-1045",
    appointmentId: "apt-1045",
    amount: 500,
    method: "card",
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
    method: "card",
    status: "failed",
    createdAt: "2026-08-31T14:30:00.000Z",
    updatedAt: "2026-08-31T14:31:00.000Z",
  },
  // Confirmed / upcoming → paid
  {
    id: "pay-1050",
    appointmentId: "apt-1050",
    amount: 750,
    method: "card",
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
    method: "card",
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
    method: "card",
    status: "paid",
    transactionId: "DEMO-10540000",
    createdAt: "2026-09-08T09:00:00.000Z",
    updatedAt: "2026-09-08T09:02:00.000Z",
  },
  {
    id: "pay-1055",
    appointmentId: "apt-1055",
    amount: 500,
    method: "card",
    status: "pending",
    createdAt: "2026-09-10T10:30:00.000Z",
  },
  {
    id: "pay-1056",
    appointmentId: "apt-1056",
    amount: 1200,
    method: "card",
    status: "pending",
    createdAt: "2026-09-11T09:30:00.000Z",
  },
  {
    id: "pay-1057",
    appointmentId: "apt-1057",
    amount: 500,
    method: "card",
    status: "pending",
    createdAt: "2026-09-12T15:00:00.000Z",
  },
  // Refunded payments — patient-cancelled confirmed appointments
  {
    id: "pay-1058",
    appointmentId: "apt-1042",
    amount: 500,
    method: "card",
    status: "refunded",
    transactionId: "DEMO-10420001",
    createdAt: "2026-08-29T09:00:00.000Z",
    updatedAt: "2026-09-01T11:20:00.000Z",
    refundId: "REFUND-58291001",
    refundAmount: 500,
    refundReason: "Patient requested cancellation before appointment",
    refundedAt: "2026-09-01T11:20:00.000Z",
  },
  {
    id: "pay-1059",
    appointmentId: "apt-1044",
    amount: 500,
    method: "upi",
    status: "refunded",
    transactionId: "DEMO-10440001",
    createdAt: "2026-08-30T11:15:00.000Z",
    updatedAt: "2026-09-03T09:05:00.000Z",
    refundId: "REFUND-58301002",
    refundAmount: 500,
    refundReason: "Doctor unavailable — appointment cancelled by clinic",
    refundedAt: "2026-09-03T09:05:00.000Z",
  },
  {
    id: "pay-1060",
    appointmentId: "apt-1050",
    amount: 750,
    method: "card",
    status: "refunded",
    transactionId: "DEMO-10500001",
    createdAt: "2026-09-03T09:30:00.000Z",
    updatedAt: "2026-09-10T14:45:00.000Z",
    refundId: "REFUND-59031003",
    refundAmount: 750,
    refundReason: "Patient rescheduled and duplicate payment identified",
    refundedAt: "2026-09-10T14:45:00.000Z",
  },
];

/**
 * Reads all payments from localStorage.
 * Falls back to seedPayments when no persisted data exists yet.
 */
export function getAllPayments(): Payment[] {
  let list = seedPayments;
  if (typeof window === "undefined") return seedPayments;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) list = JSON.parse(raw) as Payment[];
  } catch {
    /* ignore parse errors */
  }

  // Reconcile stored payments with latest appointment fees and seed updates
  try {
    const bookedRaw = localStorage.getItem("bookedAppointments");
    const bookedList: Array<{ id: string; consultationFee?: number }> = bookedRaw
      ? JSON.parse(bookedRaw)
      : [];
    const bookedMap = new Map(bookedList.map((b) => [b.id, b]));

    let hasChanges = false;
    list = list.map((p) => {
      // 1. Reconcile with patient-booked appointment fees
      const booked = bookedMap.get(p.appointmentId);
      if (booked && typeof booked.consultationFee === "number" && booked.consultationFee > 0) {
        if (p.amount !== booked.consultationFee) {
          hasChanges = true;
          return { ...p, amount: booked.consultationFee };
        }
      }

      // 2. Reconcile with seed payments (e.g. check-up payments updated from 500 default)
      const seed = seedPayments.find((s) => s.id === p.id);
      if (seed && p.amount === 500 && seed.amount !== 500) {
        hasChanges = true;
        return {
          ...p,
          amount: seed.amount,
          ...(p.refundAmount !== undefined ? { refundAmount: seed.refundAmount ?? seed.amount } : {}),
        };
      }

      return p;
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  } catch {
    /* ignore */
  }

  return list;
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
