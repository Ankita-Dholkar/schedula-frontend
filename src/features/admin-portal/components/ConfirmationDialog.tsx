"use client";

import { useState } from "react";
import { AlertTriangle, ShieldCheck, ShieldOff, Power, PowerOff } from "lucide-react";
import Modal from "@/components/ui/Modal";

type Mode = "approve" | "reject" | "activate" | "deactivate";

type Props = {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  doctorName: string;
  onConfirm: (rejectionReason?: string) => void;
  loading?: boolean;
};

const QUICK_REASONS = [
  "Illegible certificate scan — please provide a clear, high-resolution copy",
  "License number is unverifiable with the Medical Council records",
  "Medical Council registration is expired — please submit a renewed certificate",
  "Qualification documents are missing — degree certificate required",
  "Submitted documents belong to a different person — name mismatch detected",
];

const CONFIG: Record<Mode, {
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  confirmLabel: string;
  confirmClass: string;
}> = {
  approve: {
    title: "Approve Verification",
    description: "This will grant the doctor full verified status and display the Verified badge to patients.",
    icon: ShieldCheck,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    confirmLabel: "Approve",
    confirmClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  reject: {
    title: "Reject Verification",
    description: "This will set the doctor's account status to inactive. Please provide a clear reason so the doctor can fix and resubmit their documents.",
    icon: ShieldOff,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    confirmLabel: "Reject",
    confirmClass: "bg-rose-600 hover:bg-rose-700 text-white",
  },
  activate: {
    title: "Activate Doctor Account",
    description: "This will make the doctor visible and bookable to patients again.",
    icon: Power,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    confirmLabel: "Activate",
    confirmClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  deactivate: {
    title: "Deactivate Doctor Account",
    description: "This will hide the doctor from patient search and prevent new bookings. Existing appointments are not affected.",
    icon: PowerOff,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    confirmLabel: "Deactivate",
    confirmClass: "bg-amber-600 hover:bg-amber-700 text-white",
  },
};

export default function ConfirmationDialog({
  open,
  onClose,
  mode,
  doctorName,
  onConfirm,
  loading = false,
}: Props) {
  const [reason, setReason] = useState("");
  const cfg = CONFIG[mode];
  const Icon = cfg.icon;

  const isRejectMode = mode === "reject";
  const reasonTrimmed = reason.trim();
  const canConfirm = !loading && (!isRejectMode || reasonTrimmed.length > 0);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(isRejectMode ? reasonTrimmed : undefined);
  };

  const handleClose = () => {
    if (loading) return;
    setReason("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={cfg.title}
      description={`Doctor: ${doctorName}`}
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${cfg.confirmClass}`}
          >
            {loading && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {cfg.confirmLabel}
          </button>
        </div>
      }
    >
      {/* Icon + description */}
      <div className="flex gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg}`}>
          <Icon size={22} className={cfg.iconColor} />
        </div>
        <div>
          <p className="text-sm text-[var(--muted)] leading-relaxed">{cfg.description}</p>
        </div>
      </div>

      {/* Rejection Reason — only shown in reject mode */}
      {isRejectMode && (
        <div className="mt-5">
          {/* Quick-fill presets */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Quick-fill presets
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="rounded-full border border-[var(--line)] bg-[var(--canvas)] px-2.5 py-1 text-[11px] text-[var(--muted)] hover:border-rose-300 hover:text-rose-700 transition-colors text-left"
              >
                {r.length > 52 ? r.slice(0, 52) + "…" : r}
              </button>
            ))}
          </div>

          <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
            Rejection Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Explain clearly why the verification is being rejected and what the doctor needs to fix before resubmitting…"
            className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-rose-400 focus:ring-1 focus:ring-rose-400 placeholder:text-stone-400 resize-none"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1 text-amber-600">
              <AlertTriangle size={11} />
              The doctor will see this reason and can resubmit
            </span>
            <span>{reason.length}/500</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
