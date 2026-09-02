"use client";

import { useEffect, useState, useCallback } from "react";
import {
  User, Mail, Phone, Calendar, Pencil, Check, X, ShieldCheck,
  Droplets, Ruler, Weight, HeartPulse, AlertTriangle,
  Pill, Shield, PhoneCall,
  Plus, Trash2,
} from "lucide-react";
import Link from "next/link";
import UserPortalHeader from "@/features/user-portal/components/UserPortalHeader";
import { getUserHealthProfile, saveUserHealthProfile, getDefaultProfile } from "@/lib/mock-data/userProfiles";
import { getAllAppointments } from "@/lib/mock-data/appointments";
import { getAllPrescriptions } from "@/lib/mock-data/prescriptions";
import type { UserHealthProfile, CurrentMedication } from "@/types/userProfile";

// ── Types ────────────────────────────────────────────────────────────────────

type StoredUser = {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
  role: string;
  dateOfBirth?: string;
};

type BaseForm = {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function formatDOB(dob: string) {
  if (!dob) return "—";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dob));
}

function calcAge(dob: string) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

// ── Small reusable row ────────────────────────────────────────────────────────

function FieldRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 px-6 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[var(--brand)]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
        {children}
      </div>
    </div>
  );
}

function ViewValue({ value }: { value: string | number | undefined | null }) {
  return <p className="text-[15px] font-medium text-[var(--ink)]">{value || "—"}</p>;
}

function EditInput({ value, onChange, type = "text", placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
    />
  );
}

// ── Tag list (for conditions & allergies) ─────────────────────────────────────

function TagListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const trimmed = draft.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setDraft("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="flex items-center gap-1 rounded-full bg-teal-50 px-3 py-0.5 text-xs font-medium text-[var(--brand)]">
            {item}
            <button onClick={() => onChange(items.filter((i) => i !== item))} className="ml-0.5 text-[var(--brand)] hover:text-red-500">
              <X size={11} />
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-[var(--muted)]">None added</span>}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="h-9 flex-1 rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm outline-none focus:border-[var(--brand)]"
        />
        <button onClick={add} className="flex items-center gap-1 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--brand-deep)]">
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}

function TagListView({ items, emptyText }: { items: string[]; emptyText: string }) {
  if (!items.length) return <p className="text-sm text-[var(--muted)]">{emptyText}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-teal-50 px-3 py-0.5 text-xs font-medium text-[var(--brand)]">{item}</span>
      ))}
    </div>
  );
}

// ── Medication editor ─────────────────────────────────────────────────────────

const emptyMed: CurrentMedication = { name: "", dosage: "", frequency: "" };

function MedListEditor({ meds, onChange }: { meds: CurrentMedication[]; onChange: (m: CurrentMedication[]) => void }) {
  const update = (idx: number, field: keyof CurrentMedication, val: string) => {
    const next = [...meds];
    next[idx] = { ...next[idx], [field]: val };
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {meds.map((med, i) => (
        <div key={i} className="relative grid grid-cols-3 gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3 group">
          <button
            onClick={() => onChange(meds.filter((_, j) => j !== i))}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition border border-red-200 hover:bg-red-100"
          >
            <Trash2 size={11} />
          </button>
          <input value={med.name} onChange={(e) => update(i, "name", e.target.value)} placeholder="Medicine name" className="h-8 rounded-md border border-[var(--line)] px-2 text-xs outline-none focus:border-[var(--brand)]" />
          <input value={med.dosage} onChange={(e) => update(i, "dosage", e.target.value)} placeholder="Dosage (e.g. 500mg)" className="h-8 rounded-md border border-[var(--line)] px-2 text-xs outline-none focus:border-[var(--brand)]" />
          <input value={med.frequency} onChange={(e) => update(i, "frequency", e.target.value)} placeholder="Frequency (e.g. Twice daily)" className="h-8 rounded-md border border-[var(--line)] px-2 text-xs outline-none focus:border-[var(--brand)]" />
        </div>
      ))}
      <button onClick={() => onChange([...meds, { ...emptyMed }])} className="flex items-center gap-1.5 text-xs font-medium text-[var(--brand)] hover:underline">
        <Plus size={13} /> Add Medication
      </button>
    </div>
  );
}

