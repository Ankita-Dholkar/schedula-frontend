"use client";

import { useEffect, useState, useRef } from "react";
import { LogOut, Bell, Check } from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  type AppointmentNotification,
} from "@/lib/mock-data/appointments";

type Props = {
  title: string;
};

type StoredUser = { id: string; name: string; email: string; role: string };

const timeAgo = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function UserPortalHeader({ title }: Props) {
  const [userName, setUserName] = useState<string>("");
  const [notifications, setNotifications] = useState<AppointmentNotification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifs = () => {
    setNotifications(getNotifications().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => {
    const stored = localStorage.getItem("loggedInUser");
    if (stored) {
      setUserName(JSON.parse(stored).name);
    }
    loadNotifs();
    window.addEventListener("focus", loadNotifs);
    return () => window.removeEventListener("focus", loadNotifs);
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

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    window.location.href = "/login";
  };

  const handleMarkRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markNotificationRead(id);
    loadNotifs();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--line)] bg-white px-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)]">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-stone-100 hover:text-[var(--ink)]"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white" />
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
                            {n.message}
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

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <span className="text-sm font-medium text-[var(--ink)] hidden sm:block">
            {userName || "User"}
          </span>
          <button
            onClick={handleLogout}
            className="ml-1 rounded p-1.5 text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
