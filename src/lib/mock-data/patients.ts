import type { PatientUser } from "@/types/user";

// Mock patient accounts — these are used for login/signup auth
export const mockPatients: PatientUser[] = [
  {
    id: "pat-1",
    name: "Alex Smith",
    email: "alex@example.com",
    mobile: "9876543210",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-2",
    name: "Priya Sharma",
    email: "priya@example.com",
    mobile: "9876543212",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-3",
    name: "Maya Patel",
    email: "maya@example.com",
    mobile: "9876543213",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-4",
    name: "Ethan Brooks",
    email: "ethan@example.com",
    mobile: "9876543214",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-5",
    name: "Sofia Chen",
    email: "sofia@example.com",
    mobile: "9876543215",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-6",
    name: "Noah Williams",
    email: "noah@example.com",
    mobile: "9876543216",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-7",
    name: "James Turner",
    email: "james@example.com",
    mobile: "9876543217",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-8",
    name: "Lena Moore",
    email: "lena@example.com",
    mobile: "9876543218",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-9",
    name: "Ravi Gupta",
    email: "ravi@example.com",
    mobile: "9876543219",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-10",
    name: "Kavya Reddy",
    email: "kavya@example.com",
    mobile: "9876543220",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-11",
    name: "Arjun Mehta",
    email: "arjun@example.com",
    mobile: "9876543221",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-12",
    name: "Sara Nair",
    email: "sara@example.com",
    mobile: "9876543222",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-13",
    name: "David Lin",
    email: "david@example.com",
    mobile: "9876543223",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-14",
    name: "Neha Joshi",
    email: "neha@example.com",
    mobile: "9876543224",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-15",
    name: "Rohan Verma",
    email: "rohan@example.com",
    mobile: "9876543225",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-16",
    name: "Fatima Hassan",
    email: "fatima@example.com",
    mobile: "9876543226",
    password: "password123",
    role: "patient",
  },
  {
    id: "pat-17",
    name: "Tom Bradley",
    email: "tom@example.com",
    mobile: "9876543227",
    password: "password123",
    role: "patient",
  },
];

/**
 * getAllPatients() — merges static mock patients with any patients registered
 * at runtime (stored in localStorage.registeredUsers).
 * Ensures only unique registered patient accounts are returned.
 * Safe to call inside useEffect / client components.
 */
export function getAllPatients(): PatientUser[] {
  const result: PatientUser[] = [...mockPatients];
  if (typeof window === "undefined") return result;

  try {
    const stored = localStorage.getItem("registeredUsers");
    if (stored) {
      const users: Array<Record<string, unknown>> = JSON.parse(stored);
      users
        .filter((u) => u.role === "patient")
        .forEach((u) => {
          const id = (u.id as string) || `pat-${u.email}`;
          const email = ((u.email as string) || "").toLowerCase();
          // Ensure unique patient accounts by id and email
          const exists = result.some(
            (p) => p.id === id || (email && p.email.toLowerCase() === email)
          );
          if (!exists) {
            result.push({
              id,
              name: (u.name as string) || "Patient",
              email: (u.email as string) || "",
              mobile: (u.mobile as string) || "",
              password: (u.password as string) || "",
              role: "patient",
            });
          }
        });
    }
  } catch {
    // Return static list if localStorage is unavailable
  }

  return result;
}

