import type { AdminUser } from "@/types/user";

export const ADMIN_USERS: AdminUser[] = [
  {
    id: "admin-001",
    name: "Super Admin",
    email: "admin@schedula.com",
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
  {
    id: "admin-003",
    name: "Inactive Admin",
    email: "inactive@schedula.com",
    mobile: "9000000003",
    password: "inactive123",
    role: "admin",
    isActive: false, // Should NOT be able to log in
  },
];
