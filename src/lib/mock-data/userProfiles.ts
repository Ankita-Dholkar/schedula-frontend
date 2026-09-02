import type { UserHealthProfile } from "@/types/userProfile";

const STORAGE_KEY = "userHealthProfiles";

function getAllProfiles(): Record<string, UserHealthProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getUserHealthProfile(userId: string): UserHealthProfile | null {
  const all = getAllProfiles();
  return all[userId] ?? null;
}

export function saveUserHealthProfile(profile: UserHealthProfile): void {
  try {
    const all = getAllProfiles();
    all[profile.userId] = { ...profile, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function getDefaultProfile(userId: string): UserHealthProfile {
  return {
    userId,
    bloodGroup: "",
    height: "",
    weight: "",
    medicalConditions: [],
    allergies: [],
    currentMedications: [],
    insuranceProvider: "",
    insurancePolicyNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    updatedAt: "",
  };
}
