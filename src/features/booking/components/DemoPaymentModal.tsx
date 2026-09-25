"use client";

import { useState } from "react";
import {
  X,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
// Redux dispatches removed — payment persistence handled by caller in the single finalization flow.
import { CONSULTATION_FEE, type PaymentMethod } from "@/types/payment";


// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  appointmentId: string;
  patientId?: string;
  doctorId?: string;
  amount?: number;
  feeLabel?: string;
  onClose: () => void;
  /** Called with the transactionId and selected method after a successful demo payment. */
  onSuccess?: (transactionId: string, method: PaymentMethod) => void;
};

type UiState = "idle" | "processing" | "success" | "failed";
type SimulateOutcome = "success" | "failure";

// ─── Payment Method Config ─────────────────────────────────────────────────────

const METHODS: {
  id: PaymentMethod;
  label: string;
  subLabel: string;
  icon: React.ElementType;
}[] = [
  {
    id: "card",
    label: "Demo Card",
    subLabel: "•••• •••• •••• 4242  ·  Exp 12/28",
    icon: CreditCard,
  },
  {
    id: "upi",
    label: "UPI",
    subLabel: "patient@demoupi",
    icon: Smartphone,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DemoPaymentModal({
  appointmentId,
  patientId,
  doctorId,
  amount,
  feeLabel,
  onClose,
  onSuccess,
}: Props) {
  const displayAmount = amount ?? CONSULTATION_FEE;
  const displayLabel = feeLabel ?? "Consultation Fee";

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [simulate, setSimulate] = useState<SimulateOutcome>("success");
  const [uiState, setUiState] = useState<UiState>("idle");
  const [transactionId, setTransactionId] = useState("");

  const handlePay = async () => {
    setUiState("processing");

    // Generate transactionId upfront
    const txId = `DEMO-${Date.now().toString().slice(-8)}`;

    // Simulate 1.4 s processing delay
    await new Promise<void>((resolve) => setTimeout(resolve, 1400));

    if (simulate === "success") {
      setTransactionId(txId);
      setUiState("success");
      onSuccess?.(txId, selectedMethod);
    } else {
      setUiState("failed");
    }
  };

  return (
    <>
      {/* Backdrop — not clickable while processing */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={uiState === "processing" ? undefined : onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="animate-in w-full max-w-md rounded-2xl border border-[var(--line)] bg-white shadow-2xl">

          {/* ── Header ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                <ShieldCheck size={16} className="text-[var(--brand)]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--ink)]">Payment</h2>
              </div>
            </div>
            {uiState !== "processing" && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-[var(--muted)] transition hover:bg-stone-100 hover:text-[var(--ink)]"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* ── Body ─────────────────────────────────────────────── */}
          <div className="p-6">

            {/* ── Idle ──────────────────────────────────────────── */}
            {uiState === "idle" && (
              <>
                {/* Amount */}
                <div className="mb-6 rounded-xl bg-[var(--canvas)] p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    {displayLabel}
                  </p>
                  <p className="mt-1 text-4xl font-extrabold tracking-tight text-[var(--ink)]">
                    ₹{displayAmount}
                  </p>
                </div>

                {/* Payment method selector */}
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Select Payment Method
                </p>
                <div className="mb-6 space-y-2">
                  {METHODS.map(({ id, label, subLabel, icon: Icon }) => {
                    const active = selectedMethod === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedMethod(id)}
                        className={`flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition ${
                          active
                            ? "border-[var(--brand)] bg-teal-50/60 ring-1 ring-[var(--brand)]"
                            : "border-[var(--line)] hover:border-[var(--brand)]/40 hover:bg-stone-50"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                            active ? "bg-[var(--brand)]" : "bg-stone-100"
                          }`}
                        >
                          <Icon
                            size={16}
                            className={active ? "text-white" : "text-[var(--muted)]"}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold ${
                              active ? "text-[var(--brand)]" : "text-[var(--ink)]"
                            }`}
                          >
                            {label}
                          </p>
                          <p className="truncate text-xs text-[var(--muted)]">{subLabel}</p>
                        </div>
                        {/* Radio indicator */}
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
                            active ? "border-[var(--brand)] bg-[var(--brand)]" : "border-stone-300"
                          }`}
                        >
                          {active && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Simulate outcome toggle */}
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                    Demo Simulation
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSimulate("success")}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        simulate === "success"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "border border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      Simulate Success
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulate("failure")}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        simulate === "failure"
                          ? "bg-red-600 text-white shadow-sm"
                          : "border border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      Simulate Failure
                    </button>
                  </div>
                </div>

                {/* Pay button */}
                <button
                  type="button"
                  onClick={handlePay}
                  className="w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-deep)] active:scale-[0.98]"
                >
                  Pay ₹{displayAmount}
                </button>
              </>
            )}

            {/* ── Processing ────────────────────────────────────── */}
            {uiState === "processing" && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Loader2 size={40} className="animate-spin text-[var(--brand)]" />
                <p className="mt-4 text-base font-semibold text-[var(--ink)]">
                  Processing Payment…
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Please wait, do not close this window.
                </p>
              </div>
            )}

            {/* ── Success ───────────────────────────────────────── */}
            {uiState === "success" && (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 size={36} className="text-emerald-500" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-[var(--ink)]">Payment Successful!</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Your appointment is now confirmed.
                </p>

                <div className="mt-5 w-full space-y-2.5 rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-4 text-left text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Amount Paid</span>
                    <span className="font-bold text-[var(--ink)]">₹{displayAmount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Payment Status</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      Paid
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Appointment</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
                      Confirmed
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--line)] pt-2.5">
                    <span className="text-[var(--muted)]">Transaction ID</span>
                    <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                      {transactionId}
                    </span>
                  </div>
                  <p className="text-center text-[10px] text-[var(--muted)]">
                    Demo Reference — Not a real transaction
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-5 w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-white transition hover:bg-[var(--brand-deep)]"
                >
                  View Appointment
                </button>
              </div>
            )}

            {/* ── Failed ────────────────────────────────────────── */}
            {uiState === "failed" && (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                  <AlertCircle size={36} className="text-red-500" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-[var(--ink)]">Payment Failed</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  The transaction was declined in simulation.
                </p>

                <div className="mt-4 w-full space-y-2 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Payment Status</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-300">
                      Failed
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Appointment</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                      Pending
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Your appointment is still saved. You can retry payment anytime.
                </p>

                <div className="mt-5 flex w-full gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-[var(--line)] py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-stone-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setUiState("idle")}
                    className="flex-1 rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-white transition hover:bg-[var(--brand-deep)]"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
