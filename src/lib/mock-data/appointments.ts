import type { Appointment, AppointmentStatus } from "@/types/appointment";

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
    type: "Follow-up",
    prescriptionAvailable: true,
    prescriptionUrl: "#",
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
    type: "Check-up",
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
    room: "Room 12",
    type: "Consultation",
    prescriptionAvailable: false,
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
    type: "Follow-up",
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
    type: "Urgent",
    prescriptionAvailable: true,
    prescriptionUrl: "#",
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
    type: "Follow-up",
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
    room: "Room 02",
    type: "Consultation",
    prescriptionAvailable: true,
    prescriptionUrl: "#",
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
    room: "Room 12",
    type: "Follow-up",
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
    type: "Check-up",
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
    room: "Room 04",
    type: "Consultation",
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
    type: "Urgent",
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
    room: "Room 02",
    type: "Consultation",
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
    room: "Room 12",
    type: "Follow-up",
  },

  // ── Pending (awaiting confirmation) ──────────────────────────────
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
    type: "Follow-up",
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
    room: "Room 08",
    type: "Check-up",
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
    room: "Room 02",
    type: "Consultation",
  },
];


// Data helpers


export function getAllAppointments(): Appointment[] {
  let storedAppointments: Appointment[] = [];
  let statuses: Record<string, AppointmentStatus> = {};
  let reschedules: Record<string, { newStartsAt: string; updatedAt: string }> = {};
  try {
    const raw = localStorage.getItem("bookedAppointments");
    if (raw) storedAppointments = JSON.parse(raw);
    const rawStatuses = localStorage.getItem("appointmentStatuses");
    if (rawStatuses) statuses = JSON.parse(rawStatuses);
    const rawReschedules = localStorage.getItem("appointmentReschedules");
    if (rawReschedules) reschedules = JSON.parse(rawReschedules);
  } catch { /* ignore */ }

  const all = [...appointments, ...storedAppointments];
  return all.map((apt) => {
    let result = statuses[apt.id] ? { ...apt, status: statuses[apt.id] } : apt;
    if (reschedules[apt.id]) {
      result = { ...result, startsAt: reschedules[apt.id].newStartsAt, updatedAt: reschedules[apt.id].updatedAt };
    }
    
    // Dynamically add prescription for any appointment marked as completed at runtime
    if (result.status === "completed" && result.prescriptionAvailable === undefined) {
      result = { ...result, prescriptionAvailable: true, prescriptionUrl: "#" };
    }
    
    return result;
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

export function getComputedAppointmentStatus(appointment: Appointment): AppointmentStatus | "upcoming" {
  if (appointment.status === "confirmed" && new Date(appointment.startsAt).getTime() > Date.now()) {
    return "upcoming";
  }
  return appointment.status;
}

// ─── Notifications ────────────────────────────────────────────────────────────

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