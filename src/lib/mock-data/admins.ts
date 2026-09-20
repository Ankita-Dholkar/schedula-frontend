import type { AdminUser } from "@/types/user";

export const ADMIN_USERS: AdminUser[] = [
  {
    id: "admin-001",
    name: "Admin",
    email: "admin123@schedula.com",
    mobile: "9000000001",
    password: "admin123",
    role: "admin",
    isActive: true,
  },
  {
    id: "admin-002",
    name: "Ops Admin",
    email: "ops@schedula.com",
    mobile: "9000000002",
    password: "ops123",
    role: "admin",
    isActive: true,
  },
];
