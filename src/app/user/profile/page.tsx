"use client";

import { useEffect, useState } from "react";
import { User, Mail, Phone, Calendar, Pencil, Check, X, ShieldCheck } from "lucide-react";
import UserPortalHeader from "@/features/user-portal/components/UserPortalHeader";

type StoredUser = {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
  role: string;
  dateOfBirth?: string;
};

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
};

export default function UserProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("loggedInUser");
      if (raw) {
        const parsed: StoredUser = JSON.parse(raw);
        setUser(parsed);
        setForm({
          name: parsed.name ?? "",
          email: parsed.email ?? "",
          phone: parsed.mobile ?? parsed.phone ?? "",
          dateOfBirth: parsed.dateOfBirth ?? "",
        });
      }
    } catch { /* ignore */ }
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    const updated: StoredUser = {
      ...user,
      name: form.name,
      email: form.email,
      mobile: form.phone,
      dateOfBirth: form.dateOfBirth,
    };
    localStorage.setItem("loggedInUser", JSON.stringify(updated));
    setUser(updated);
    setIsEditing(false);
    setIsSaving(false);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const handleCancel = () => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.mobile ?? user.phone ?? "",
      dateOfBirth: user.dateOfBirth ?? "",
    });
    setIsEditing(false);
  };

  const initials = form.name
    ? form.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const formatDOB = (dob: string) => {
    if (!dob) return "—";
    return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dob));
  };

  return (
    <>
      <UserPortalHeader title="My Profile" />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">My Profile</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Manage your personal information and account details.
          </p>
        </div>

        <div className="mx-auto max-w-2xl space-y-5">
          {/* Avatar + name card */}
          <div className="flex items-center gap-5 rounded-2xl border border-[var(--line)] bg-white px-6 py-5 shadow-sm">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-2xl font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-bold text-[var(--ink)]">{form.name || "—"}</p>
              <p className="mt-0.5 text-sm text-[var(--muted)]">{form.email || "—"}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
                <ShieldCheck size={13} />
                Patient Account
              </span>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                <Pencil size={15} />
                Edit Profile
              </button>
            ) : (
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-stone-50"
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)] disabled:opacity-60"
                >
                  <Check size={14} /> {isSaving ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>

          {/* Success banner */}
          {savedBanner && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
              <Check size={16} /> Profile updated successfully!
            </div>
          )}

          {/* Personal Information */}
          <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
              <h3 className="font-semibold text-[var(--ink)]">Personal Information</h3>
            </div>

            <div className="divide-y divide-[var(--line)]">
              {/* Name */}
              <div className="flex items-start gap-4 px-6 py-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[var(--brand)]">
                  <User size={16} />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Full Name</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-[15px] font-medium text-[var(--ink)]">{form.name || "—"}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 px-6 py-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[var(--brand)]">
                  <Mail size={16} />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Email Address</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <p className="text-[15px] font-medium text-[var(--ink)]">{form.email || "—"}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 px-6 py-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[var(--brand)]">
                  <Phone size={16} />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Phone Number</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-[15px] font-medium text-[var(--ink)]">{form.phone || "—"}</p>
                  )}
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex items-start gap-4 px-6 py-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[var(--brand)]">
                  <Calendar size={16} />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Date of Birth</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                    />
                  ) : (
                    <p className="text-[15px] font-medium text-[var(--ink)]">{formatDOB(form.dateOfBirth)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Details (read-only) */}
          <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm">
            <div className="border-b border-[var(--line)] px-6 py-4">
              <h3 className="font-semibold text-[var(--ink)]">Account Details</h3>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between rounded-xl bg-[var(--canvas)] px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Account Type</p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--ink)]">Patient</p>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
