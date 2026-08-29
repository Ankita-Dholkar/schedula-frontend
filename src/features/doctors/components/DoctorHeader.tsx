"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export default function DoctorHeader() {
  const [userName, setUserName] = useState("User");

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

  const initial = userName.charAt(0).toUpperCase();

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* User Avatar */}
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F4E2E2] text-sm font-semibold text-[#252525]">
          {initial}
        </div>

        {/* User Greeting */}
        <div>
          <h1 className="text-[18px] font-semibold text-[#252525] sm:text-[20px]">
            Hello, {userName}
          </h1>

          <p className="mt-0.5 text-xs text-[#7B8494] sm:text-sm">
            Welcome to Schedula
          </p>
        </div>
      </div>

      {/* Notification */}
      <button
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-[#252525]" />

        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF5A5F] text-[9px] font-medium text-white">
          5
        </span>
      </button>
    </header>
  );
}