"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, LogOut, ChevronDown, ShieldCheck } from "lucide-react";

type Props = {
  onMenuToggle: () => void;
};

export default function AdminHeader({ onMenuToggle }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Read admin name from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("loggedInUser");
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.name) setAdminName(user.name);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    window.location.href = "/login";
  };

  // Get initials for the avatar
  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--line)] bg-white px-4 shadow-sm lg:px-6">
      {/* Left: Mobile menu toggle + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)] transition-colors lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <ShieldCheck size={16} className="text-[var(--brand)]" />
          <span className="text-sm font-semibold text-[var(--ink)]">Admin Portal</span>
        </div>
      </div>

      {/* Right: Admin profile dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--canvas)]"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
          id="admin-profile-button"
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-white text-xs font-bold shadow-sm">
            {initials}
          </div>
          <span className="hidden text-sm font-medium text-[var(--ink)] sm:block">{adminName}</span>
          <ChevronDown
            size={15}
            className={`text-[var(--muted)] transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--line)] bg-white py-1.5 shadow-lg">
            {/* Admin info */}
            <div className="border-b border-[var(--line)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--ink)]">{adminName}</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">Super Administrator</p>
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                id="admin-logout-button"
              >
                <LogOut size={15} />
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
