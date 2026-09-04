"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, LogOut, Check } from "lucide-react";
import {
  getDoctorNotifications,
  markDoctorNotificationRead,
  type AppointmentNotification,
} from "@/lib/mock-data/appointments";

type StoredUser = { id: string; name: string; email: string; role: string };

const timeAgo = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function DoctorPortalHeader({ title }: { title: string }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [notifications, setNotifications] = useState<AppointmentNotification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifs = () => {
    setNotifications(getDoctorNotifications().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loggedInUser");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // ignore
    }
    loadNotifs();

    // 1. Sync on window focus
    window.addEventListener("focus", loadNotifs);
    
    // 2. Sync across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "doctorNotifications") loadNotifs();
    };
    window.addEventListener("storage", handleStorage);

    // 3. Fallback polling for same-tab updates
    const intervalId = setInterval(loadNotifs, 3000);

    return () => {
      window.removeEventListener("focus", loadNotifs);
      window.removeEventListener("storage", handleStorage);
      clearInterval(intervalId);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markDoctorNotificationRead(id);
    loadNotifs();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "DR";

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    window.location.href = "/";
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--line)] bg-white px-6">
      {/* Page Title */}
      <h1 className="text-lg font-semibold text-[var(--ink)]">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown((prev) => !prev)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--canvas)] hover:text-[var(--ink)]"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--brand)] ring-2 ring-white" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--canvas)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--ink)]">Notifications</p>
                <span className="text-xs font-medium text-[var(--muted)]">{unreadCount} new</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">No notifications yet.</p>
                ) : (
                  <ul className="divide-y divide-[var(--line)]">
                    {notifications.map((n) => (
                      <li key={n.id} className={`flex gap-3 px-4 py-3 ${n.read ? "bg-white" : "bg-blue-50/40"}`}>
                        <div className="flex-1">
                          <p className={`text-sm ${n.read ? "text-[var(--muted)]" : "font-medium text-[var(--ink)]"}`}>
                            <span className="font-semibold">{n.patientName}</span>: {n.message}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--muted)]">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={(e) => handleMarkRead(n.id, e)}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-[var(--line)]" />

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
          className="ml-2 flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm font-medium text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </header>
  );
}
