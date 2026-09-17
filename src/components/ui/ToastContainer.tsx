"use client";

import { useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { removeToast } from "@/store/slices/toastSlice";
import ToastItem from "./Toast";

/**
 * Renders all active toasts from the Redux store in a fixed bottom-right stack.
 * Mount this once at the root layout level.
 */
export default function ToastContainer() {
  const toasts = useAppSelector((s) => s.toast.toasts);
  const dispatch = useAppDispatch();

  const handleClose = useCallback(
    (id: string) => dispatch(removeToast(id)),
    [dispatch]
  );

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 items-end"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={handleClose} />
      ))}
    </div>
  );
}
