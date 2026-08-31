"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import Toast from "@/features/auth/components/Toast";

type ProfileData = {
  name: string;
  email: string;
  mobile: string;
  specialization: string;
  experience: string;
  licenseNumber: string;
  description: string;
  // extra fields from doctor registration
  qualification?: string;
  hospitalName?: string;
  dob?: string;
  gender?: string;
  address?: string;
  city?: string;
};

type Props = {
  initialData: ProfileData;
  doctorId?: string;
};

const inputClass =
  "w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] placeholder:text-stone-400";

const labelClass = "mb-1.5 block text-sm font-medium text-[var(--ink)]";

export default function ProfileForm({ initialData, doctorId }: Props) {
  const [form, setForm] = useState<ProfileData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.specialization) {
      setToast({ message: "Name, email, and specialization are required.", type: "error" });
      return;
    }

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 700));

    try {
      // 1. Update session name
      const stored = localStorage.getItem("loggedInUser");
      if (stored) {
        const user = JSON.parse(stored);
        const id = doctorId ?? user.id;
        localStorage.setItem("loggedInUser", JSON.stringify({ ...user, name: form.name }));

        // 2. Persist full profile under doctorProfiles[id]
        if (id) {
          const profilesRaw = localStorage.getItem("doctorProfiles") ?? "{}";
          const profiles = JSON.parse(profilesRaw);
          profiles[id] = { ...profiles[id], ...form };
          localStorage.setItem("doctorProfiles", JSON.stringify(profiles));
        }
      }
    } catch {
      // ignore
    }

    setIsSaving(false);
    setToast({ message: "Profile updated successfully!", type: "success" });
  };

  return (
    <section className="rounded-xl border border-[var(--line)] bg-white p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[var(--ink)]">Personal &amp; Professional Details</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Update your information visible to patients.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Name */}
        <div>
          <label className={labelClass}>Full Name</label>
          <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Dr. John Doe" className={inputClass} />
        </div>

        {/* Email */}
        <div>
          <label className={labelClass}>Email Address</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="doctor@schedula.com" className={inputClass} />
        </div>

        {/* Mobile */}
        <div>
          <label className={labelClass}>Mobile Number</label>
          <input name="mobile" type="text" value={form.mobile} onChange={handleChange} placeholder="10-digit number" className={inputClass} />
        </div>

        {/* Specialization */}
        <div>
          <label className={labelClass}>Specialization</label>
          <input name="specialization" type="text" value={form.specialization} onChange={handleChange} placeholder="e.g. Cardiologist" className={inputClass} />
        </div>

        {/* Experience */}
        <div>
          <label className={labelClass}>Years of Experience</label>
          <input name="experience" type="number" min="0" value={form.experience} onChange={handleChange} placeholder="e.g. 10" className={inputClass} />
        </div>

        {/* License */}
        <div>
          <label className={labelClass}>License Number</label>
          <input name="licenseNumber" type="text" value={form.licenseNumber} onChange={handleChange} placeholder="e.g. MD12345" className={inputClass} />
        </div>

        {/* Qualification */}
        <div>
          <label className={labelClass}>Qualification</label>
          <input name="qualification" type="text" value={form.qualification ?? ""} onChange={handleChange} placeholder="e.g. MBBS, MD" className={inputClass} />
        </div>

        {/* Hospital */}
        <div>
          <label className={labelClass}>Hospital / Clinic Name</label>
          <input name="hospitalName" type="text" value={form.hospitalName ?? ""} onChange={handleChange} placeholder="e.g. Apollo Hospital" className={inputClass} />
        </div>

        {/* DOB */}
        <div>
          <label className={labelClass}>Date of Birth</label>
          <input name="dob" type="date" value={form.dob ?? ""} onChange={handleChange} className={inputClass} />
        </div>

        {/* Gender */}
        <div>
          <label className={labelClass}>Gender</label>
          <select name="gender" value={form.gender ?? ""} onChange={handleChange} className={inputClass}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        {/* City */}
        <div>
          <label className={labelClass}>City</label>
          <input name="city" type="text" value={form.city ?? ""} onChange={handleChange} placeholder="e.g. Mumbai" className={inputClass} />
        </div>

        {/* Address */}
        <div>
          <label className={labelClass}>Address</label>
          <input name="address" type="text" value={form.address ?? ""} onChange={handleChange} placeholder="Street, building…" className={inputClass} />
        </div>

        {/* Bio */}
        <div className="sm:col-span-2">
          <label className={labelClass}>About / Bio</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Brief description visible to patients on your profile..."
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--brand-deep)] disabled:opacity-70"
        >
          {isSaving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save size={15} />
              Save Profile
            </>
          )}
        </button>
      </div>
    </section>
  );
}
