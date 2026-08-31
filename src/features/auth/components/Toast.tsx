"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

type ToastProps = {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number; // auto-dismiss in ms, default 3500
};

export default function Toast({ message, type, onClose, duration = 3500 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-6 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 items-start gap-3 rounded-xl border px-4 py-3.5 shadow-lg transition-all ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <span className="mt-0.5 shrink-0">
        {type === "success" ? (
          <CheckCircle size={18} className="text-emerald-500" />
        ) : (
          <XCircle size={18} className="text-red-500" />
        )}
      </span>
      <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="shrink-0 text-current opacity-50 hover:opacity-100 transition"
      >
        <X size={16} />
      </button>
    </div>
  );
}
