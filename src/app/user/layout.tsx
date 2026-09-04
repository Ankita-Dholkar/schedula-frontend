"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserSidebar from "@/features/user-portal/components/UserSidebar";
import AssistantProvider from "@/features/assistant/components/AssistantProvider";

export default function UserPortalLayout({
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
      if (!user || user.role !== "patient") {
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
      <UserSidebar />

      {/* Scrollable main content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {children}
      </div>

      {/* Schedula Assistant — Patient Portal */}
      <AssistantProvider portalRole="patient" />
    </div>
  );
}
