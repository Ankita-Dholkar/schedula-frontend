export type BadgeVariant =
  | "pending"
  | "verified"
  | "approved"
  | "rejected"
  | "active"
  | "inactive"
  | "completed"
  | "cancelled"
  | "missed"
  | "confirmed"
  | "coming-soon"
  | "live"
  | "default";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  pending:      "bg-amber-50   text-amber-700   border-amber-200",
  verified:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  approved:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected:     "bg-rose-50    text-rose-700    border-rose-200",
  active:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive:     "bg-slate-100  text-slate-500   border-slate-200",
  completed:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  confirmed:    "bg-violet-50  text-violet-700  border-violet-200",
  cancelled:    "bg-red-50     text-red-700     border-red-200",
  missed:       "bg-rose-50    text-rose-700    border-rose-200",
  live:         "bg-green-50   text-green-700   border-green-200",
  "coming-soon":"bg-slate-100  text-slate-500   border-slate-200",
  default:      "bg-gray-100   text-gray-600    border-gray-200",
};

const VARIANT_LABELS: Partial<Record<BadgeVariant, string>> = {
  "coming-soon": "Coming Soon",
};

type BadgeProps = {
  variant: BadgeVariant;
  /** Override the default label derived from the variant key. */
  label?: string;
  /** Optional dot indicator. */
  dot?: boolean;
  className?: string;
};

export default function Badge({ variant, label, dot = false, className = "" }: BadgeProps) {
  const displayLabel = label ?? VARIANT_LABELS[variant] ?? (variant.charAt(0).toUpperCase() + variant.slice(1));
  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles} ${className}`}
    >
      {dot && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      )}
      {displayLabel}
    </span>
  );
}
