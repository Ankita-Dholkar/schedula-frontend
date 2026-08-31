import type { Appointment } from "@/types/appointment";

export const appointments: Appointment[] = [
  {
    id: "apt-1042",
    patient: { name: "Maya Patel", initials: "MP", age: 34 },
    clinician: "Dr. Anika Rao",
    specialty: "General medicine",
    startsAt: "2026-08-31T09:00:00",
    durationMinutes: 30,
    status: "confirmed",
    reason: "Follow-up consultation",
    room: "Room 04",
  },
  {
    id: "apt-1043",
    patient: { name: "Ethan Brooks", initials: "EB", age: 41 },
    clinician: "Dr. Anika Rao",
    specialty: "General medicine",
    startsAt: "2026-08-31T10:00:00",
    durationMinutes: 45,
    status: "pending",
    reason: "Annual wellness visit",
    room: "Room 04",
  },
  {
    id: "apt-1044",
    patient: { name: "Sofia Chen", initials: "SC", age: 28 },
    clinician: "Dr. Martin Cole",
    specialty: "Dermatology",
    startsAt: "2026-08-31T11:15:00",
    durationMinutes: 30,
    status: "confirmed",
    reason: "Skin consultation",
    room: "Room 12",
  },
  {
    id: "apt-1045",
    patient: { name: "Noah Williams", initials: "NW", age: 52 },
    clinician: "Dr. Anika Rao",
    specialty: "General medicine",
    startsAt: "2026-08-31T14:00:00",
    durationMinutes: 30,
    status: "cancelled",
    reason: "Blood pressure review",
    room: "Room 04",
  },
  {
    id: "apt-1046",
    patient: { name: "Priya Sharma", initials: "PS", age: 29 },
    clinician: "Dr. Sarah Wilson",
    specialty: "Cardiology",
    startsAt: "2026-08-31T09:30:00",
    durationMinutes: 45,
    status: "confirmed",
    reason: "Chest pain evaluation",
    room: "Room 08",
  },
  {
    id: "apt-1047",
    patient: { name: "James Turner", initials: "JT", age: 60 },
    clinician: "Dr. Sarah Wilson",
    specialty: "Cardiology",
    startsAt: "2026-08-31T11:00:00",
    durationMinutes: 30,
    status: "pending",
    reason: "ECG review",
    room: "Room 08",
  },
  {
    id: "apt-1048",
    patient: { name: "Lena Moore", initials: "LM", age: 35 },
    clinician: "Dr. Prakash Das",
    specialty: "Psychology",
    startsAt: "2026-08-31T10:30:00",
    durationMinutes: 60,
    status: "confirmed",
    reason: "Therapy session",
    room: "Room 02",
  },
  {
    id: "apt-1049",
    patient: { name: "Ravi Gupta", initials: "RG", age: 45 },
    clinician: "Dr. Martin Cole",
    specialty: "Dermatology",
    startsAt: "2026-08-31T14:30:00",
    durationMinutes: 30,
    status: "pending",
    reason: "Acne treatment follow-up",
    room: "Room 12",
  },
];

// Combine mock appointments with localStorage saved appointments
export function getAllAppointments(): Appointment[] {
  let storedAppointments: Appointment[] = [];
  try {
    const stored = localStorage.getItem("bookedAppointments");
    if (stored) {
      storedAppointments = JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return [...appointments, ...storedAppointments];
}

// Save a new appointment to localStorage
export function saveAppointment(appointment: Appointment) {
  try {
    const stored = localStorage.getItem("bookedAppointments");
    const storedAppointments: Appointment[] = stored ? JSON.parse(stored) : [];
    storedAppointments.push(appointment);
    localStorage.setItem("bookedAppointments", JSON.stringify(storedAppointments));
  } catch {
    // ignore
  }
}