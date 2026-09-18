import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { getAllPrescriptions } from "./prescriptions";
import { getAllPayments } from "./payments";

export const appointments: Appointment[] = [
  // ── Past appointments ────────────────────────────────────────────
  {
    id: "apt-1042",
    patient: { name: "Maya Patel", initials: "MP", age: 34 },
    clinician: "Dr. Anika Rao",
    specialty: "General medicine",
    startsAt: "2026-08-29T09:00:00",
    durationMinutes: 30,
    status: "completed",
    reason: "Follow-up consultation",
    room: "Room 04",
    location: { name: "City Center Clinic", address: "45 MG Road, Shivajinagar, Pune" },
    type: "Follow-up",
    appointmentMode: "in-person",
    prescriptionAvailable: true,
    prescriptionUrl: "#",
    consultationFee: 500,
    paymentStatus: "paid",
    transactionId: "DEMO-10420000",
    paymentMethod: "card",
  },
  {
    id: "apt-1043",
    patient: { name: "Ethan Brooks", initials: "EB", age: 41 },
    clinician: "Dr. Anika Rao",
    specialty: "General medicine",
    startsAt: "2026-08-29T10:00:00",
    durationMinutes: 45,
    status: "missed",
    reason: "Annual wellness visit",
    room: "Room 04",
    location: { name: "City Center Clinic", address: "45 MG Road, Shivajinagar, Pune" },
    type: "Check-up",
    appointmentMode: "in-person",
    consultationFee: 500,
    paymentStatus: "failed",
  },
  {
    id: "apt-1044",
    patient: { name: "Sofia Chen", initials: "SC", age: 28 },
    clinician: "Dr. Martin Cole",
    specialty: "Dermatology",
    startsAt: "2026-08-30T11:15:00",
    durationMinutes: 30,
    status: "completed",
    reason: "Skin consultation",
    type: "Consultation",
    appointmentMode: "online",
    consultationStarted: true,
    prescriptionAvailable: false,
    consultationFee: 500,
    paymentStatus: "paid",
    transactionId: "DEMO-10440000",
    paymentMethod: "upi",
  },
  {
    id: "apt-1045",
    patient: { name: "Noah Williams", initials: "NW", age: 52 },
    clinician: "Dr. Anika Rao",
    specialty: "General medicine",
    startsAt: "2026-08-30T14:00:00",
    durationMinutes: 30,
    status: "cancelled",
    reason: "Blood pressure review",
    room: "Room 04",
    location: { name: "City Center Clinic", address: "45 MG Road, Shivajinagar, Pune" },
    type: "Follow-up",
    appointmentMode: "in-person",
    consultationFee: 500,
    paymentStatus: "failed",
  },
  {
    id: "apt-1046",
    patient: { name: "Priya Sharma", initials: "PS", age: 29 },
    clinician: "Dr. Sarah Wilson",
    specialty: "Cardiology",
    startsAt: "2026-08-31T09:30:00",
    durationMinutes: 45,
    status: "completed",
    reason: "Chest pain evaluation",
    room: "Room 08",
    location: { name: "HeartCare Specialty Hospital", address: "3 Cardiac Avenue, Jubilee Hills, Hyderabad" },
    type: "Urgent",
    appointmentMode: "in-person",
    prescriptionAvailable: true,
    prescriptionUrl: "#",
    consultationFee: 500,
    paymentStatus: "paid",
    transactionId: "DEMO-10460000",
    paymentMethod: "card",
  },
  {
    id: "apt-1047",
    patient: { name: "James Turner", initials: "JT", age: 60 },
    clinician: "Dr. Sarah Wilson",
    specialty: "Cardiology",
    startsAt: "2026-08-31T11:00:00",
    durationMinutes: 30,
    status: "missed",
    reason: "ECG review",
    room: "Room 08",
    location: { name: "HeartCare Specialty Hospital", address: "3 Cardiac Avenue, Jubilee Hills, Hyderabad" },
    type: "Follow-up",
    appointmentMode: "in-person",
    consultationFee: 500,
    paymentStatus: "failed",
  },
  {
    id: "apt-1048",
    patient: { name: "Lena Moore", initials: "LM", age: 35 },
    clinician: "Dr. Prakash Das",
    specialty: "Psychology",
    startsAt: "2026-08-31T10:30:00",
    durationMinutes: 60,
    status: "completed",
    reason: "Therapy session",
    type: "Consultation",
    appointmentMode: "online",
    consultationStarted: true,
    prescriptionAvailable: true,
    prescriptionUrl: "#",
    consultationFee: 500,
    paymentStatus: "paid",
    transactionId: "DEMO-10480000",
    paymentMethod: "upi",
  },
  {
    id: "apt-1049",
    patient: { name: "Ravi Gupta", initials: "RG", age: 45 },
    clinician: "Dr. Martin Cole",
    specialty: "Dermatology",
    startsAt: "2026-08-31T14:30:00",
    durationMinutes: 30,
    status: "cancelled",
    reason: "Acne treatment follow-up",
    room: "Room 02",
    location: { name: "Westside Skin & Aesthetics", address: "88 Hill Road, Bandra West, Mumbai" },
    type: "Follow-up",
    appointmentMode: "in-person",
    consultationFee: 500,
    paymentStatus: "failed",
  },

  // ── Future / upcoming (confirmed + future date) ──────────────────
  {
    id: "apt-1050",
    patient: { name: "Kavya Reddy", initials: "KR", age: 31 },
    clinician: "Dr. Anika Rao",
    specialty: "General medicine",
    startsAt: "2026-09-03T09:30:00",
    durationMinutes: 30,
    status: "confirmed",
    reason: "General check-up",
    room: "Room 04",
    location: { name: "City Center Clinic", address: "45 MG Road, Shivajinagar, Pune" },
    type: "Check-up",
    appointmentMode: "in-person",
    consultationFee: 500,
    paymentStatus: "paid",
    transactionId: "DEMO-10500000",
    paymentMethod: "card",
  },
  {
    id: "apt-1051",
    patient: { name: "Arjun Mehta", initials: "AM", age: 27 },
    clinician: "Dr. Anika Rao",
    specialty: "General medicine",
    startsAt: "2026-09-05T11:00:00",
    durationMinutes: 45,
    status: "confirmed",
    reason: "Fever and fatigue evaluation",
    type: "Consultation",
    appointmentMode: "online",
    consultationFee: 500,
    paymentStatus: "paid",
    transactionId: "DEMO-10510000",
    paymentMethod: "upi",
  },
  {
    id: "apt-1052",
    patient: { name: "Sara Nair", initials: "SN", age: 22 },
    clinician: "Dr. Sarah Wilson",
    specialty: "Cardiology",
    startsAt: "2026-09-04T10:00:00",
    durationMinutes: 30,
    status: "confirmed",
    reason: "Palpitations evaluation",
    room: "Room 08",
    location: { name: "HeartCare Specialty Hospital", address: "3 Cardiac Avenue, Jubilee Hills, Hyderabad" },
    type: "Urgent",
    appointmentMode: "in-person",
    consultationFee: 500,
    paymentStatus: "paid",
    transactionId: "DEMO-10520000",
    paymentMethod: "card",
  },
  {
    id: "apt-1053",
    patient: { name: "David Lin", initials: "DL", age: 48 },
    clinician: "Dr. Prakash Das",
    specialty: "Psychology",
    startsAt: "2026-09-06T14:00:00",
    durationMinutes: 60,
    status: "confirmed",
    reason: "Stress management session",
    type: "Consultation",
    appointmentMode: "online",
    consultationFee: 500,
    paymentStatus: "paid",
    transactionId: "DEMO-10530000",
    paymentMethod: "upi",
  },
  {
    id: "apt-1054",
    patient: { name: "Neha Joshi", initials: "NJ", age: 36 },
    clinician: "Dr. Martin Cole",
    specialty: "Dermatology",
    startsAt: "2026-09-08T09:00:00",
    durationMinutes: 30,
    status: "confirmed",
    reason: "Eczema follow-up",
    room: "Room 02",
    location: { name: "Westside Skin & Aesthetics", address: "88 Hill Road, Bandra West, Mumbai" },
    type: "Follow-up",
    appointmentMode: "in-person",
    consultationFee: 500,
    paymentStatus: "paid",
    transactionId: "DEMO-10540000",
    paymentMethod: "card",
  },

  // ── Pending (awaiting payment + confirmation) ─────────────────────
  {
    id: "apt-1055",
    patient: { name: "Rohan Verma", initials: "RV", age: 19 },
    clinician: "Dr. Anika Rao",
    specialty: "General medicine",
    startsAt: "2026-09-10T10:30:00",
    durationMinutes: 30,
    status: "pending",
    reason: "Sports injury review",
    room: "Room 04",
    location: { name: "City Center Clinic", address: "45 MG Road, Shivajinagar, Pune" },
    type: "Follow-up",
    appointmentMode: "in-person",
    consultationFee: 500,
    paymentStatus: "pending",
  },
  {
    id: "apt-1056",
    patient: { name: "Fatima Hassan", initials: "FH", age: 55 },
    clinician: "Dr. Sarah Wilson",
    specialty: "Cardiology",
    startsAt: "2026-09-11T09:30:00",
    durationMinutes: 45,
    status: "pending",
    reason: "Hypertension management",
    type: "Check-up",
    appointmentMode: "online",
    consultationFee: 500,
    paymentStatus: "pending",
  },
  {
    id: "apt-1057",
    patient: { name: "Tom Bradley", initials: "TB", age: 43 },
    clinician: "Dr. Prakash Das",
    specialty: "Psychology",
    startsAt: "2026-09-12T15:00:00",
    durationMinutes: 60,
    status: "pending",
    reason: "Anxiety initial consultation",
    room: "Room 01",
    location: { name: "Mindwell Wellness Center", address: "12 Serenity Lane, Koramangala, Bengaluru" },
    type: "Consultation",
    appointmentMode: "in-person",
    consultationFee: 500,
    paymentStatus: "pending",
  },
];