function MedListView({ meds }: { meds: CurrentMedication[] }) {
  if (!meds.length) return <p className="text-sm text-[var(--muted)]">No medications recorded</p>;
  return (
    <div className="space-y-2">
      {meds.map((med, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm">
          <Pill size={14} className="shrink-0 text-[var(--brand)]" />
          <span className="font-medium text-[var(--ink)]">{med.name}</span>
          {med.dosage && <span className="text-[var(--muted)]">· {med.dosage}</span>}
          {med.frequency && <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-[var(--brand)]">{med.frequency}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
      <div className="border-b border-[var(--line)] px-6 py-4 bg-stone-50/60">
        <h3 className="font-semibold text-[var(--ink)]">{title}</h3>
      </div>
      <div className="divide-y divide-[var(--line)]">{children}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const [authUser, setAuthUser] = useState<StoredUser | null>(null);
  const [baseForm, setBaseForm] = useState<BaseForm>({ name: "", email: "", phone: "", dateOfBirth: "" });
  const [health, setHealth] = useState<UserHealthProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  // Summary metrics
  const [completedCount, setCompletedCount] = useState(0);
  const [prescriptionCount, setPrescriptionCount] = useState(0);

  const loadData = useCallback(() => {
    try {
      const raw = localStorage.getItem("loggedInUser");
      if (!raw) return;
      const user: StoredUser = JSON.parse(raw);
      setAuthUser(user);
      setBaseForm({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.mobile ?? user.phone ?? "",
        dateOfBirth: user.dateOfBirth ?? "",
      });

      // Health profile — keyed by userId
      const profile = getUserHealthProfile(user.id) ?? getDefaultProfile(user.id);
      setHealth(profile);

      // Metrics — match by userId where possible, fallback to name
      const allApts = getAllAppointments();
      const myCompleted = allApts.filter(
        (a) => a.status === "completed" && (a.patient.name === user.name)
      );
      setCompletedCount(myCompleted.length);

      const allRx = getAllPrescriptions();
      const myRx = Object.values(allRx).filter((rx) => rx.patientId === user.id || rx.patientId === user.name);
      setPrescriptionCount(myRx.length);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    if (!authUser || !health) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    // Persist auth fields
    const updatedUser: StoredUser = { ...authUser, name: baseForm.name, email: baseForm.email, mobile: baseForm.phone, dateOfBirth: baseForm.dateOfBirth };
    localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    setAuthUser(updatedUser);

    // Persist health profile under userId
    saveUserHealthProfile({ ...health, userId: authUser.id });

    setIsEditing(false);
    setIsSaving(false);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const handleCancel = () => {
    if (!authUser) return;
    setBaseForm({ name: authUser.name ?? "", email: authUser.email ?? "", phone: authUser.mobile ?? authUser.phone ?? "", dateOfBirth: authUser.dateOfBirth ?? "" });
    const profile = getUserHealthProfile(authUser.id) ?? getDefaultProfile(authUser.id);
    setHealth(profile);
    setIsEditing(false);
  };

  const setH = (patch: Partial<UserHealthProfile>) => setHealth((h) => h ? { ...h, ...patch } : h);

  if (!authUser || !health) {
    return (
      <>
        <UserPortalHeader title="My Profile" />
        <div className="flex flex-1 items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
        </div>
      </>
    );
  }

  const initials = baseForm.name ? baseForm.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";
  const age = calcAge(baseForm.dateOfBirth);

  return (
    <>
      <UserPortalHeader title="My Profile" />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-5">

          {/* ── Avatar header card ───────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-[var(--line)] bg-white px-6 py-5 shadow-sm">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)] to-teal-400 text-2xl font-bold text-white shadow">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-bold text-[var(--ink)]">{baseForm.name || "—"}</p>
              <p className="mt-0.5 text-sm text-[var(--muted)]">{baseForm.email || "—"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
                  <ShieldCheck size={12} /> Patient Account
                </span>
                {health.bloodGroup && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                    <Droplets size={12} /> {health.bloodGroup}
                  </span>
                )}
                {age && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                    {age} yrs
                  </span>
                )}
              </div>
            </div>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="flex shrink-0 items-center gap-2 rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]">
                <Pencil size={15} /> Edit Profile
              </button>
            ) : (
              <div className="flex shrink-0 gap-2">
                <button onClick={handleCancel} className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-stone-50">
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)] disabled:opacity-60">
                  <Check size={14} /> {isSaving ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>

          {/* ── Success banner ───────────────────────────────────────────── */}
          {savedBanner && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
              <Check size={16} /> Profile updated successfully!
            </div>
          )}

          {/* ── Summary cards ────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {/* Prescriptions — clickable */}
            <Link
              href="/user/appointments?tab=completed"
              className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-sm flex flex-col gap-1 hover:border-[var(--brand)] hover:shadow-md transition cursor-pointer"
            >
              <p className="text-sm font-bold text-[var(--ink)]">Total Prescriptions</p>
              <p className="text-3xl font-bold text-[var(--brand)] mt-1">{prescriptionCount}</p>
            </Link>

            {/* Completed Appointments — static */}
            <div className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-sm flex flex-col gap-1">
              <p className="text-sm font-bold text-[var(--ink)]">Completed Appointments</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{completedCount}</p>
            </div>

            {/* Test Reports — static */}
            <div className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-sm flex flex-col gap-1">
              <p className="text-sm font-bold text-[var(--ink)]">Test Reports</p>
              <p className="text-3xl font-bold text-violet-600 mt-1">0</p>
            </div>
          </div>

          {/* ── Personal Information ─────────────────────────────────────── */}
          <SectionCard title="Personal Information">
            <FieldRow icon={<User size={16} />} label="Full Name">
              {isEditing ? <EditInput value={baseForm.name} onChange={(v) => setBaseForm((f) => ({ ...f, name: v }))} placeholder="Enter your full name" /> : <ViewValue value={baseForm.name} />}
            </FieldRow>
            <FieldRow icon={<Mail size={16} />} label="Email Address">
              {isEditing ? <EditInput type="email" value={baseForm.email} onChange={(v) => setBaseForm((f) => ({ ...f, email: v }))} placeholder="Enter your email" /> : <ViewValue value={baseForm.email} />}
            </FieldRow>
            <FieldRow icon={<Phone size={16} />} label="Phone Number">
              {isEditing ? <EditInput type="tel" value={baseForm.phone} onChange={(v) => setBaseForm((f) => ({ ...f, phone: v }))} placeholder="+91 XXXXX XXXXX" /> : <ViewValue value={baseForm.phone} />}
            </FieldRow>
            <FieldRow icon={<Calendar size={16} />} label="Date of Birth">
              {isEditing ? <EditInput type="date" value={baseForm.dateOfBirth} onChange={(v) => setBaseForm((f) => ({ ...f, dateOfBirth: v }))} /> : <ViewValue value={formatDOB(baseForm.dateOfBirth)} />}
            </FieldRow>
          </SectionCard>

          {/* ── Physical Details ─────────────────────────────────────────── */}
          <SectionCard title="Physical Details">
            <FieldRow icon={<Droplets size={16} />} label="Blood Group">
              {isEditing ? (
                <select value={health.bloodGroup} onChange={(e) => setH({ bloodGroup: e.target.value })} className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm outline-none focus:border-[var(--brand)]">
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              ) : <ViewValue value={health.bloodGroup} />}
            </FieldRow>
            <FieldRow icon={<Ruler size={16} />} label="Height (cm)">
              {isEditing ? <EditInput type="number" value={health.height} onChange={(v) => setH({ height: v })} placeholder="e.g. 170" /> : <ViewValue value={health.height ? `${health.height} cm` : undefined} />}
            </FieldRow>
            <FieldRow icon={<Weight size={16} />} label="Weight (kg)">
              {isEditing ? <EditInput type="number" value={health.weight} onChange={(v) => setH({ weight: v })} placeholder="e.g. 65" /> : <ViewValue value={health.weight ? `${health.weight} kg` : undefined} />}
            </FieldRow>
          </SectionCard>

          {/* ── Medical History ──────────────────────────────────────────── */}
          <SectionCard title="Medical History">
            <FieldRow icon={<HeartPulse size={16} />} label="Medical Conditions">
              {isEditing ? (
                <TagListEditor items={health.medicalConditions} onChange={(v) => setH({ medicalConditions: v })} placeholder="e.g. Hypertension (press Enter)" />
              ) : (
                <TagListView items={health.medicalConditions} emptyText="No conditions recorded" />
              )}
            </FieldRow>
            <FieldRow icon={<AlertTriangle size={16} />} label="Allergies">
              {isEditing ? (
                <TagListEditor items={health.allergies} onChange={(v) => setH({ allergies: v })} placeholder="e.g. Penicillin (press Enter)" />
              ) : (
                <TagListView items={health.allergies} emptyText="No allergies recorded" />
              )}
            </FieldRow>
            <FieldRow icon={<Pill size={16} />} label="Current Medications">
              {isEditing ? (
                <MedListEditor meds={health.currentMedications} onChange={(v) => setH({ currentMedications: v })} />
              ) : (
                <MedListView meds={health.currentMedications} />
              )}
            </FieldRow>
          </SectionCard>

          {/* ── Insurance Details ────────────────────────────────────────── */}
          <SectionCard title="Insurance Details">
            <FieldRow icon={<Shield size={16} />} label="Insurance Provider">
              {isEditing ? <EditInput value={health.insuranceProvider} onChange={(v) => setH({ insuranceProvider: v })} placeholder="e.g. Star Health Insurance" /> : <ViewValue value={health.insuranceProvider} />}
            </FieldRow>
            <FieldRow icon={<Shield size={16} />} label="Policy Number">
              {isEditing ? <EditInput value={health.insurancePolicyNumber} onChange={(v) => setH({ insurancePolicyNumber: v })} placeholder="e.g. SHI-2024-XXXXXXX" /> : <ViewValue value={health.insurancePolicyNumber} />}
            </FieldRow>
          </SectionCard>

          {/* ── Emergency Contact ────────────────────────────────────────── */}
          <SectionCard title="Emergency Contact">
            <FieldRow icon={<User size={16} />} label="Contact Name">
              {isEditing ? <EditInput value={health.emergencyContactName} onChange={(v) => setH({ emergencyContactName: v })} placeholder="e.g. Ravi Sharma" /> : <ViewValue value={health.emergencyContactName} />}
            </FieldRow>
            <FieldRow icon={<PhoneCall size={16} />} label="Contact Phone">
              {isEditing ? <EditInput type="tel" value={health.emergencyContactPhone} onChange={(v) => setH({ emergencyContactPhone: v })} placeholder="+91 XXXXX XXXXX" /> : <ViewValue value={health.emergencyContactPhone} />}
            </FieldRow>
            <FieldRow icon={<HeartPulse size={16} />} label="Relationship">
              {isEditing ? <EditInput value={health.emergencyContactRelation} onChange={(v) => setH({ emergencyContactRelation: v })} placeholder="e.g. Spouse, Parent, Sibling" /> : <ViewValue value={health.emergencyContactRelation} />}
            </FieldRow>
          </SectionCard>

        </div>
      </main>
    </>
  );
}
