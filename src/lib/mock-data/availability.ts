import type { DoctorAvailability, DaySchedule } from "@/types/availability";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

// Helper: generate slots between startTime and endTime with given duration
export function generateSlots(
  doctorId: string,
  day: string,
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
      id: `${doctorId}_${day}_${s}`,
      start: s,
      end: e,
      isBooked: false,
    });
    current += durationMinutes;
  }
  return slots;
}

// Build a default blank schedule for all 7 days
const buildDefaultSchedule = (doctorId: string): DaySchedule[] =>
  DAYS.map((day) => ({
    day,
    isActive: ["Monday", "Wednesday", "Friday"].includes(day),
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
    slots: ["Monday", "Wednesday", "Friday"].includes(day)
      ? generateSlots(doctorId, day, "09:00", "17:00", 30)
      : [],
  }));

// Exported helper: build a full DoctorAvailability for a brand-new doctor
export function buildDefaultAvailability(doctorId: string): DoctorAvailability {
  return {
    doctorId,
    schedule: buildDefaultSchedule(doctorId),
    offDates: [],
  };
}

// Pre-seeded availability for the 4 demo doctors
export const mockAvailability: DoctorAvailability[] = [
  {
    doctorId: "doc-1",
    schedule: buildDefaultSchedule("doc-1"),
    offDates: [],
  },
  {
    doctorId: "doc-2",
    schedule: buildDefaultSchedule("doc-2"),
    offDates: [],
  },
  {
    doctorId: "doc-3",
    schedule: buildDefaultSchedule("doc-3"),
    offDates: [],
  },
  {
    doctorId: "doc-4",
    schedule: buildDefaultSchedule("doc-4"),
    offDates: [],
  },
];


function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function getDoctorAvailability(doctorId: string): DoctorAvailability {
  const found = mockAvailability.find((a) => a.doctorId === doctorId);
  const base = found
    ? deepClone(found)
    : deepClone({
        doctorId,
        schedule: buildDefaultSchedule(doctorId),
        offDates: [],
      });

  // Auto-heal: if any active day has 0 slots, regenerate from its time settings
  base.schedule = base.schedule.map((s) => {
    if (s.isActive && s.slots.length === 0) {
      return { ...s, slots: generateSlots(doctorId, s.day, s.startTime, s.endTime, s.slotDuration) };
    }
    return s;
  });

  return base;
}

// Save availability for one doctor to localStorage — keyed by doctorId
export function saveDoctorAvailability(updated: DoctorAvailability) {
  try {
    const raw = localStorage.getItem("doctorAvailability");
    // Use || (not ??) so an empty string "" also falls back to "{}"
    // ?? only catches null/undefined — "" would cause JSON.parse("") to throw
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

    const avail: DoctorAvailability = deepClone(all[doctorId]);

    
    const activeDays = avail.schedule.filter((s) => s.isActive);
    const hasSlots    = activeDays.some((d) => d.slots.length > 0);
    if (activeDays.length > 0 && !hasSlots) return null;

    
    avail.schedule = avail.schedule.map((s) => {
      if (s.isActive && s.slots.length === 0) {
        return { ...s, slots: generateSlots(doctorId, s.day, s.startTime, s.endTime, s.slotDuration) };
      }
      return s;
    });

    return avail;
  } catch {
    return null;
  }
}

