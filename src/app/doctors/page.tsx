"use client";

import { useState, useEffect, useMemo } from "react";
import { Stethoscope } from "lucide-react";
import type { Doctor } from "@/types/doctor";
import { doctors as staticDoctors, getAllDoctors } from "@/lib/mock-data/doctors";
import DoctorHeader from "@/features/doctors/components/DoctorHeader";
import DoctorSearch from "@/features/doctors/components/DoctorSearch";
import SpecialtyFilter from "@/features/doctors/components/SpecialtyFilter";
import DoctorList from "@/features/doctors/components/DoctorList";
import { EmptyState } from "@/components/ui/StateViews";

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  // Start with static doctors; merge registered doctors after mount (client-only)
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

  // Derive sorted, deduplicated specialty list from the active doctor pool.
  // Only includes specialties from active doctors so the list stays relevant.
  const specialties = useMemo<string[]>(() => {
    const seen = new Set<string>();
    const result: string[] = [];
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

  // Combined filter: status → search query → specialty
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
    <main className="min-h-screen bg-[#F8F9FB] px-3 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Logged-in user header */}
        <DoctorHeader />

        {/* Filter Bar — stacks vertically on mobile, single row on sm+ */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search input — grows to fill remaining space */}
          <div className="w-full sm:max-w-[520px]">
            <DoctorSearch value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Specialty dropdown — fixed width on sm+, full width on mobile */}
          <SpecialtyFilter
            specialties={specialties}
            value={selectedSpecialty}
            onChange={setSelectedSpecialty}
          />
        </div>

        {/* Doctor Listing */}
        <div className="mt-5">
          {filteredDoctors.length > 0 ? (
            <DoctorList doctors={filteredDoctors} />
          ) : (
            <div className="rounded-xl border border-[#E2E5E9] bg-white">
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
                        border-[#E2E5E9]
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
        </div>
      </div>
    </main>
  );
}