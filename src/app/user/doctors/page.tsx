"use client";

import { useState, useEffect } from "react";
import type { Doctor } from "@/types/doctor";
import { doctors as staticDoctors, getAllDoctors } from "@/lib/mock-data/doctors";
import DoctorSearch from "@/features/doctors/components/DoctorSearch";
import UserPortalHeader from "@/features/user-portal/components/UserPortalHeader";
import UserDoctorCard from "@/features/user-portal/components/UserDoctorCard";

export default function UserDoctorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
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
    <>
      <UserPortalHeader title="Find Doctors" />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">Our Specialists</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Browse our top specialists and book your next appointment.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 w-full max-w-md">
          <DoctorSearch value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Doctor Grid */}
        {filteredDoctors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredDoctors.map((doctor, i) => (
              <UserDoctorCard key={doctor.id} doctor={doctor} priority={i === 0} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--line)] bg-white py-14 text-center">
            <p className="font-medium text-[var(--ink)]">No doctors found matching &quot;{searchQuery}&quot;.</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 text-sm font-semibold text-[var(--brand)] hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </main>
    </>
  );
}
