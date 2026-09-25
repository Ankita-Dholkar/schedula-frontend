"use client";

import { useState, useEffect, useMemo } from "react";
import { Stethoscope } from "lucide-react";
import type { Doctor } from "@/types/doctor";
import { doctors as staticDoctors, getAllDoctors } from "@/lib/mock-data/doctors";
import { SPECIALTIES } from "@/lib/specialties";
import DoctorSearch from "@/features/doctors/components/DoctorSearch";
import SpecialtyFilter from "@/features/doctors/components/SpecialtyFilter";
import UserPortalHeader from "@/features/user-portal/components/UserPortalHeader";
import UserDoctorCard from "@/features/user-portal/components/UserDoctorCard";
import { EmptyState } from "@/components/ui/StateViews";

export default function UserDoctorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [allDoctors, setAllDoctors] = useState<Doctor[]>(staticDoctors);

  useEffect(() => {
    const loadDoctors = () => setAllDoctors(getAllDoctors());
    loadDoctors();
    window.addEventListener("storage", loadDoctors);
    window.addEventListener("schedula_doctor_updated", loadDoctors);
    return () => {
      window.removeEventListener("storage", loadDoctors);
      window.removeEventListener("schedula_doctor_updated", loadDoctors);
    };
  }, []);

  // Derive specialty list: start with the canonical SPECIALTIES list, then add
  // any extra specializations found in runtime doctor data (e.g. newly registered doctors).
  const specialties = useMemo<string[]>(() => {
    const seen = new Set<string>(SPECIALTIES as unknown as string[]);
    const result: string[] = [...SPECIALTIES];
    allDoctors.forEach((doctor) => {
      if ((doctor.status ?? "active") !== "inactive") {
        const spec = doctor.specialization.trim();
        if (spec && !seen.has(spec)) {
          seen.add(spec);
          result.push(spec);
        }
      }
    });
    return result.sort((a, b) => a.localeCompare(b));
  }, [allDoctors]);

  // Combined filter: status → specialty → text search
  const filteredDoctors = useMemo(() => {
    return allDoctors.filter((doctor) => {
      // Patients only see active doctors
      if ((doctor.status ?? "active") === "inactive") return false;

      // Specialty filter
      if (selectedSpecialty && doctor.specialization.trim() !== selectedSpecialty) {
        return false;
      }

      // Text search: name or specialization
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        doctor.name.toLowerCase().includes(query) ||
        doctor.specialization.toLowerCase().includes(query)
      );
    });
  }, [allDoctors, searchQuery, selectedSpecialty]);

  const hasActiveFilters = searchQuery.trim() !== "" || selectedSpecialty !== "";

  function clearFilters() {
    setSearchQuery("");
    setSelectedSpecialty("");
  }

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

        {/* Filter Bar — stacks vertically on mobile, single row on sm+ */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search input — grows but capped */}
          <div className="w-full max-w-md">
            <DoctorSearch value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Specialty dropdown */}
          <SpecialtyFilter
            specialties={specialties}
            value={selectedSpecialty}
            onChange={setSelectedSpecialty}
          />
        </div>

        {/* Doctor Grid */}
        {filteredDoctors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 items-stretch">
            {filteredDoctors.map((doctor, i) => (
              <UserDoctorCard key={doctor.id} doctor={doctor} priority={i === 0} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--line)] bg-white">
            <EmptyState
              icon={<Stethoscope size={26} />}
              title="No doctors found"
              message={
                hasActiveFilters
                  ? "No doctors match your current filters. Try a different search or specialty."
                  : "No doctors are currently available."
              }
              action={
                hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="
                      rounded-lg
                      border
                      border-[var(--line)]
                      bg-white
                      px-4
                      py-2
                      text-xs
                      font-semibold
                      text-[var(--ink)]
                      transition-all
                      hover:border-[#43BCD5]
                      hover:text-[var(--brand)]
                    "
                  >
                    Clear Filters
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
      </main>
    </>
  );
}
