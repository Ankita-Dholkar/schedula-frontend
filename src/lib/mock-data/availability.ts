import type { DoctorAvailability, DateSchedule } from "@/types/availability";

// Helper: generate slots between startTime and endTime with given duration
export function generateSlots(
  doctorId: string,
  date: string,
  startTime: string,
  endTime: string,
  durationMinutes: number
) {
  const slots = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;

  while (current + durationMinutes <= end) {
    const s = `${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}`;
    const e = `${String(Math.floor((current + durationMinutes) / 60)).padStart(2, "0")}:${String((current + durationMinutes) % 60).padStart(2, "0")}`;
    slots.push({
      id: `${doctorId}_${date}_${s}`,
      start: s,
      end: e,
      isBooked: false,
    });
    current += durationMinutes;
  }
  return slots;
}

// Exported helper: build a full DoctorAvailability for a brand-new doctor — starts empty
export function buildDefaultAvailability(doctorId: string): DoctorAvailability {
  return {
    doctorId,
    schedule: [], // doctors add dates manually via calendar
    offDates: [],
  };
}


// Doctors configure their own dates via the portal
export const mockAvailability: DoctorAvailability[] = [
  { doctorId: "doc-1", schedule: [], offDates: [] },
  { doctorId: "doc-2", schedule: [], offDates: [] },
  { doctorId: "doc-3", schedule: [], offDates: [] },
  { doctorId: "doc-4", schedule: [], offDates: [] },
];


function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function getDoctorAvailability(doctorId: string): DoctorAvailability {
  const found = mockAvailability.find((a) => a.doctorId === doctorId);
  // Return a clean empty schedule — doctor fills it via the portal
  return found ? deepClone(found) : { doctorId, schedule: [], offDates: [] };
}

// Save availability for one doctor to localStorage — keyed by doctorId
export function saveDoctorAvailability(updated: DoctorAvailability) {
  try {
    const raw = localStorage.getItem("doctorAvailability");
    
    let all: Record<string, DoctorAvailability> = {};
    if (raw) {
      try {
        all = JSON.parse(raw);
      } catch {
        all = {}; // corrupted / invalid JSON — start fresh
      }
    }
    all[updated.doctorId] = updated;
    localStorage.setItem("doctorAvailability", JSON.stringify(all));
  } catch {
    // ignore storage quota / access errors
  }
}


export function loadPersistedAvailability(doctorId: string): DoctorAvailability | null {
  try {
    const stored = localStorage.getItem("doctorAvailability");
    if (!stored) return null;
    const all = JSON.parse(stored);
    if (!all[doctorId]) return null;
    // Return exactly what the doctor saved — no auto-healing or pre-filling
    return deepClone(all[doctorId]);
  } catch {
    return null;
  }
}

