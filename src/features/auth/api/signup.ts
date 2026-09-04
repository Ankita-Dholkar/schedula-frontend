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

    // Start with an empty schedule; doctor fills via the portal calendar
    all[doctorId] = {
      doctorId,
      schedule: [],
      offDates: [],
    };

    localStorage.setItem("doctorAvailability", JSON.stringify(all));
  } catch {
    // ignore — availability can be configured from profile later
  }
};

export const signup = async (userData: Omit<User, "id"> & Record<string, unknown>) => {


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
