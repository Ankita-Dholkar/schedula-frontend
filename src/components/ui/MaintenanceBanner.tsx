"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

const PLATFORM_SETTINGS_KEY = "schedula_platform_settings";
const DEFAULT_MAINTENANCE_MSG =
  "The platform is currently undergoing scheduled maintenance. Some features and appointment bookings may be temporarily unavailable or delayed.";

export default function MaintenanceBanner() {
  const pathname = usePathname();
  const reduxMaintenance = useAppSelector(
    (s) => s.adminManagement?.platformSettings?.maintenanceMode
  );
  const reduxMessage = useAppSelector(
    (s) => s.adminManagement?.platformSettings?.maintenanceMessage
  );

  const [active, setActive] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MAINTENANCE_MSG);

  const syncState = useCallback(() => {
    try {
      const raw = localStorage.getItem(PLATFORM_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.maintenanceMode === "boolean") {
          setActive(parsed.maintenanceMode);
          if (parsed.maintenanceMessage && parsed.maintenanceMessage.trim()) {
            setMessage(parsed.maintenanceMessage.trim());
          } else {
            setMessage(DEFAULT_MAINTENANCE_MSG);
          }
          return;
        }
      }
    } catch {
      /* ignore */
    }

    if (typeof reduxMaintenance === "boolean") {
      setActive(reduxMaintenance);
      if (reduxMessage && reduxMessage.trim()) {
        setMessage(reduxMessage.trim());
      } else {
        setMessage(DEFAULT_MAINTENANCE_MSG);
      }
    }
  }, [reduxMaintenance, reduxMessage]);

  useEffect(() => {
    syncState();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === PLATFORM_SETTINGS_KEY || !e.key) {
        syncState();
      }
    };

    const handleCustom = () => {
      syncState();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("schedula_platform_settings_changed", handleCustom);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("schedula_platform_settings_changed", handleCustom);
    };
  }, [syncState]);

  // Keep admin portal unobstructed: "Admin portal remains accessible"
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  if (!active) return null;

  return (
    <div
      role="alert"
      id="platform-maintenance-banner"
      className="relative z-50 w-full shrink-0 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-amber-900 shadow-sm transition-all"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle size={16} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-amber-950">
                Scheduled Maintenance:
              </span>
              <span className="text-xs sm:text-sm text-amber-800 leading-snug">
                {message}
              </span>
            </div>
          </div>
        </div>
        <span className="hidden sm:inline-flex shrink-0 items-center rounded-full border border-amber-300/80 bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
          System Notice
        </span>
      </div>
    </div>
  );
}
