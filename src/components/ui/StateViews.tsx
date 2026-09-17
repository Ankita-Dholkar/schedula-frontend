import { Loader2, PackageOpen, AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

// ── Loading State ─────────────────────────────────────────────────────────

type LoadingStateProps = {
  message?: string;
  className?: string;
};

export function LoadingState({ message = "Loading...", className = "" }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-[var(--muted)] ${className}`}>
      <Loader2 size={28} className="animate-spin text-[var(--brand)]" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────

type EmptyStateProps = {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title = "Nothing here",
  message = "No data available yet.",
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-center ${className}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--canvas)] text-[var(--muted)]">
        {icon ?? <PackageOpen size={26} />}
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{message}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ── Error State ──────────────────────────────────────────────────────────

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-center ${className}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <AlertTriangle size={26} />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-deep)]"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
