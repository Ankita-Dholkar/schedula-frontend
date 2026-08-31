"use client";

import { signup } from "@/features/auth/api/signup";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, User, Stethoscope, Phone, Lock, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import type { Role } from "@/types/user";
import Link from "next/link";
import Toast from "@/features/auth/components/Toast";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type DoctorStep = 1 | 2 | 3 | 4;

interface DoctorForm {
  // Step 1 — Personal
  name: string;
  dob: string;
  gender: string;
  // Step 2 — Professional
  specialization: string;
  experience: string;
  licenseNumber: string;
  qualification: string;
  hospitalName: string;
  // Step 3 — Contact
  email: string;
  mobile: string;
  address: string;
  city: string;
  // Step 4 — Account
  password: string;
  confirmPassword: string;
}

interface PatientForm {
  name: string;
  email: string;
  mobile: string;
  password: string;
}

type DoctorErrors = Partial<Record<keyof DoctorForm, string>>;
type PatientErrors = Partial<Record<keyof PatientForm, string>>;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const inputClass = (error?: string) =>
  `w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] placeholder:text-stone-400 ${
    error ? "border-red-400" : "border-[var(--line)]"
  }`;

const labelClass = "mb-1.5 block text-sm font-medium text-[var(--ink)]";

const STEPS: { title: string; subtitle: string; icon: React.ElementType }[] = [
  { title: "Personal Details",     subtitle: "Basic personal information",       icon: User },
  { title: "Professional Info",    subtitle: "Qualifications & experience",       icon: Stethoscope },
  { title: "Contact Details",      subtitle: "How patients can reach you",        icon: Phone },
  { title: "Account Security",     subtitle: "Set your login credentials",        icon: Lock },
];

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function SignupForm() {
  const [role, setRole] = useState<Role>("patient");
  const [step, setStep] = useState<DoctorStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [toast, setToast]               = useState<{ message: string; type: "success" | "error" } | null>(null);

  /* ── Doctor form state ── */
  const [doctorForm, setDoctorForm] = useState<DoctorForm>({
    name: "", dob: "", gender: "",
    specialization: "", experience: "", licenseNumber: "", qualification: "", hospitalName: "",
    email: "", mobile: "", address: "", city: "",
    password: "", confirmPassword: "",
  });
  const [doctorErrors, setDoctorErrors] = useState<DoctorErrors>({});

  /* ── Patient form state ── */
  const [patientForm, setPatientForm] = useState<PatientForm>({ name: "", email: "", mobile: "", password: "" });
  const [patientErrors, setPatientErrors] = useState<PatientErrors>({});
  const [patShowPassword, setPatShowPassword] = useState(false);

  /* ─── Handlers ── */
  const handleDoctorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDoctorForm(prev => ({ ...prev, [name]: value }));
    if (doctorErrors[name as keyof DoctorForm]) {
      setDoctorErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPatientForm(prev => ({ ...prev, [name]: value }));
    if (patientErrors[name as keyof PatientForm]) {
      setPatientErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  /* ─── Validation per step ── */
  const validateStep = (s: DoctorStep): boolean => {
    const errs: DoctorErrors = {};
    let ok = true;

    if (s === 1) {
      if (!doctorForm.name.trim())    { errs.name   = "Full name is required"; ok = false; }
      if (!doctorForm.dob)            { errs.dob    = "Date of birth is required"; ok = false; }
      if (!doctorForm.gender)         { errs.gender = "Please select a gender"; ok = false; }
    }

    if (s === 2) {
      if (!doctorForm.specialization.trim()) { errs.specialization = "Specialization is required"; ok = false; }
      if (!doctorForm.qualification.trim())  { errs.qualification  = "Qualification is required"; ok = false; }
      if (!doctorForm.licenseNumber.trim())  { errs.licenseNumber  = "License number is required"; ok = false; }
      if (!doctorForm.experience || Number(doctorForm.experience) < 0) { errs.experience = "Enter valid years of experience"; ok = false; }
      if (!doctorForm.hospitalName.trim())   { errs.hospitalName   = "Hospital / Clinic name is required"; ok = false; }
    }

    if (s === 3) {
      if (!doctorForm.email.includes("@"))         { errs.email  = "Please enter a valid email"; ok = false; }
      if (!/^[0-9]{10}$/.test(doctorForm.mobile))  { errs.mobile = "Enter a valid 10-digit mobile number"; ok = false; }
      if (!doctorForm.city.trim())                 { errs.city   = "City is required"; ok = false; }
    }

    if (s === 4) {
      if (doctorForm.password.length < 6)                           { errs.password        = "Password must be at least 6 characters"; ok = false; }
      if (doctorForm.confirmPassword !== doctorForm.password)       { errs.confirmPassword = "Passwords do not match"; ok = false; }
    }

    setDoctorErrors(errs);
    return ok;
  };

  const validatePatient = (): boolean => {
    const errs: PatientErrors = {};
    let ok = true;
    if (!patientForm.name.trim())                        { errs.name     = "Full name is required"; ok = false; }
    if (!patientForm.email.includes("@"))                { errs.email    = "Please enter a valid email"; ok = false; }
    if (!/^[0-9]{10}$/.test(patientForm.mobile))         { errs.mobile   = "Enter a valid 10-digit mobile number"; ok = false; }
    if (patientForm.password.length < 6)                 { errs.password = "Password must be at least 6 characters"; ok = false; }
    setPatientErrors(errs);
    return ok;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(prev => (prev < 4 ? (prev + 1) as DoctorStep : prev));
  };

  const handleBack = () => setStep(prev => (prev > 1 ? (prev - 1) as DoctorStep : prev));

  /* ─── Submit ── */
  const handleDoctorSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    setIsLoading(true);
    try {
      const userData = {
        name: doctorForm.name,
        email: doctorForm.email,
        mobile: doctorForm.mobile,
        password: doctorForm.password,
        role: "doctor" as const,
        specialization: doctorForm.specialization,
        experience: Number(doctorForm.experience),
        licenseNumber: doctorForm.licenseNumber,
        // extra profile fields stored in profile
        dob: doctorForm.dob,
        gender: doctorForm.gender,
        qualification: doctorForm.qualification,
        hospitalName: doctorForm.hospitalName,
        address: doctorForm.address,
        city: doctorForm.city,
      };
      const user = await signup(userData as any);
      setToast({ message: "Account created! Redirecting to login…", type: "success" });
      setTimeout(() => {
        window.location.href = `/login?email=${encodeURIComponent(user.email)}`;
      }, 1800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed. Please try again.";
      setToast({ message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validatePatient()) return;
    setIsLoading(true);
    try {
      const user = await signup({ ...patientForm, role: "patient" } as any);
      setToast({ message: "Account created! Redirecting to login…", type: "success" });
      setTimeout(() => {
        window.location.href = `/login?email=${encodeURIComponent(user.email)}`;
      }, 1800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed. Please try again.";
      setToast({ message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Step content ── */
  const renderDoctorStep = () => {
    switch (step) {
      /* ── Step 1: Personal ── */
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
              <input name="name" type="text" value={doctorForm.name} onChange={handleDoctorChange}
                placeholder="e.g. Dr. Priya Sharma" className={inputClass(doctorErrors.name)} />
              {doctorErrors.name && <p className="mt-1 text-xs text-red-500">{doctorErrors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                <input name="dob" type="date" value={doctorForm.dob} onChange={handleDoctorChange}
                  className={inputClass(doctorErrors.dob)} />
                {doctorErrors.dob && <p className="mt-1 text-xs text-red-500">{doctorErrors.dob}</p>}
              </div>
              <div>
                <label className={labelClass}>Gender <span className="text-red-500">*</span></label>
                <select name="gender" value={doctorForm.gender} onChange={handleDoctorChange}
                  className={inputClass(doctorErrors.gender)}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {doctorErrors.gender && <p className="mt-1 text-xs text-red-500">{doctorErrors.gender}</p>}
              </div>
            </div>
          </div>
        );

      /* ── Step 2: Professional ── */
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Specialization <span className="text-red-500">*</span></label>
                <input name="specialization" type="text" value={doctorForm.specialization} onChange={handleDoctorChange}
                  placeholder="e.g. Cardiologist" className={inputClass(doctorErrors.specialization)} />
                {doctorErrors.specialization && <p className="mt-1 text-xs text-red-500">{doctorErrors.specialization}</p>}
              </div>
              <div>
                <label className={labelClass}>Qualification <span className="text-red-500">*</span></label>
                <input name="qualification" type="text" value={doctorForm.qualification} onChange={handleDoctorChange}
                  placeholder="e.g. MBBS, MD" className={inputClass(doctorErrors.qualification)} />
                {doctorErrors.qualification && <p className="mt-1 text-xs text-red-500">{doctorErrors.qualification}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Years of Experience <span className="text-red-500">*</span></label>
                <input name="experience" type="number" min="0" value={doctorForm.experience} onChange={handleDoctorChange}
                  placeholder="e.g. 5" className={inputClass(doctorErrors.experience)} />
                {doctorErrors.experience && <p className="mt-1 text-xs text-red-500">{doctorErrors.experience}</p>}
              </div>
              <div>
                <label className={labelClass}>License Number <span className="text-red-500">*</span></label>
                <input name="licenseNumber" type="text" value={doctorForm.licenseNumber} onChange={handleDoctorChange}
                  placeholder="e.g. MCI-12345" className={inputClass(doctorErrors.licenseNumber)} />
                {doctorErrors.licenseNumber && <p className="mt-1 text-xs text-red-500">{doctorErrors.licenseNumber}</p>}
              </div>
            </div>
            <div>
              <label className={labelClass}>Hospital / Clinic Name <span className="text-red-500">*</span></label>
              <input name="hospitalName" type="text" value={doctorForm.hospitalName} onChange={handleDoctorChange}
                placeholder="e.g. Apollo Hospital" className={inputClass(doctorErrors.hospitalName)} />
              {doctorErrors.hospitalName && <p className="mt-1 text-xs text-red-500">{doctorErrors.hospitalName}</p>}
            </div>
          </div>
        );

      /* ── Step 3: Contact ── */
      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
                <input name="email" type="email" value={doctorForm.email} onChange={handleDoctorChange}
                  placeholder="doctor@example.com" className={inputClass(doctorErrors.email)} />
                {doctorErrors.email && <p className="mt-1 text-xs text-red-500">{doctorErrors.email}</p>}
              </div>
              <div>
                <label className={labelClass}>Mobile Number <span className="text-red-500">*</span></label>
                <input name="mobile" type="text" value={doctorForm.mobile} onChange={handleDoctorChange}
                  placeholder="10-digit number" className={inputClass(doctorErrors.mobile)} />
                {doctorErrors.mobile && <p className="mt-1 text-xs text-red-500">{doctorErrors.mobile}</p>}
              </div>
            </div>
            <div>
              <label className={labelClass}>Address <span className="text-[var(--muted)] font-normal text-xs">(optional)</span></label>
              <input name="address" type="text" value={doctorForm.address} onChange={handleDoctorChange}
                placeholder="Street, building…" className={inputClass()} />
            </div>
            <div>
              <label className={labelClass}>City <span className="text-red-500">*</span></label>
              <input name="city" type="text" value={doctorForm.city} onChange={handleDoctorChange}
                placeholder="e.g. Mumbai" className={inputClass(doctorErrors.city)} />
              {doctorErrors.city && <p className="mt-1 text-xs text-red-500">{doctorErrors.city}</p>}
            </div>
          </div>
        );

      /* ── Step 4: Account ── */
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input name="password" type={showPassword ? "text" : "password"}
                  value={doctorForm.password} onChange={handleDoctorChange}
                  placeholder="Min. 6 characters" className={inputClass(doctorErrors.password)} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {doctorErrors.password && <p className="mt-1 text-xs text-red-500">{doctorErrors.password}</p>}
            </div>
            <div>
              <label className={labelClass}>Confirm Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input name="confirmPassword" type={showConfirm ? "text" : "password"}
                  value={doctorForm.confirmPassword} onChange={handleDoctorChange}
                  placeholder="Re-enter password" className={inputClass(doctorErrors.confirmPassword)} />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                  aria-label={showConfirm ? "Hide password" : "Show password"}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {doctorErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{doctorErrors.confirmPassword}</p>}
            </div>
            {/* Summary */}
            <div className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-4 text-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Registration Summary</p>
              <div className="space-y-1 text-[var(--ink)]">
                <p><span className="text-[var(--muted)]">Name:</span> {doctorForm.name || "—"}</p>
                <p><span className="text-[var(--muted)]">Specialization:</span> {doctorForm.specialization || "—"}</p>
                <p><span className="text-[var(--muted)]">Email:</span> {doctorForm.email || "—"}</p>
                <p><span className="text-[var(--muted)]">Mobile:</span> {doctorForm.mobile || "—"}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  /* ─── Render ── */
  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-10 flex items-start justify-center sm:items-center">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full max-w-[520px]">
        {/* Brand */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)] shadow-sm">
            <span className="text-[22px] font-serif font-semibold text-white">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-[var(--ink)]">SCHEDULA</h1>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Clinic Operations</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-[var(--line)]">
          <div>
            <h2 className="text-[22px] font-semibold text-[var(--ink)]">Create an account</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Join as a patient or a doctor.</p>
          </div>

          {/* Role Toggle */}
          <div className="mt-5 flex rounded-lg bg-[var(--canvas)] p-1 border border-[var(--line)]">
            {(["patient", "doctor"] as Role[]).map((r) => (
              <button key={r} type="button"
                className={`flex-1 rounded-md py-2 text-sm font-medium transition capitalize ${
                  role === r
                    ? "bg-white text-[var(--brand)] shadow-sm border border-[var(--line)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
                onClick={() => { setRole(r); setStep(1); }}>
                {r === "patient" ? "I am a Patient" : "I am a Doctor"}
              </button>
            ))}
          </div>

          {/* ══ DOCTOR MULTI-STEP ══ */}
          {role === "doctor" ? (
            <>
              {/* Step Progress */}
              <div className="mt-6">
                <div className="flex items-center">
                  {STEPS.map((s, i) => {
                    const n = (i + 1) as DoctorStep;
                    const done = n < step;
                    const active = n === step;
                    return (
                      <div key={n} className="flex flex-1 items-center">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                          done   ? "bg-[var(--brand)] text-white"
                          : active ? "bg-[var(--brand)] text-white ring-4 ring-teal-100"
                          : "bg-[var(--canvas)] border border-[var(--line)] text-[var(--muted)]"
                        }`}>
                          {done ? <CheckCircle2 size={14} /> : n}
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`h-0.5 flex-1 transition ${done ? "bg-[var(--brand)]" : "bg-[var(--line)]"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3">
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    Step {step} of 4 — {STEPS[step - 1].title}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{STEPS[step - 1].subtitle}</p>
                </div>
              </div>

              {/* Step Content */}
              <form onSubmit={handleDoctorSubmit} className="mt-5">
                {renderDoctorStep()}

                {/* Navigation */}
                <div className="mt-6 flex items-center justify-between gap-3">
                  {step > 1 ? (
                    <button type="button" onClick={handleBack}
                      className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]">
                      <ChevronLeft size={16} /> Back
                    </button>
                  ) : <div />}

                  {step < 4 ? (
                    <button type="button" onClick={handleNext}
                      className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--brand-deep)]">
                      Next <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button type="submit" disabled={isLoading}
                      className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--brand-deep)] disabled:opacity-70">
                      {isLoading ? (
                        <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating…</>
                      ) : (
                        <><CheckCircle2 size={16} /> Create Account</>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : (
            /* ══ PATIENT SIMPLE FORM ══ */
            <form onSubmit={handlePatientSubmit} className="mt-6 space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input name="name" type="text" value={patientForm.name} onChange={handlePatientChange}
                  placeholder="e.g. Alex Smith" className={inputClass(patientErrors.name)} />
                {patientErrors.name && <p className="mt-1 text-xs text-red-500">{patientErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Email</label>
                  <input name="email" type="email" value={patientForm.email} onChange={handlePatientChange}
                    placeholder="john@example.com" className={inputClass(patientErrors.email)} />
                  {patientErrors.email && <p className="mt-1 text-xs text-red-500">{patientErrors.email}</p>}
                </div>
                <div>
                  <label className={labelClass}>Mobile</label>
                  <input name="mobile" type="text" value={patientForm.mobile} onChange={handlePatientChange}
                    placeholder="10-digit number" className={inputClass(patientErrors.mobile)} />
                  {patientErrors.mobile && <p className="mt-1 text-xs text-red-500">{patientErrors.mobile}</p>}
                </div>
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input name="password" type={patShowPassword ? "text" : "password"}
                    value={patientForm.password} onChange={handlePatientChange}
                    placeholder="Min. 6 characters" className={inputClass(patientErrors.password)} />
                  <button type="button" onClick={() => setPatShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                    aria-label={patShowPassword ? "Hide" : "Show"}>
                    {patShowPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {patientErrors.password && <p className="mt-1 text-xs text-red-500">{patientErrors.password}</p>}
              </div>
              <button type="submit" disabled={isLoading}
                className="mt-2 w-full rounded-lg bg-[var(--brand)] py-2.5 text-sm font-medium text-white transition hover:bg-[var(--brand-deep)] disabled:opacity-70">
                {isLoading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-[var(--muted)]">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[var(--brand)] hover:underline">Log in</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
