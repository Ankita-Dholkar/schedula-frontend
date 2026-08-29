import { mockUsers } from "@/lib/mock-data/users";

type LoginCredentials = {
  emailOrMobile: string;
  password: string;
};

export const login = async ({
  emailOrMobile,
  password,
}: LoginCredentials) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const user = mockUsers.find(
    (user) =>
      (user.email === emailOrMobile ||
        user.mobile === emailOrMobile) &&
      user.password === password
  );

  if (!user) {
    throw new Error("Invalid email/mobile or password");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
};