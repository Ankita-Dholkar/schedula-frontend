"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, ChevronDown, ShieldCheck, User, Settings } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAdminUser } from "@/store/slices/adminAuthSlice";
import { logAdminAction } from "@/store/slices/auditLogsSlice";
import { getAuditActor } from "@/types/auditLog";
import { ROLE_META } from "@/types/admin";
import Link from "next/link";

const STORAGE_KEY = "loggedInAdmin";

type Props = {
  onMenuToggle: () => void;
};

export default function AdminHeader({ onMenuToggle }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentAdmin = useAppSelector((s) => s.adminAuth.admin);

  const adminName = currentAdmin?.name ?? "Admin";
  const adminEmail = currentAdmin?.email ?? "";
  const roleMeta = currentAdmin?.adminRole ? ROLE_META[currentAdmin.adminRole] : null;

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
    if (currentAdmin) {
      dispatch(logAdminAction({
        actor: getAuditActor(currentAdmin),
        action: "ADMIN_LOGOUT",
        entityType: "auth",
        entityId: currentAdmin.id,
        entityName: currentAdmin.name,
        details: `Admin ${currentAdmin.name} logged out.`,
        metadata: { email: currentAdmin.email },
        ipAddress: "127.0.0.1",
        severity: "info",
      }));
    }
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    dispatch(clearAdminUser());
    setDropdownOpen(false);
    router.replace("/admin/login");
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
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-[var(--ink)] leading-tight">{adminName}</p>
            {roleMeta && (
              <p className="text-[10px] text-[var(--muted)] leading-tight">{roleMeta.label}</p>
            )}
          </div>
          <ChevronDown
            size={15}
            className={`text-[var(--muted)] transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--line)] bg-white py-1.5 shadow-lg z-50">
            {/* Admin info */}
            <div className="border-b border-[var(--line)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--ink)]">{adminName}</p>
              <p className="mt-0.5 text-xs text-[var(--muted)] truncate">{adminEmail}</p>
              {roleMeta && (
                <span
                  className={`mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleMeta.badgeColor} ${roleMeta.badgeBorder}`}
                >
                  {roleMeta.label}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="py-1">
              <Link
                href="/admin/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--canvas)]"
                id="admin-header-profile-link"
              >
                <User size={15} className="text-[var(--muted)]" />
                My Profile & Settings
              </Link>
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
