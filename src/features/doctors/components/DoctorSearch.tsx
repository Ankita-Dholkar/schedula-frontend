"use client";

import { Search } from "lucide-react";

type DoctorSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function DoctorSearch({
  value,
  onChange,
}: DoctorSearchProps) {
  return (
    <div className="relative w-full">
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA0A8]"
      />

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search Doctors"
        className="
          h-11
          w-full
          rounded-xl
          border
          border-[#E2E5E9]
          bg-white
          pl-11
          pr-4
          text-sm
          text-[#252525]
          outline-none
          transition-all
          placeholder:text-[#A7ADB7]
          focus:border-[#43BCD5]
          focus:ring-2
          focus:ring-[#43BCD5]/10
          sm:h-12
        "
      />
    </div>
  );
}