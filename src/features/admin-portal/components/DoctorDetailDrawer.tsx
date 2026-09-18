"use client";

import { useState } from "react";
import { X, UserCircle2, Mail, Phone, MapPin, Briefcase, Award, FileText, ShieldCheck, ShieldOff, Power, PowerOff, Calendar, Building2, BadgeCheck } from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { Doctor, DoctorDocument } from "@/types/doctor";
import type { BadgeVariant } from "@/components/ui/Badge";
import DocumentViewerModal from "./DocumentViewerModal";
import ConfirmationDialog from "./ConfirmationDialog";
import { useAppDispatch } from "@/store/hooks";
import { setDoctorVerificationStatus, setDoctorAccountStatus, refreshDoctors } from "@/store/slices/doctorsSlice";

type Props = {
  doctor: Doctor | null;
  open: boolean;
  onClose: () => void;
};

function verificationVariant(status?: Doctor["verificationStatus"]): BadgeVariant {
  if (status === "approved" || status === "verified") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "pending") return "pending";
  return "default";
}

function accountVariant(status?: Doctor["status"]): BadgeVariant {
  return status === "inactive" ? "inactive" : "active";
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--canvas)]">
        <Icon size={13} className="text-[var(--muted)]" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
        <p className="text-sm text-[var(--ink)] break-words">{value}</p>
      </div>
    </div>
  );
}

export default function DoctorDetailDrawer({ doctor, open, onClose }: Props) {
  const dispatch = useAppDispatch();

  const [viewDoc, setViewDoc] = useState<DoctorDocument | null>(null);
  const [dialog, setDialog] = useState<"approve" | "reject" | "activate" | "deactivate" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  if (!open || !doctor) return null;

  const isPending  = doctor.verificationStatus === "pending";
  const isApproved = doctor.verificationStatus === "approved" || doctor.verificationStatus === "verified";
  const isRejected = doctor.verificationStatus === "rejected";
  const isActive   = (doctor.status ?? "active") === "active";

  const handleConfirm = async (reason?: string) => {
    if (!dialog) return;
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // simulate async

    if (dialog === "approve") {
      dispatch(setDoctorVerificationStatus({ id: doctor.id, status: "approved" }));
    } else if (dialog === "reject") {
      dispatch(setDoctorVerificationStatus({ id: doctor.id, status: "rejected", rejectionReason: reason }));
    } else if (dialog === "activate") {
      dispatch(setDoctorAccountStatus({ id: doctor.id, status: "active" }));
    } else if (dialog === "deactivate") {
      dispatch(setDoctorAccountStatus({ id: doctor.id, status: "inactive" }));
    }

    dispatch(refreshDoctors());
    setActionLoading(false);
    setDialog(null);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Doctor details — ${doctor.name}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col bg-white shadow-2xl border-l border-[var(--line)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--ink)]">Doctor Profile</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)] transition-colors"
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Doctor Identity */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 overflow-hidden text-white text-lg font-bold">
              {doctor.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={doctor.image} alt={doctor.name} className="h-full w-full object-cover" />
              ) : (
                doctor.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-[var(--ink)]">{doctor.name}</h3>
                {isApproved && <BadgeCheck size={16} className="text-emerald-600 shrink-0" />}
              </div>
              <p className="text-sm text-[var(--brand)] font-medium">{doctor.specialization}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{doctor.experience} years experience</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge
                  variant={accountVariant(doctor.status)}
                  label={(doctor.status ?? "active").charAt(0).toUpperCase() + (doctor.status ?? "active").slice(1)}
                  dot
                />
                <Badge
                  variant={verificationVariant(doctor.verificationStatus)}
                  label={doctor.verificationStatus === "approved" || doctor.verificationStatus === "verified" ? "Approved" : doctor.verificationStatus === "rejected" ? "Rejected" : "Pending Review"}
                />
              </div>
            </div>
          </div>

          {/* Rejection Reason Alert */}
          {isRejected && doctor.rejectionReason && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-700 mb-1.5">
                <ShieldOff size={12} />
                Rejection Reason
              </p>
              <p className="text-sm text-rose-800 leading-relaxed">{doctor.rejectionReason}</p>
              {doctor.rejectionDate && (
                <p className="mt-1.5 text-xs text-rose-500">
                  Rejected on {new Date(doctor.rejectionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          )}

          {/* Contact Information */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Contact Details</p>
            <div className="space-y-3">
              <InfoRow icon={Mail}    label="Email"   value={doctor.email}  />
              <InfoRow icon={Phone}   label="Mobile"  value={doctor.mobile} />
              <InfoRow icon={MapPin}  label="City"    value={doctor.city}   />
              <InfoRow icon={MapPin}  label="Address" value={doctor.address} />
            </div>
          </section>

          {/* Professional Credentials */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Professional Details</p>
            <div className="space-y-3">
              <InfoRow icon={Award}     label="Qualification"    value={doctor.qualification} />
              <InfoRow icon={Briefcase} label="License Number"   value={doctor.licenseNumber} />
              <InfoRow icon={Building2} label="Hospital / Clinic" value={doctor.hospitalName ?? doctor.clinic?.name} />
              <InfoRow icon={Calendar}  label="Submission Date"  value={doctor.submittedAt ? new Date(doctor.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : undefined} />
            </div>
          </section>

          {/* Submitted Documents */}
          {doctor.documents && doctor.documents.length > 0 && (
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Submitted Documents</p>
              <div className="space-y-2">
                {doctor.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <FileText size={14} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--ink)]">{doc.name}</p>
                        <p className="text-xs text-[var(--muted)]">{doc.fileSize} · {doc.fileName}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewDoc(doc)}
                      className="shrink-0 rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Action Footer */}
        <div className="border-t border-[var(--line)] px-6 py-4 space-y-2">
          {/* Verification actions — shown only if pending or if showing for context */}
          {isPending && (
            <div className="flex gap-2">
              <button
                onClick={() => setDialog("approve")}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                <ShieldCheck size={15} /> Approve
              </button>
              <button
                onClick={() => setDialog("reject")}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
              >
                <ShieldOff size={15} /> Reject
              </button>
            </div>
          )}

          {/* Account status toggle */}
          {isActive ? (
            <button
              onClick={() => setDialog("deactivate")}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <PowerOff size={15} /> Deactivate Account
            </button>
          ) : (
            <button
              disabled={isRejected}
              title={isRejected ? "Cannot activate account while verification is rejected" : undefined}
              onClick={() => setDialog("activate")}
              className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                isRejected
                  ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <Power size={15} /> {isRejected ? "Account Inactive (Application Rejected)" : "Activate Account"}
            </button>
          )}
        </div>
      </aside>

      {/* Nested modals */}
      <DocumentViewerModal
        document={viewDoc}
        doctorName={doctor.name}
        open={!!viewDoc}
        onClose={() => setViewDoc(null)}
      />
      {dialog && (
        <ConfirmationDialog
          open={!!dialog}
          onClose={() => setDialog(null)}
          mode={dialog}
          doctorName={doctor.name}
          onConfirm={handleConfirm}
          loading={actionLoading}
        />
      )}
    </>
  );
}