// Data helpers




export function getAllAppointments(): Appointment[] {
  let storedAppointments: Appointment[] = [];
  let statuses: Record<string, AppointmentStatus> = {};
  let reschedules: Record<string, { newStartsAt: string; updatedAt: string }> = {};
  let consultationStartedMap: Record<string, boolean> = {};
  try {
    const raw = localStorage.getItem("bookedAppointments");
    if (raw) storedAppointments = JSON.parse(raw);
    const rawStatuses = localStorage.getItem("appointmentStatuses");
    if (rawStatuses) statuses = JSON.parse(rawStatuses);
    const rawReschedules = localStorage.getItem("appointmentReschedules");
    if (rawReschedules) reschedules = JSON.parse(rawReschedules);
    const rawStarted = localStorage.getItem("consultationStarted");
    if (rawStarted) consultationStartedMap = JSON.parse(rawStarted);
  } catch { /* ignore */ }

  const allPrescriptions = getAllPrescriptions();
  const allPayments = getAllPayments();
  const paymentMap = new Map(allPayments.map((p) => [p.appointmentId, p]));
  const all = [...appointments, ...storedAppointments];
  return all.map((apt) => {
    let result = statuses[apt.id] ? { ...apt, status: statuses[apt.id] } : apt;
    if (reschedules[apt.id]) {
      result = { ...result, startsAt: reschedules[apt.id].newStartsAt, updatedAt: reschedules[apt.id].updatedAt };
    }

    // Merge persisted consultationStarted flag (set by startConsultation())
    if (consultationStartedMap[apt.id]) {
      result = { ...result, consultationStarted: true };
    }

    // Check if dynamic prescription exists
    if (allPrescriptions[apt.id]) {
      result = { ...result, prescriptionAvailable: true, prescriptionUrl: "#" };
    } else if (result.status === "completed" && result.prescriptionAvailable === undefined) {
      // Fallback for static mock data
      result = { ...result, prescriptionAvailable: true, prescriptionUrl: "#" };
    }

    // Derive payment fields from the payment record (single source of truth).
    // When a payment record exists, its fields take precedence.
    // Existing mock appointments retain their seeded UI values for backward compatibility.
    const payment = paymentMap.get(apt.id);
    return {
      ...result,
      ...(payment
        ? {
            paymentStatus: payment.status,
            transactionId: payment.transactionId,
            paymentMethod: payment.method,
            consultationFee: payment.amount,
          }
        : {}),
    };
  });
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  try {
    const raw = localStorage.getItem("appointmentStatuses");
    const statuses: Record<string, AppointmentStatus> = raw ? JSON.parse(raw) : {};
    statuses[id] = status;
    localStorage.setItem("appointmentStatuses", JSON.stringify(statuses));
  } catch { /* ignore */ }
}

