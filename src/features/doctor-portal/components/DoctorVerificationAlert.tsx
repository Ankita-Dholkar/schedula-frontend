"use client";

import { useState } from "react";
import { ShieldOff, Clock, X, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { resubmitVerification } from "@/store/slices/doctorsSlice";
import Modal from "@/components/ui/Modal";

type Props = {
  doctorId: string;
  verificationStatus?: "pending" | "approved" | "rejected" | "verified";
  rejectionReason?: string;
};

export default function DoctorVerificationAlert({ doctorId, verificationStatus, rejectionReason }: Props) {
  const dispatch = useAppDispatch();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState("");

  if (!verificationStatus || verificationStatus === "approved" || verificationStatus === "verified") return null;

  const handleResubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    dispatch(resubmitVerification({ id: doctorId }));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setModalOpen(false);
      setSubmitted(false);
      setNotes("");
    }, 2000);
  };

  if (verificationStatus === "pending") {
    return (
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
          <Clock size={16} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-800">Verification Pending</p>
          <p className="mt-0.5 text-xs text-blue-600 leading-relaxed">
            Your documents are currently under review by the Admin team. You will be notified once a decision is made.
          </p>
        </div>
      </div>
    );
  }

  if (verificationStatus === "rejected") {
    return (
      <>
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100">
              <ShieldOff size={16} className="text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-rose-800">Verification Rejected</p>
              {rejectionReason && (
                <div className="mt-1.5 rounded-lg border border-rose-200 bg-white/70 px-3 py-2.5">
                  <p className="text-xs font-medium text-rose-700 uppercase tracking-wide mb-1">Admin Rejection Reason</p>
                  <p className="text-sm text-rose-800 leading-relaxed">{rejectionReason}</p>
                </div>
              )}
              <p className="mt-2 text-xs text-rose-600">
                Please address the issues above and resubmit your verification documents for Admin review.
              </p>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
            >
              <RotateCcw size={13} />
              Resubmit Verification
            </button>
          </div>
        </div>

        {/* Resubmission Modal */}
        <Modal
          open={modalOpen}
          onClose={() => { if (!submitting) { setModalOpen(false); setNotes(""); } }}
          title="Resubmit Verification"
          description="Confirm that you have updated your credentials before resubmitting."
          maxWidth="max-w-md"
          footer={
            submitted ? null : (
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => { setModalOpen(false); setNotes(""); }}
                  disabled={submitting}
                  className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--canvas)] transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-deep)] transition disabled:opacity-60"
                >
                  {submitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  Confirm Resubmission
                </button>
              </div>
            )
          }
        >
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-[var(--ink)]">Resubmission Successful!</p>
              <p className="text-xs text-[var(--muted)] text-center">Your verification status has been reset to Pending Review. The Admin team will review your documents.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rejectionReason && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-0.5">Ensure you have addressed:</p>
                    <p className="text-xs text-amber-700 leading-relaxed">{rejectionReason}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                  Additional Notes <span className="text-[var(--muted)] font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Briefly describe what changes you have made to address the rejection reason…"
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] placeholder:text-stone-400 resize-none"
                />
              </div>
              <p className="text-xs text-[var(--muted)]">
                Clicking <strong>Confirm Resubmission</strong> will notify the admin team that your verification is ready for a second review.
              </p>
            </div>
          )}
        </Modal>
      </>
    );
  }

  return null;
}
