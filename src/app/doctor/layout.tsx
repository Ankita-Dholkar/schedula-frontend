"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DoctorSidebar from "@/features/doctor-portal/components/DoctorSidebar";
import AssistantProvider from "@/features/assistant/components/AssistantProvider";

export default function DoctorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

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

  if (!authorized) return null; // blank screen while redirecting

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
      {/* Fixed Sidebar */}
      <DoctorSidebar />

      {/* Scrollable main content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {children}
      </div>

      {/* Schedula Assistant — Doctor Portal */}
      <AssistantProvider portalRole="doctor" />
    </div>
  );
}
