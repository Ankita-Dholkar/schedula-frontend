"use client";

import { createContext, useContext } from "react";

/** Shared context so portal headers can toggle the layout's mobile sidebar. */
export const SidebarToggleContext = createContext<() => void>(() => {});

export function useSidebarToggle() {
  return useContext(SidebarToggleContext);
}
