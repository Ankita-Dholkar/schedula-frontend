export type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed" | "missed";

export type Appointment = {
  id: string;
  patient: { name: string; initials: string; age: number };
  clinician: string;
  specialty: string;
  startsAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string;
  room: string;
  type?: string;
  notes?: string;
  updatedAt?: string;
  prescriptionAvailable?: boolean;
  prescriptionUrl?: string;
};