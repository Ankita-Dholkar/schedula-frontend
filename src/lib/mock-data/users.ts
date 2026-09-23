
import { mockPatients } from "@/lib/mock-data/patients";
import { mockDoctors } from "@/lib/mock-data/doctors";
import type { AdminUser, User } from "@/types/user";

export const mockAdminUsers: AdminUser[] = [
  {
    id: "admin-001",
    name: "Super Admin",
    email: "admin@schedula.com",
    mobile: "9000000001",
    password: "admin123",
    role: "admin",
    isActive: true,
  },
];

export const mockUsers: User[] = [
  ...mockPatients,
  ...mockDoctors,
  ...mockAdminUsers,
];
