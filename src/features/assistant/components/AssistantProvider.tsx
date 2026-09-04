"use client";

import { useState, useEffect, useCallback } from "react";
import type { Role } from "@/types/user";
import AssistantFAB from "./AssistantFAB";
import AssistantWindow from "./AssistantWindow";

interface AssistantProviderProps {
  /** Pass the portal role directly from the layout. Defaults to 'general' for the public homepage. */
  portalRole?: "patient" | "doctor" | "general";
}

export default function AssistantProvider({ portalRole = "general" }: AssistantProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("");

  // Read user name from localStorage (already set by LoginForm)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("loggedInUser");
      if (raw) {
        const user = JSON.parse(raw);
        setUserName(user?.name ?? "");
      }
    } catch {
      // Safe to ignore — name is optional
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <>
      {/* Chat window — rendered with CSS transition, not conditional unmount,
          so the conversation state is preserved when toggling */}
      <div
        aria-hidden={!isOpen}
        className={`transition-all duration-300 ease-out origin-bottom-right
          ${
            isOpen
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none"
          }
        `}
        style={{ position: "fixed", bottom: 0, right: 0, zIndex: 50 }}
      >
        <AssistantWindow role={portalRole} userName={userName} />
      </div>

      {/* FAB — always on top */}
      <AssistantFAB isOpen={isOpen} onClick={toggle} />
    </>
  );
}
