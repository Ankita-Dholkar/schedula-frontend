"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/features/admin-portal/components/AdminSidebar";
import AdminHeader from "@/features/admin-portal/components/AdminHeader";

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("loggedInUser");
      const user = raw ? JSON.parse(raw) : null;

      if (!user) {
        router.replace("/login");
        return;
      }

      if (user.role === "admin") {
        setAuthorized(true);
      } else if (user.role === "doctor") {
        router.replace("/doctor/dashboard");
      } else {
        router.replace("/user/doctors");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

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
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
