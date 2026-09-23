"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  UserCheck,
  CalendarDays,
  CreditCard,
  Star,
  Bell,
  BarChart2,
  ShieldCheck,
  ClipboardList,
  Settings,
  LogOut,
  X,
  Stethoscope,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAdminUser } from "@/store/slices/adminAuthSlice";
import { selectAllReviewsForAdmin } from "@/store/slices/reviewsSlice";
import { useMemo } from "react";

const STORAGE_KEY = "loggedInAdmin";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  implemented: boolean;
};

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, implemented: true },
      { label: "Analytics",  href: "/admin/analytics",  icon: TrendingUp,     implemented: true  },
    ],
  },
  {
    title: "Users",
    items: [
      { label: "Doctors",             href: "/admin/doctors",              icon: Stethoscope, implemented: true  },
      { label: "Doctor Verification", href: "/admin/doctor-verification",  icon: UserCheck,   implemented: true  },
      { label: "Patients",            href: "/admin/patients",             icon: Users,       implemented: true  },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Appointments", href: "/admin/appointments", icon: CalendarDays, implemented: true  },
      { label: "Payments", href: "/admin/payments", icon: CreditCard, implemented: true },
      { label: "Reviews", href: "/admin/reviews", icon: Star, implemented: true },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Notifications", href: "/admin/notifications", icon: Bell, implemented: true },
      { label: "Reports", href: "/admin/reports", icon: BarChart2, implemented: true },
      { label: "Admin Users", href: "/admin/admin-users", icon: ShieldCheck, implemented: false },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList, implemented: true },
      { label: "Settings", href: "/admin/settings", icon: Settings, implemented: false },
    ],
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AdminSidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Pending verification count for the sidebar badge
  const doctors = useAppSelector((s) => s.doctors.doctors);
  const pendingCount = useMemo(() => doctors.filter((d) => d.verificationStatus === "pending").length, [doctors]);

  // Reported reviews count for the sidebar badge
  const allReviews = useAppSelector(selectAllReviewsForAdmin);
  const reportedReviewsCount = useMemo(
    () => allReviews.filter((r) => r.isReported && !r.isHidden).length,
    [allReviews]
  );

  const handleLogout = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    dispatch(clearAdminUser());
    onClose();
    router.replace("/admin/login");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          bg-slate-900 border-r border-slate-800
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:w-60 lg:translate-x-0 lg:transition-none
        `}
        aria-label="Admin navigation"
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] shadow-lg">
              <span className="font-serif text-lg font-bold text-white">S</span>
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-white">Schedula</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wider">Admin Portal</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(({ label, href, icon: Icon, implemented }) => {
                  const isActive = pathname === href;
                  if (!implemented) {
                    return (
                      <li key={href}>
                        <div
                          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 cursor-not-allowed select-none"
                          title="Coming Soon"
                        >
                          <span className="flex items-center gap-3">
                            <Icon size={17} strokeWidth={1.8} />
                            {label}
                          </span>
                          <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                            Soon
                          </span>
                        </div>
                      </li>
                    );
                  }
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-[var(--brand)] text-white shadow-sm"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                        <span className="flex-1">{label}</span>
                        {/* Live pending count badge — only on Doctor Verification */}
                        {href === "/admin/doctor-verification" && pendingCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-white leading-none">
                            {pendingCount}
                          </span>
                        )}
                        {/* Reported reviews badge — only on Reviews */}
                        {href === "/admin/reviews" && reportedReviewsCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white leading-none">
                            {reportedReviewsCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );

                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-800 px-3 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
          >
            <LogOut size={17} strokeWidth={1.8} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
