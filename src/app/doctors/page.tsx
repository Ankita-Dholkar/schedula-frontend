"use client";

import { useState, useEffect } from "react";
import type { Doctor } from "@/types/doctor";
import { doctors as staticDoctors, getAllDoctors } from "@/lib/mock-data/doctors";
import DoctorHeader from "@/features/doctors/components/DoctorHeader";
import DoctorSearch from "@/features/doctors/components/DoctorSearch";
import DoctorList from "@/features/doctors/components/DoctorList";

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  // Start with static doctors; merge registered doctors after mount (client-only)
  const [allDoctors, setAllDoctors] = useState<Doctor[]>(staticDoctors);

  useEffect(() => {
    setAllDoctors(getAllDoctors());
  }, []);

  const filteredDoctors = allDoctors.filter((doctor) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      doctor.name.toLowerCase().includes(query) ||
      doctor.specialization.toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-[#F8F9FB] px-3 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Logged-in user header */}
        <DoctorHeader />

        {/* Search */}
        <div className="mt-6 w-full sm:max-w-[600px] lg:max-w-[520px]">
          <DoctorSearch value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Doctor Listing */}
        <div className="mt-5">
          {filteredDoctors.length > 0 ? (
            <DoctorList doctors={filteredDoctors} />
          ) : (
            <div className="rounded-xl border border-[#E2E5E9] bg-white py-10 text-center text-sm text-[#8B95A1]">
              No doctors found matching &quot;{searchQuery}&quot;.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}