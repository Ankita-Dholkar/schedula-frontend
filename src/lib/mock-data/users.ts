
import { mockPatients } from "@/lib/mock-data/patients";
import { mockDoctors } from "@/lib/mock-data/doctors";
import type { User } from "@/types/user";

export const mockUsers: User[] = [
  ...mockPatients,
  ...mockDoctors,
];