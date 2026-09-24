"use client";

import { useRouter } from "next/navigation";
import { ShieldOff, ArrowLeft } from "lucide-react";

export default function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 text-center">
      {/* Icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 mb-6 shadow-sm">
        <ShieldOff size={36} className="text-rose-500" />
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">
        Access Denied
      </h1>
      <p className="text-sm text-[var(--muted)] max-w-sm leading-relaxed mb-1">
        You don&apos;t have permission to view this page.
      </p>
      <p className="text-xs text-[var(--muted)] max-w-sm leading-relaxed mb-8">
        This section is restricted based on your assigned role. If you believe
        this is an error, please contact your Super Administrator.
      </p>

      {/* Role badge */}
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--canvas)] px-4 py-2 text-xs font-medium text-[var(--muted)]">
        <ShieldOff size={13} />
        <span>Error 403 — Forbidden</span>
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push("/admin/dashboard")}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-deep)] transition-colors"
        id="access-denied-back-btn"
      >
        <ArrowLeft size={15} />
        Back to Dashboard
      </button>
    </div>
  );
}
