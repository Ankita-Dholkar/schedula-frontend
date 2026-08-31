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
];
