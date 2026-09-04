"use client";

import { useEffect, useState } from "react";
import DoctorPortalHeader from "@/features/doctor-portal/components/DoctorPortalHeader";
import ProfileForm from "@/features/doctor-portal/components/ProfileForm";
import AvailabilityManager from "@/features/doctor-portal/components/AvailabilityManager";
import { mockDoctors, doctors as profileDoctors } from "@/lib/mock-data/doctors";
import { getDoctorAvailability, loadPersistedAvailability } from "@/lib/mock-data/availability";
import type { DoctorAvailability } from "@/types/availability";

type StoredUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

// Shape stored in localStorage.doctorProfiles (set by ProfileForm or signup extras)
type PersistedProfile = {
  name?: string;
  email?: string;
  mobile?: string;
  specialization?: string;
  experience?: string | number;
  licenseNumber?: string;
  description?: string;
  qualification?: string;
  hospitalName?: string;
  dob?: string;
  gender?: string;
  address?: string;
  city?: string;
};

// Shape stored in localStorage.registeredUsers for doctors
type RegisteredDoctor = {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  specialization?: string;
  experience?: number;
  licenseNumber?: string;
  qualification?: string;
  hospitalName?: string;
  dob?: string;
  gender?: string;
  address?: string;
  city?: string;
};

export default function DoctorProfilePage() {
  const [doctorId, setDoctorId] = useState<string>("");
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    mobile: "",
    specialization: "",
    experience: "",
    licenseNumber: "",
    description: "",
    qualification: "",
    hospitalName: "",
    dob: "",
    gender: "",
    address: "",
    city: "",
  });
  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loggedInUser");
      if (!stored) return;

      const user: StoredUser = JSON.parse(stored);
      const id = user.id;
      setDoctorId(id);

      // --- Priority 1: doctorProfiles (saved from ProfileForm edits) ---
      let persisted: PersistedProfile = {};
      try {
        const profilesRaw = localStorage.getItem("doctorProfiles");
        if (profilesRaw) {
          const profiles = JSON.parse(profilesRaw);
          if (profiles[id]) persisted = profiles[id];
        }
      } catch { /* ignore */ }

      // --- Priority 2: registeredUsers (extra fields from signup) ---
      let registered: RegisteredDoctor | null = null;
      try {
        const regRaw = localStorage.getItem("registeredUsers");
        if (regRaw) {
          const regUsers: RegisteredDoctor[] = JSON.parse(regRaw);
          registered = regUsers.find((u) => u.id === id) ?? null;
        }
      } catch { /* ignore */ }

      // --- Priority 3: static mock doctor auth record ---
      const mockDoctor = mockDoctors.find((d) => d.id === id);

      // --- Priority 4: static doctor profile (description etc.) ---
      const doctorProfile = profileDoctors.find(
        (d) => d.id === id || d.name === mockDoctor?.name || d.name === user.name
      );

      // Merge in order: persisted > registered > mock
      setProfileData({
        name:           persisted.name           ?? registered?.name          ?? mockDoctor?.name          ?? user.name,
        email:          persisted.email          ?? registered?.email         ?? mockDoctor?.email         ?? user.email,
        mobile:         persisted.mobile         ?? registered?.mobile        ?? mockDoctor?.mobile        ?? "",
        specialization: persisted.specialization ?? registered?.specialization ?? mockDoctor?.specialization ?? doctorProfile?.specialization ?? "",
        experience:     String(persisted.experience ?? registered?.experience  ?? mockDoctor?.experience  ?? doctorProfile?.experience ?? ""),
        licenseNumber:  persisted.licenseNumber  ?? registered?.licenseNumber ?? mockDoctor?.licenseNumber ?? "",
        description:    persisted.description    ?? doctorProfile?.description ?? "",
        qualification:  persisted.qualification  ?? registered?.qualification ?? "",
        hospitalName:   persisted.hospitalName   ?? registered?.hospitalName  ?? "",
        dob:            persisted.dob            ?? registered?.dob           ?? "",
        gender:         persisted.gender         ?? registered?.gender        ?? "",
        address:        persisted.address        ?? registered?.address       ?? "",
        city:           persisted.city           ?? registered?.city          ?? "",
      });

      // Load availability — persisted first, fallback to mock
      setAvailability(loadPersistedAvailability(id) ?? getDoctorAvailability(id));
    } catch {
      // ignore
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && window.location.hash === "#availability") {
      setTimeout(() => {
        const el = document.getElementById("availability");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <>
        <DoctorPortalHeader title="My Profile" />
        <main className="flex-1 px-6 py-6 space-y-5">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </main>
      </>
    );
  }

  return (
    <>
      <DoctorPortalHeader title="My Profile" />

      <main className="flex-1 px-6 py-6">
        {/* Page heading */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">My Profile</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Manage your personal details and set your weekly appointment availability.
          </p>
        </div>

        <div className="space-y-6">
          {/* Section 1 — Profile Details */}
          <ProfileForm initialData={profileData} doctorId={doctorId} />

          {/* Section 2 — Availability / Slots */}
          {availability && (
            <AvailabilityManager doctorId={doctorId} initialAvailability={availability} />
          )}
        </div>
      </main>
    </>
  );
}
