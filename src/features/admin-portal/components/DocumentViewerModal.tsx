"use client";

import { ShieldCheck, FileText, Calendar, Building2, Award } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { DoctorDocument } from "@/types/doctor";

type Props = {
  document: DoctorDocument | null;
  doctorName: string;
  open: boolean;
  onClose: () => void;
};

function typeLabel(type: DoctorDocument["type"]) {
  const map: Record<DoctorDocument["type"], string> = {
    license: "Medical License",
    degree: "Degree Certificate",
    id_proof: "Identity Proof",
    other: "Supporting Document",
  };
  return map[type];
}

function typeBg(type: DoctorDocument["type"]) {
  const map: Record<DoctorDocument["type"], string> = {
    license: "bg-blue-50 text-blue-700 border-blue-200",
    degree: "bg-violet-50 text-violet-700 border-violet-200",
    id_proof: "bg-amber-50 text-amber-700 border-amber-200",
    other: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return map[type];
}

export default function DocumentViewerModal({ document, doctorName, open, onClose }: Props) {
  if (!document) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Document Preview"
      description={`${document.name} — ${doctorName}`}
      maxWidth="max-w-2xl"
    >
      {/* Document metadata strip */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${typeBg(document.type)}`}>
          {typeLabel(document.type)}
        </span>
        <span className="text-xs text-[var(--muted)]">{document.fileName}</span>
        <span className="text-xs text-[var(--muted)]">{document.fileSize}</span>
        {document.uploadedAt && (
          <span className="ml-auto flex items-center gap-1 text-xs text-[var(--muted)]">
            <Calendar size={11} />
            Uploaded {new Date(document.uploadedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      {/* ── Simulated Certificate Canvas ─── */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-8 shadow-inner">

        {/* Watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
          <ShieldCheck size={260} strokeWidth={0.5} className="text-slate-800" />
        </div>

        {/* Certificate Header */}
        <div className="relative text-center mb-6">
          <div className="inline-flex items-center justify-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md">
              <ShieldCheck size={24} className="text-white" />
            </div>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700 mb-1">
            {document.issuedBy ?? "Medical Council of India"}
          </p>
          <h2 className="text-xl font-bold text-slate-800">
            {document.name}
          </h2>
          <div className="mt-2 mx-auto h-0.5 w-24 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
        </div>

        {/* Main Certificate Body */}
        <div className="relative space-y-4">
          <p className="text-center text-sm text-slate-500 italic">
            This is to certify that
          </p>

          <div className="rounded-xl border border-slate-200 bg-white/80 px-6 py-4 text-center shadow-sm backdrop-blur-sm">
            <p className="text-2xl font-bold text-slate-800">{doctorName}</p>
            <p className="mt-1 text-sm text-slate-500">
              {document.type === "license"
                ? "is duly registered as a Medical Practitioner"
                : `holds the qualification recognized by ${document.issuedBy ?? "the issuing authority"}`}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {document.certificateNumber && (
              <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {document.type === "license" ? "Registration Number" : "Certificate Number"}
                </p>
                <p className="text-sm font-bold text-slate-800 font-mono">{document.certificateNumber}</p>
              </div>
            )}
            {document.validUntil && (
              <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Validity
                </p>
                <p className="text-sm font-semibold text-slate-800">{document.validUntil}</p>
              </div>
            )}
            {document.issuedBy && (
              <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Issued By
                </p>
                <div className="flex items-center gap-1.5">
                  <Building2 size={11} className="text-slate-400 shrink-0" />
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{document.issuedBy}</p>
                </div>
              </div>
            )}
            {document.uploadedAt && (
              <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Date of Upload
                </p>
                <div className="flex items-center gap-1.5">
                  <Calendar size={11} className="text-slate-400 shrink-0" />
                  <p className="text-sm font-semibold text-slate-800">
                    {new Date(document.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Certificate Footer */}
        <div className="relative mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileText size={12} />
            <span>Verification Document — Schedula Admin Portal</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
            <Award size={10} />
            Official Document
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-[var(--muted)]">
        This is a simulated preview for demo purposes. In production, the actual PDF would be rendered here.
      </p>
    </Modal>
  );
}
