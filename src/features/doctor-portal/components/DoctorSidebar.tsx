"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  User,
  ClipboardList,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",    href: "/doctor/dashboard",    icon: LayoutDashboard },
  { label: "Appointments", href: "/doctor/appointments", icon: CalendarCheck   },
  { label: "Prescriptions",href: "/doctor/prescriptions",icon: ClipboardList   },
  { label: "My Profile",   href: "/doctor/profile",      icon: User            },
];

export default function DoctorSidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    window.location.href = "/";
  };

  return (
    <aside className="flex h-screen w-56 flex-col bg-[var(--brand)]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/15">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
          <span className="font-serif text-lg font-bold text-white">S</span>
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide text-white">Schedula</p>
          <p className="text-[10px] text-white/60 mt-0.5">Doctor Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Doctor navigation">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/15 px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
