import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Max number of page buttons to show. Default 5. */
  maxButtons?: number;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxButtons = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build visible page numbers
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);

  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const btn = (
    page: number | "prev" | "next",
    label: React.ReactNode,
    disabled: boolean,
    active = false
  ) => (
    <button
      key={String(page)}
      onClick={() => {
        if (page === "prev") onPageChange(currentPage - 1);
        else if (page === "next") onPageChange(currentPage + 1);
        else onPageChange(page as number);
      }}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      className={`
        inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors
        ${active
          ? "bg-[var(--brand)] text-white shadow-sm"
          : "text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)]"
        }
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
      {btn("prev", <ChevronLeft size={16} />, currentPage === 1)}
      {start > 1 && (
        <>
          {btn(1, "1", false)}
          {start > 2 && <span className="px-1 text-[var(--muted)]">…</span>}
        </>
      )}
      {pages.map((p) => btn(p, String(p), false, p === currentPage))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-[var(--muted)]">…</span>}
          {btn(totalPages, String(totalPages), false)}
        </>
      )}
      {btn("next", <ChevronRight size={16} />, currentPage === totalPages)}
    </div>
  );
}
