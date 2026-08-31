import type { User } from "@/types/user";
import { mockUsers } from "@/lib/mock-data/users";

// Read all registered users from localStorage
const getRegisteredUsers = (): User[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("registeredUsers");
    return stored ? (JSON.parse(stored) as User[]) : [];
  } catch {
    return [];
  }
};

// Save a new user into localStorage registered list
const saveRegisteredUser = (user: User) => {
  const existing = getRegisteredUsers();
  localStorage.setItem("registeredUsers", JSON.stringify([...existing, user]));
};

const seedDoctorAvailability = (doctorId: string) => {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem("doctorAvailability") ?? "{}";
    const all = JSON.parse(stored);
    if (all[doctorId]) return; // already exists — don't overwrite

    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const activeDays = new Set(["Monday", "Wednesday", "Friday"]);

    const generateSlots = (day: string) => {
      const slots = [];
      let current = 9 * 60; // 09:00
      const end    = 17 * 60; // 17:00
      const dur    = 30;
      while (current + dur <= end) {
        const s = `${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}`;
        const e = `${String(Math.floor((current + dur) / 60)).padStart(2, "0")}:${String((current + dur) % 60).padStart(2, "0")}`;
        slots.push({ id: `${doctorId}_${day}_${s}`, start: s, end: e, isBooked: false });
        current += dur;
      }
      return slots;
    };

    all[doctorId] = {
      doctorId,
      schedule: DAYS.map((day) => ({
        day,
        isActive: activeDays.has(day),
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: 30,
        slots: activeDays.has(day) ? generateSlots(day) : [],
      })),
      offDates: [],
    };

    localStorage.setItem("doctorAvailability", JSON.stringify(all));
  } catch {
    // ignore — availability can be configured from profile later
  }
};

export const signup = async (userData: Omit<User, "id"> & Record<string, unknown>) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 900));

  // Check both hardcoded + already registered users for duplicates
  const allUsers: User[] = [...mockUsers, ...getRegisteredUsers()];

  const exists = allUsers.some(
    (u) => u.email === userData.email || u.mobile === userData.mobile
  );

  if (exists) {
    throw new Error("An account with this email or mobile already exists.");
  }

  const newId = `${userData.role === "doctor" ? "doc" : "pat"}-${Date.now()}`;
  const newUser: User = { ...userData, id: newId } as User;

  
  saveRegisteredUser(newUser);

  if (userData.role === "doctor") {
    seedDoctorAvailability(newId);
  }

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  };
};
