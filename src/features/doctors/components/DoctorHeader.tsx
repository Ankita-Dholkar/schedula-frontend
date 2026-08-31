"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DoctorHeader() {
  const [userName, setUserName] = useState("User");
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        if (user?.name) {
          setUserName(user.name);
        }
      } catch (error) {
        console.error("Failed to parse user data", error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    router.push("/login");
  };

  const initial = userName.charAt(0).toUpperCase();

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* User Avatar */}
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand)]/10 text-sm font-semibold text-[var(--brand)]">
          {initial}
        </div>

        {/* User Greeting */}
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--ink)] sm:text-[20px]">
            Hello, {userName}
          </h1>

          <p className="mt-0.5 text-xs text-[var(--muted)] sm:text-sm">
            Welcome to Schedula
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification */}
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100 text-[var(--muted)]"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-medium text-white">
            5
          </span>
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-medium text-[var(--ink)] transition hover:bg-gray-50"
        >
          <LogOut size={14} />
          Log Out
        </button>
      </div>
    </header>
  );
}