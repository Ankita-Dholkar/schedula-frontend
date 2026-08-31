import type { Doctor } from "@/types/doctor";
import type { DoctorUser } from "@/types/user";

// Doctor profile data — used for listing on the patient side
export const doctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Prakash Das",
    specialization: "Sr. Psychologist",
    experience: 7,
    availability: "Available today",
    description: "Dr. Prakash Das practices about 7 years of experience in psychological therapy.",
    availableTime: "08:30 AM - 07:00 PM",
    image: "/doctors/doctor1.png",
  },
  {
    id: "doc-2",
    name: "Dr. Anika Rao",
    specialization: "General Physician",
    experience: 10,
    availability: "Available today",
    description: "Experienced physician providing patient-focused, compassionate primary care.",
    availableTime: "09:00 AM - 06:00 PM",
    image: "/doctors/doctor2.png",
  },
  {
    id: "doc-3",
    name: "Dr. Martin Cole",
    specialization: "Dermatologist",
    experience: 8,
    availability: "Available today",
    description: "Specialized in modern skin and dermatology treatments for all skin types.",
    availableTime: "10:00 AM - 05:00 PM",
    image: "/doctors/doctor3.jpg",
  },
  {
    id: "doc-4",
    name: "Dr. Sarah Wilson",
    specialization: "Cardiologist",
    experience: 12,
    availability: "Available tomorrow",
    description: "Experienced cardiologist focused on heart health and preventive cardiology.",
    availableTime: "09:30 AM - 04:30 PM",
    image: "/doctors/doctor4.jpg",
  },
];

// Doctor auth accounts — used for doctor login/signup
// IDs match the doctor profile IDs above so they can be linked
export const mockDoctors: DoctorUser[] = [
  {
    id: "doc-1",
    name: "Dr. Prakash Das",
    email: "prakash@schedula.com",
    mobile: "9000000001",
    password: "doctor123",
    role: "doctor",
    specialization: "Sr. Psychologist",
    experience: 7,
    licenseNumber: "PSY1001",
  },
  {
    id: "doc-2",
    name: "Dr. Anika Rao",
    email: "anika@schedula.com",
    mobile: "9000000002",
    password: "doctor123",
    role: "doctor",
    specialization: "General Physician",
    experience: 10,
    licenseNumber: "GP2002",
  },
  {
    id: "doc-3",
    name: "Dr. Martin Cole",
    email: "martin@schedula.com",
    mobile: "9000000003",
    password: "doctor123",
    role: "doctor",
    specialization: "Dermatologist",
    experience: 8,
    licenseNumber: "DERM3003",
  },
  {
    id: "doc-4",
    name: "Dr. Sarah Wilson",
    email: "sarah@schedula.com",
    mobile: "9000000004",
    password: "doctor123",
    role: "doctor",
    specialization: "Cardiologist",
    experience: 12,
    licenseNumber: "CARD4004",
  },
];

/**
 * getAllDoctors() — merges static mock doctors with any doctors registered
 * at runtime (stored in localStorage.registeredUsers).
 * Safe to call only inside useEffect / client components.
 */
export function getAllDoctors(): Doctor[] {
  const result: Doctor[] = [...doctors];
  try {
    const stored = localStorage.getItem("registeredUsers");
    if (stored) {
      const users: Array<Record<string, unknown>> = JSON.parse(stored);
      users
        .filter((u) => u.role === "doctor")
        .forEach((u) => {
          const id   = u.id as string;
          const name = u.name as string;
          // Don't add if already in static list
          if (!result.find((d) => d.id === id)) {
            result.push({
              id,
              name,
              specialization: (u.specialization as string) || "General Physician",
              experience: Number(u.experience) || 0,
              availability: "Available",
              description: `${name} is a registered doctor on Schedula.`,
              availableTime: "09:00 AM - 05:00 PM",
              image: "", // no image for new registrations — UI falls back to avatar
            });
          }
        });
    }
  } catch {
    // ignore — just return static list
  }
  return result;
}