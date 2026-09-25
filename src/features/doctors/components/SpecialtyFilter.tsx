"use client";

import { ChevronDown, X } from "lucide-react";

type SpecialtyFilterProps = {
  /** Sorted, deduplicated specialty values derived from the doctor data. */
  specialties: string[];
  /** Currently selected specialty, or "" for "All Specialties". */
  value: string;
  onChange: (value: string) => void;
};

export default function SpecialtyFilter({
  specialties,
  value,
  onChange,
}: SpecialtyFilterProps) {
  const hasSelection = value !== "";

  return (
    <div className="relative w-full sm:w-auto sm:min-w-[200px] sm:max-w-[240px]">
      {/* The actual native <select> — invisible but fully interactive */}
      <select
        id="specialty-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          h-11
          w-full
          cursor-pointer
          appearance-none
          rounded-xl
          border
          border-[#E2E5E9]
          bg-white
          pl-4
          pr-9
          text-sm
          text-[#252525]
          outline-none
          transition-all
          focus:border-[#43BCD5]
          focus:ring-2
          focus:ring-[#43BCD5]/10
          sm:h-12
        "
        aria-label="Filter by specialty"
      >
        <option value="">All Specialties</option>
        {specialties.map((spec) => (
          <option key={spec} value={spec}>
            {spec}
          </option>
        ))}
      </select>

      {/* Right-side icon: show X (clear) when a specialty is selected, else chevron */}
      {hasSelection ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear specialty filter"
          className="
            pointer-events-auto
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            rounded-full
            p-0.5
            text-[#9AA0A8]
            transition-colors
            hover:bg-gray-100
            hover:text-[#252525]
          "
        >
          <X size={15} />
        </button>
      ) : (
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA0A8]"
        />
      )}
    </div>
  );
}