export function rescheduleAppointment(id: string, newStartsAt: string) {
  try {
    const raw = localStorage.getItem("appointmentReschedules");
    const reschedules: Record<string, { newStartsAt: string; updatedAt: string }> = raw ? JSON.parse(raw) : {};
    reschedules[id] = { newStartsAt, updatedAt: new Date().toISOString() };
    localStorage.setItem("appointmentReschedules", JSON.stringify(reschedules));
  } catch { /* ignore */ }
}

export function saveAppointment(appointment: Appointment) {
  try {
    const raw = localStorage.getItem("bookedAppointments");
    const list: Appointment[] = raw ? JSON.parse(raw) : [];
    list.push(appointment);
    localStorage.setItem("bookedAppointments", JSON.stringify(list));
  } catch { /* ignore */ }
}

//STARTING_SOON window 
const STARTING_SOON_MS = 15 * 60 * 1000; // 15 minutes

export type ComputedStatus = AppointmentStatus | "upcoming" | "starting-soon" | "live";

export function getComputedAppointmentStatus(appointment: Appointment): ComputedStatus {
  // Terminal statuses are never overridden by time.
  if (
    appointment.status === "cancelled" ||
    appointment.status === "completed" ||
    appointment.status === "missed"
  ) {
    return appointment.status;
  }

  const now = Date.now();
  const startsAt = new Date(appointment.startsAt).getTime();
  const endsAt = startsAt + appointment.durationMinutes * 60_000;

  // Appointment is currently live (within the scheduled window)
  if (now >= startsAt && now <= endsAt) {
    // Online: if no one joined and time is up → auto-missed on next check
    // (handled in the live branch — we still show "live" so the join button is shown)
    return "live";
  }

  // Appointment window has passed
  if (now > endsAt) {
    // Online with no one joining → missed
    if (appointment.appointmentMode === "online" && !appointment.consultationStarted) {
      return "missed";
    }
    // In-person or started online → fall through to stored status
    return appointment.status;
  }

  // Appointment hasn't started yet
  if (
    appointment.status === "confirmed" ||
    appointment.status === "pending"
  ) {
    if (startsAt - now <= STARTING_SOON_MS) {
      return "starting-soon";
    }
    return appointment.status === "confirmed" ? "upcoming" : "pending";
  }

  return appointment.status;
}

