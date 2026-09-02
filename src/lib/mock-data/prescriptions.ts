import type { Prescription } from "@/types/prescription";

const STORAGE_KEY = "doctorPrescriptions";

export function getAllPrescriptions(): Record<string, Prescription> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getPrescription(appointmentId: string): Prescription | null {
  const all = getAllPrescriptions();
  return all[appointmentId] || null;
}

export function savePrescription(prescription: Prescription): void {
  try {
    const all = getAllPrescriptions();
    all[prescription.appointmentId] = prescription;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function updatePrescription(appointmentId: string, updates: Partial<Prescription>): void {
  try {
    const all = getAllPrescriptions();
    if (all[appointmentId]) {
      all[appointmentId] = {
        ...all[appointmentId],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
  } catch {
    // ignore
  }
}
