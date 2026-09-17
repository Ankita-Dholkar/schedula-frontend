"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import type { Toast, ToastVariant } from "@/store/slices/toastSlice";

const VARIANT_STYLES: Record<ToastVariant, { bar: string; icon: React.ElementType; iconClass: string; bg: string; border: string }> = {
  success: { bar: "bg-emerald-500", icon: CheckCircle2,    iconClass: "text-emerald-500", bg: "bg-white", border: "border-emerald-100" },
  error:   { bar: "bg-red-500",     icon: XCircle,         iconClass: "text-red-500",     bg: "bg-white", border: "border-red-100"     },
  warning: { bar: "bg-amber-400",   icon: AlertTriangle,   iconClass: "text-amber-500",   bg: "bg-white", border: "border-amber-100"   },
  info:    { bar: "bg-blue-500",    icon: Info,            iconClass: "text-blue-500",    bg: "bg-white", border: "border-blue-100"    },
};

type ToastProps = {
  toast: Toast;
  onClose: (id: string) => void;
  /** Duration in ms before auto-dismiss. Default 4000. */
  duration?: number;
};

export default function ToastItem({ toast, onClose, duration = 4000 }: ToastProps) {
  const cfg = VARIANT_STYLES[toast.variant];
  const Icon = cfg.icon;

  // Auto-dismiss timer — managed at UI level, not inside Redux
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, onClose, duration]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        flex w-80 items-start gap-3 overflow-hidden rounded-xl border
        ${cfg.bg} ${cfg.border} shadow-lg
        animate-in
      `}
    >
      {/* Accent bar */}
      <div className={`w-1 shrink-0 self-stretch ${cfg.bar} rounded-l-xl`} />

      {/* Icon */}
      <div className="pt-3.5 shrink-0">
        <Icon size={18} className={cfg.iconClass} />
      </div>

      {/* Message */}
      <p className="flex-1 py-3.5 text-sm font-medium text-[var(--ink)] leading-snug pr-1">
        {toast.message}
      </p>

      {/* Close */}
      <button
        onClick={() => onClose(toast.id)}
        className="mr-2 mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--muted)] hover:bg-gray-100 hover:text-[var(--ink)] transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={13} />
      </button>
    </div>
  );
}