//Consultation lifecycle helpers

/**
 * Marks an online appointment as started (sets consultationStarted: true).
 * Also updates the raw status to "live" for in-progress tracking.
 */
export function startConsultation(id: string) {
  try {
    // Persist the consultationStarted flag
    const raw = localStorage.getItem("consultationStarted");
    const record: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    record[id] = true;
    localStorage.setItem("consultationStarted", JSON.stringify(record));

    // Also set the stored status to "live" so the Redux layer picks it up
    updateAppointmentStatus(id, "live");
  } catch { /* ignore */ }
}

/**
 * Marks an appointment as completed (called from the consultation screen).
 */
export function endConsultation(id: string) {
  try {
    updateAppointmentStatus(id, "completed");
  } catch { /* ignore */ }
}



export type AppointmentNotification = {
  id: string;
  appointmentId: string;
  patientName: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export function saveNotification(payload: { appointmentId: string; patientName: string; message: string }) {
  try {
    const raw = localStorage.getItem("userNotifications");
    const list: AppointmentNotification[] = raw ? JSON.parse(raw) : [];
    list.push({ ...payload, id: `notif-${Date.now()}`, createdAt: new Date().toISOString(), read: false });
    localStorage.setItem("userNotifications", JSON.stringify(list));
  } catch { /* ignore */ }
}

export function getNotifications(): AppointmentNotification[] {
  try {
    const raw = localStorage.getItem("userNotifications");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function markNotificationRead(id: string) {
  try {
    const raw = localStorage.getItem("userNotifications");
    const list: AppointmentNotification[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem("userNotifications", JSON.stringify(list.map((n) => n.id === id ? { ...n, read: true } : n)));
  } catch { /* ignore */ }
}

export function saveDoctorNotification(payload: { appointmentId: string; patientName: string; message: string; doctorId?: string }) {
  try {
    const raw = localStorage.getItem("doctorNotifications");
    const list: (AppointmentNotification & { doctorId?: string })[] = raw ? JSON.parse(raw) : [];
    list.push({ ...payload, id: `dnotif-${Date.now()}`, createdAt: new Date().toISOString(), read: false });
    localStorage.setItem("doctorNotifications", JSON.stringify(list));
  } catch { /* ignore */ }
}

export function getDoctorNotifications(doctorId?: string): AppointmentNotification[] {
  try {
    const raw = localStorage.getItem("doctorNotifications");
    const list: (AppointmentNotification & { doctorId?: string })[] = raw ? JSON.parse(raw) : [];
    if (doctorId) {
      return list.filter(n => !n.doctorId || n.doctorId === doctorId);
    }
    return list;
  } catch { return []; }
}

export function markDoctorNotificationRead(id: string) {
  try {
    const raw = localStorage.getItem("doctorNotifications");
    const list: AppointmentNotification[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem("doctorNotifications", JSON.stringify(list.map((n) => n.id === id ? { ...n, read: true } : n)));
  } catch { /* ignore */ }
}
