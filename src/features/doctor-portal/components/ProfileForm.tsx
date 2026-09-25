"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import Toast from "@/features/auth/components/Toast";
import { useAppDispatch } from "@/store/hooks";
import { updateAuthUser } from "@/store/slices/authSlice";
import { refreshDoctors } from "@/store/slices/doctorsSlice";

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
  consultationFee?: string | number;
  checkupFee?: string | number;
};

type Props = {
  initialData: ProfileData;
  doctorId?: string;
};

const inputClass =
  "w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] placeholder:text-stone-400";

const labelClass = "mb-1.5 block text-sm font-medium text-[var(--ink)]";

export default function ProfileForm({ initialData, doctorId }: Props) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<ProfileData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ consultationFee?: string; checkupFee?: string }>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "consultationFee" || name === "checkupFee") {
        const cRaw = name === "consultationFee" ? value.trim() : String(next.consultationFee ?? "").trim();
        const chRaw = name === "checkupFee" ? value.trim() : String(next.checkupFee ?? "").trim();
        const errs: { consultationFee?: string; checkupFee?: string } = {};

        if (!cRaw) {
          errs.consultationFee = "Consultation fee is required.";
        } else if (isNaN(Number(cRaw))) {
          errs.consultationFee = "Must be a numeric value.";
        } else if (Number(cRaw) < 0) {
          errs.consultationFee = "Must be non-negative (₹0 or more).";
        }

        if (!chRaw) {
          errs.checkupFee = "Check-up fee is required.";
        } else if (isNaN(Number(chRaw))) {
          errs.checkupFee = "Must be a numeric value.";
        } else if (Number(chRaw) < 0) {
          errs.checkupFee = "Must be non-negative (₹0 or more).";
        }

        if (!errs.consultationFee && !errs.checkupFee) {
          const cNum = Number(cRaw);
          const chNum = Number(chRaw);
          if (cNum >= chNum) {
            errs.consultationFee = "Consultation fee must be strictly lower than check-up fee.";
            errs.checkupFee = "Check-up fee must be strictly higher than consultation fee.";
          }
        }

        setErrors(errs);
      }

      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.specialization) {
      setToast({ message: "Name, email, and specialization are required.", type: "error" });
      return;
    }

    // Validate fees
    const cRaw = String(form.consultationFee ?? "").trim();
    const chRaw = String(form.checkupFee ?? "").trim();
    const feeErrors: { consultationFee?: string; checkupFee?: string } = {};

    if (!cRaw) {
      feeErrors.consultationFee = "Consultation fee is required.";
    } else if (isNaN(Number(cRaw))) {
      feeErrors.consultationFee = "Consultation fee must be numeric.";
    } else if (Number(cRaw) < 0) {
      feeErrors.consultationFee = "Consultation fee must be non-negative (₹0 or more).";
    }

    if (!chRaw) {
      feeErrors.checkupFee = "Check-up fee is required.";
    } else if (isNaN(Number(chRaw))) {
      feeErrors.checkupFee = "Check-up fee must be numeric.";
    } else if (Number(chRaw) < 0) {
      feeErrors.checkupFee = "Check-up fee must be non-negative (₹0 or more).";
    }

    if (!feeErrors.consultationFee && !feeErrors.checkupFee) {
      const cNum = Number(cRaw);
      const chNum = Number(chRaw);
      if (cNum >= chNum) {
        feeErrors.consultationFee = "Consultation fee must be strictly lower than check-up fee.";
        feeErrors.checkupFee = "Check-up fee must be strictly higher than consultation fee.";
        setErrors(feeErrors);
        setToast({
          message: `Consultation fee (₹${cNum}) must always be lower than Check-up fee (₹${chNum}).`,
          type: "error",
        });
        return;
      }
    }

    if (Object.keys(feeErrors).length > 0) {
      setErrors(feeErrors);
      const firstError = Object.values(feeErrors)[0];
      setToast({ message: firstError, type: "error" });
      return;
    }

    setErrors({});
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));

    try {
      // 1. Update session user in localStorage and Redux
      const stored = localStorage.getItem("loggedInUser");
      let currentId = doctorId;
      if (stored) {
        const user = JSON.parse(stored);
        if (!currentId) currentId = user.id;
        const updatedUser = {
          ...user,
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          consultationFee: Number(form.consultationFee),
          checkupFee: Number(form.checkupFee),
        };
        localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
        dispatch(updateAuthUser({ name: form.name, email: form.email, mobile: form.mobile }));
      }

      // 2. Persist full profile under doctorProfiles[id] and doctorProfiles[name]
      const profilesRaw = localStorage.getItem("doctorProfiles") ?? "{}";
      const profiles = JSON.parse(profilesRaw);
      const profileToSave = {
        ...form,
        consultationFee: Number(form.consultationFee),
        checkupFee: Number(form.checkupFee),
      };
      if (currentId) {
        profiles[currentId] = { ...profiles[currentId], ...profileToSave };
      }
      if (form.name) {
        profiles[form.name] = { ...profiles[form.name], ...profileToSave };
        const clean = form.name.replace(/^dr\.\s*/i, "").trim();
        if (clean) profiles[clean] = { ...profiles[clean], ...profileToSave };
      }
      if (form.email) {
        profiles[form.email] = { ...profiles[form.email], ...profileToSave };
      }
      localStorage.setItem("doctorProfiles", JSON.stringify(profiles));

      // 3. Update registeredUsers if present (keeps signup mock data in sync)
      try {
        const regRaw = localStorage.getItem("registeredUsers");
        if (regRaw) {
          const regUsers: Array<Record<string, unknown>> = JSON.parse(regRaw);
          const idx = regUsers.findIndex((u) => u.id === currentId || u.email === form.email);
          if (idx !== -1) {
            regUsers[idx] = {
              ...regUsers[idx],
              name: form.name,
              email: form.email,
              mobile: form.mobile,
              specialization: form.specialization,
              experience: Number(form.experience) || 0,
              licenseNumber: form.licenseNumber,
              qualification: form.qualification,
              hospitalName: form.hospitalName,
              dob: form.dob,
              gender: form.gender,
              address: form.address,
              city: form.city,
              description: form.description,
              consultationFee: Number(form.consultationFee),
              checkupFee: Number(form.checkupFee),
            };
            localStorage.setItem("registeredUsers", JSON.stringify(regUsers));
          }
        }
      } catch {
        /* ignore */
      }

      // 4. Reload doctors in Redux store
      dispatch(refreshDoctors());

      // 5. Broadcast custom event for other open components/listeners (patient cards, etc.)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("schedula_doctor_updated"));
        window.dispatchEvent(new Event("storage"));
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

        {/* Consultation Fee */}
        <div>
          <label className={labelClass}>
            Consultation Fee (₹) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-[var(--muted)]">₹</span>
            <input
              name="consultationFee"
              type="number"
              min="0"
              step="1"
              value={form.consultationFee ?? ""}
              onChange={handleChange}
              placeholder="e.g. 500"
              className={`w-full rounded-lg border bg-white pl-8 pr-4 py-2.5 text-sm text-[var(--ink)] outline-none transition placeholder:text-stone-400 ${
                errors.consultationFee
                  ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/20"
                  : "border-[var(--line)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
              }`}
            />
          </div>
          {errors.consultationFee ? (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.consultationFee}</p>
          ) : (
            <p className="mt-1 text-[11px] text-[var(--muted)]">Must be strictly lower than check-up fee</p>
          )}
        </div>

        {/* Check-up Fee */}
        <div>
          <label className={labelClass}>
            Check-up Fee (₹) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-[var(--muted)]">₹</span>
            <input
              name="checkupFee"
              type="number"
              min="0"
              step="1"
              value={form.checkupFee ?? ""}
              onChange={handleChange}
              placeholder="e.g. 800"
              className={`w-full rounded-lg border bg-white pl-8 pr-4 py-2.5 text-sm text-[var(--ink)] outline-none transition placeholder:text-stone-400 ${
                errors.checkupFee
                  ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/20"
                  : "border-[var(--line)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
              }`}
            />
          </div>
          {errors.checkupFee ? (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.checkupFee}</p>
          ) : (
            <p className="mt-1 text-[11px] text-[var(--muted)]">Must be strictly higher than consultation fee</p>
          )}
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
