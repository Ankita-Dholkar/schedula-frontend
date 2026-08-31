"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut } from "lucide-react";

type StoredUser = { id: string; name: string; email: string; role: string };

export default function DoctorPortalHeader({ title }: { title: string }) {
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loggedInUser");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "DR";

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    window.location.href = "/login";
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--line)] bg-white px-6">
      {/* Page Title */}
      <h1 className="text-lg font-semibold text-[var(--ink)]">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--canvas)]"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--brand)]" />
        </button>

        {/* Doctor Info */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[var(--ink)] leading-tight">{user?.name ?? "Doctor"}</p>
            <p className="text-xs text-[var(--muted)]">Doctor</p>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-red-50 hover:text-red-500"
          aria-label="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
