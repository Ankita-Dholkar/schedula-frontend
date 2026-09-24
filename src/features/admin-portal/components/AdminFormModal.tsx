"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Modal from "@/components/ui/Modal";
import {
  type AdminManagedUser,
  type AdminRole,
  ROLE_META,
} from "@/types/admin";
import { wouldStripLastSuperAdminRole } from "@/lib/admin/permissions";

type Props = {
  mode: "add" | "edit" | null;
  admin: AdminManagedUser | null;
  allAdmins: AdminManagedUser[];
  currentAdminId?: string;
  onClose: () => void;
  onSubmitAdd: (data: Omit<AdminManagedUser, "id" | "createdAt">) => void;
  onSubmitEdit: (data: Partial<AdminManagedUser>) => void;
  onSafeguardError: (msg: string) => void;
};

type FormData = {
  name: string;
  email: string;
  mobile: string;
  adminRole: AdminRole;
  password: string;
  isActive: boolean;
};

const ROLES: { value: AdminRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin",       label: "Operations Admin" },
  { value: "support",     label: "Support Staff" },
];

function initForm(admin: AdminManagedUser | null): FormData {
  return {
    name:      admin?.name ?? "",
    email:     admin?.email ?? "",
    mobile:    admin?.mobile ?? "",
    adminRole: admin?.adminRole ?? "support",
    password:  "",
    isActive:  admin?.isActive ?? true,
  };
}

export default function AdminFormModal({
  mode,
  admin,
  allAdmins,
  currentAdminId,
  onClose,
  onSubmitAdd,
  onSubmitEdit,
  onSafeguardError,
}: Props) {
  const isOpen = mode !== null;
  const isEdit = mode === "edit";

  const [form, setForm] = useState<FormData>(initForm(admin));
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initForm(admin));
      setErrors({});
      setShowPassword(false);
    }
  }, [isOpen, admin]);

  const set = (key: keyof FormData, val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validate = (): boolean => {
    const errs: Partial<FormData> = {};
    if (!form.name.trim())  errs.name  = "Name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Enter a valid email.";
    if (!form.mobile.trim())      errs.mobile = "Phone number is required.";
    else if (!/^\d{10}$/.test(form.mobile.trim()))
      errs.mobile = "Enter a valid 10-digit phone number.";
    if (!isEdit && !form.password.trim())
      errs.password = "Password is required for a new admin.";
    else if (!isEdit && form.password.length < 6)
      errs.password = "Password must be at least 6 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    if (isEdit && admin) {
      // Safeguard: stripping last super admin role
      if (form.adminRole !== "super_admin" && admin.adminRole === "super_admin") {
        if (wouldStripLastSuperAdminRole(allAdmins, admin.id, form.adminRole)) {
          onSafeguardError("Cannot change role — this is the last active Super Admin.");
          setLoading(false);
          onClose();
          return;
        }
      }
      const changes: Partial<AdminManagedUser> = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        adminRole: form.adminRole,
        isActive: form.isActive,
      };
      if (form.password.trim()) changes.password = form.password.trim();
      onSubmitEdit(changes);
    } else {
      // Check email uniqueness
      const duplicate = allAdmins.find(
        (a) => a.email.toLowerCase() === form.email.trim().toLowerCase()
      );
      if (duplicate) {
        setErrors((e) => ({ ...e, email: "An admin with this email already exists." }));
        setLoading(false);
        return;
      }
      onSubmitAdd({
        name:      form.name.trim(),
        email:     form.email.trim().toLowerCase(),
        mobile:    form.mobile.trim(),
        adminRole: form.adminRole,
        password:  form.password.trim(),
        role:      "admin",
        isActive:  true,
      });
    }
    setLoading(false);
  };

  const rm = ROLE_META[form.adminRole];

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Admin User" : "Add New Admin"}
      description={isEdit ? `Editing ${admin?.name ?? "admin"}'s profile and role.` : "Create a new admin account with a role and temporary password."}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-deep)] transition-colors disabled:opacity-60"
            id="admin-form-submit"
          >
            {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {isEdit ? "Save Changes" : "Create Admin"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="admin-form-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Jane Smith"
            className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]/30 ${errors.name ? "border-rose-400" : "border-[var(--line)]"}`}
          />
          {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            id="admin-form-email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="e.g. jane@schedula.com"
            className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]/30 ${errors.email ? "border-rose-400" : "border-[var(--line)]"}`}
          />
          {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <input
            id="admin-form-mobile"
            type="tel"
            value={form.mobile}
            onChange={(e) => set("mobile", e.target.value)}
            placeholder="10-digit mobile number"
            className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]/30 ${errors.mobile ? "border-rose-400" : "border-[var(--line)]"}`}
          />
          {errors.mobile && <p className="mt-1 text-xs text-rose-500">{errors.mobile}</p>}
        </div>

        {/* Role */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
            Assign Role <span className="text-rose-500">*</span>
          </label>
          <select
            id="admin-form-role"
            value={form.adminRole}
            onChange={(e) => set("adminRole", e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]/30"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {/* Role description hint */}
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            {rm.description}
          </p>
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
            {isEdit ? "New Password" : "Temporary Password"}{" "}
            {!isEdit && <span className="text-rose-500">*</span>}
            {isEdit && <span className="ml-1 text-xs text-[var(--muted)] font-normal">(leave blank to keep current)</span>}
          </label>
          <div className="relative">
            <input
              id="admin-form-password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={isEdit ? "New password (optional)" : "Min. 6 characters"}
              className={`h-10 w-full rounded-lg border bg-white px-3 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]/30 ${errors.password ? "border-rose-400" : "border-[var(--line)]"}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password}</p>}
        </div>

        {/* Active status (edit only) */}
        {isEdit && (
          <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">Account Active</p>
              <p className="text-xs text-[var(--muted)]">Inactive admins cannot log in.</p>
            </div>
            <button
              type="button"
              onClick={() => set("isActive", !form.isActive)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.isActive ? "bg-[var(--brand)]" : "bg-slate-300"}`}
              role="switch"
              aria-checked={form.isActive}
            >
              <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
