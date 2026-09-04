import type { User } from "@/types/user";
import { mockUsers } from "@/lib/mock-data/users";

type LoginCredentials = {
  emailOrMobile: string;
  password: string;
};

// Read any users registered at runtime from localStorage
const getRegisteredUsers = (): User[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("registeredUsers");
    return stored ? (JSON.parse(stored) as User[]) : [];
  } catch {
    return [];
  }
};

export const login = async ({ emailOrMobile, password }: LoginCredentials) => {



  // Check hardcoded mock users first, then runtime-registered users
  const allUsers: User[] = [...mockUsers, ...getRegisteredUsers()];

  const user = allUsers.find(
    (u) =>
      (u.email === emailOrMobile || u.mobile === emailOrMobile) &&
      u.password === password
  );

  if (!user) {
    throw new Error("Invalid email/mobile or password");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};