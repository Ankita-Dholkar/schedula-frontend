"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DoctorSidebar from "@/features/doctor-portal/components/DoctorSidebar";
import AssistantProvider from "@/features/assistant/components/AssistantProvider";
import { SidebarToggleContext } from "@/store/SidebarToggleContext";

export default function DoctorPortalLayout({
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
      if (!user || user.role !== "doctor") {
        router.replace("/login");
      } else {
        setAuthorized(true);
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  if (!authorized) return null;

  return (
    <SidebarToggleContext.Provider value={() => setSidebarOpen(true)}>
      <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
        {/* Sidebar — drawer on mobile, static on lg+ */}
        <DoctorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Scrollable main content */}
        <div className="flex flex-1 flex-col overflow-y-auto min-w-0">
          {children}
        </div>

        {/* Schedula Assistant — Doctor Portal */}
        <AssistantProvider portalRole="doctor" />
      </div>
    </SidebarToggleContext.Provider>
  );
}
