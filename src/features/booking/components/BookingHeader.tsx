"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BookingHeader() {
  const router = useRouter();

  return (
    <header className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back"
        className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
      >
        <ChevronLeft size={24} />
      </button>

      <h1 className="text-[20px] font-semibold text-[#252525] sm:text-[24px]">
        Book Appointment
      </h1>
    </header>
  );
}