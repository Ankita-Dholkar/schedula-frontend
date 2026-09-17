"use client";

import { Search, ChevronDown, X } from "lucide-react";

export type FilterOption = {
  label: string;
  value: string;
};

type SearchFilterProps = {
  /** Current search text value */
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  /** Filter dropdown options. Omit to hide the filter. */
  filterOptions?: FilterOption[];
  /** Current selected filter value */
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterPlaceholder?: string;

  className?: string;
};

export default function SearchFilter({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterOptions,
  filterValue = "",
  onFilterChange,
  filterPlaceholder = "All",
  className = "",
}: SearchFilterProps) {
  return (
    <div className={`flex flex-col gap-2 sm:flex-row ${className}`}>
      {/* Search input */}
      <div className="relative flex-1">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 w-full rounded-lg border border-[var(--line)] bg-white pl-9 pr-9 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filter dropdown */}
      {filterOptions && filterOptions.length > 0 && (
        <div className="relative shrink-0">
          <select
            value={filterValue}
            onChange={(e) => onFilterChange?.(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-[var(--line)] bg-white pl-3 pr-8 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] cursor-pointer"
          >
            <option value="">{filterPlaceholder}</option>
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
        </div>
      )}
    </div>
  );
}
