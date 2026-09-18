"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAdminUser } from "@/store/slices/adminAuthSlice";
import AdminSidebar from "@/features/admin-portal/components/AdminSidebar";
import AdminHeader from "@/features/admin-portal/components/AdminHeader";
import type { AdminUser } from "@/types/user";

const STORAGE_KEY = "loggedInAdmin";

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const adminAuth = useAppSelector((s) => s.adminAuth);

  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // 1. Try to restore admin session from dedicated localStorage key
    let restoredAdmin: AdminUser | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AdminUser;
        // Guard: only accept records with role === "admin"
        if (parsed?.role === "admin" && parsed?.isActive === true) {
          restoredAdmin = parsed;
        }
      }
    } catch {
      /* ignore parse errors */
    }

    if (restoredAdmin) {
      // Hydrate Redux from localStorage if not already set (pure reducer — no localStorage inside)
      if (!adminAuth.isAuthenticated) {
        dispatch(setAdminUser(restoredAdmin));
      }
      setAuthorized(true);
      return;
    }

    // 2. No valid admin session — check if a Patient/Doctor is logged in instead
    // and redirect them to their own portal rather than a blank/error state.
    try {
      const raw = localStorage.getItem("loggedInUser");
      const user = raw ? JSON.parse(raw) : null;

      if (user?.role === "doctor") {
        router.replace("/doctor/dashboard");
        return;
      }
      if (user?.role === "patient") {
        router.replace("/user/doctors");
        return;
      }
    } catch {
      /* ignore */
    }

    // 3. Nobody logged in at all → send to Admin login
    router.replace("/admin/login");
  }, [router, dispatch, adminAuth.isAuthenticated]);

  // Render nothing until the admin session has been validated to avoid UI flash
  if (!authorized) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
      {/* Sidebar */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header */}
        <AdminHeader onMenuToggle={() => setSidebarOpen(true)} />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
