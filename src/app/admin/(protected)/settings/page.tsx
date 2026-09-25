"use client";

import { useState, useEffect } from "react";
import {
  User,
  Lock,
  Bell,
  Settings2,
  ShieldCheck,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateAdminProfile } from "@/store/slices/adminAuthSlice";
import {
  updateAdmin,
  updateAdminNotificationPrefs,
  updatePlatformSettings,
  resetPlatformSettings,
  hydrateAdminManagement,
  selectPlatformSettings,
  selectAllAdmins,
} from "@/store/slices/adminManagementSlice";
import { loadAdminUsers, saveAdminUsers } from "@/lib/mock-data/admins";
import { logAdminAction } from "@/store/slices/auditLogsSlice";
import { getAuditActor } from "@/types/auditLog";
import { hasPermission } from "@/lib/admin/permissions";
import {
  ROLE_META,
  DEFAULT_PLATFORM_SETTINGS,
  type NotificationPreferences,
  type PlatformSettings,
} from "@/types/admin";

type Tab = "profile" | "security" | "notifications" | "platform";

function TabButton({
  id,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: Tab;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      id={`settings-tab-${id}`}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-[var(--brand)] text-white shadow-sm"
          : "text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)]"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4 ${
      type === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-rose-200 bg-rose-50 text-rose-700"
    }`}>
      {type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {message}
    </div>
  );
}

export default function AdminSettingsPage() {
  const dispatch = useAppDispatch();
  const currentAdmin = useAppSelector((s) => s.adminAuth.admin);
  const platformSettings = useAppSelector(selectPlatformSettings);
  const allAdmins = useAppSelector(selectAllAdmins);

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const isSuperAdmin = currentAdmin?.adminRole === "super_admin";
  const canEditPlatform = hasPermission(currentAdmin, "settings", "edit") && isSuperAdmin;

  useEffect(() => {
    dispatch(hydrateAdminManagement());
  }, [dispatch]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Profile Tab ──────────────────────────────────────────────────────────

  const [profileForm, setProfileForm] = useState({
    name: currentAdmin?.name ?? "",
    email: currentAdmin?.email ?? "",
    mobile: currentAdmin?.mobile ?? "",
  });
  const [profileErrors, setProfileErrors] = useState<Partial<typeof profileForm>>({});
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    setProfileForm({
      name: currentAdmin?.name ?? "",
      email: currentAdmin?.email ?? "",
      mobile: currentAdmin?.mobile ?? "",
    });
  }, [currentAdmin]);

  const handleProfileSave = async () => {
    const errs: Partial<typeof profileForm> = {};
    if (!profileForm.name.trim()) errs.name = "Name is required.";
    if (!profileForm.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim()))
      errs.email = "Enter a valid email.";
    if (!profileForm.mobile.trim()) errs.mobile = "Phone is required.";
    else if (!/^\d{10}$/.test(profileForm.mobile.trim()))
      errs.mobile = "Enter a 10-digit phone number.";
    setProfileErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setProfileLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    if (currentAdmin) {
      const changes = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim().toLowerCase(),
        mobile: profileForm.mobile.trim(),
      };
      dispatch(updateAdminProfile(changes));
      dispatch(updateAdmin({ id: currentAdmin.id, changes }));
      dispatch(logAdminAction({
        actor: getAuditActor(currentAdmin),
        action: "ADMIN_PROFILE_UPDATED",
        entityType: "admin_user",
        entityId: currentAdmin.id,
        entityName: currentAdmin.name,
        details: `Admin profile updated for ${currentAdmin.name}.`,
        metadata: { changes },
        ipAddress: "127.0.0.1",
        severity: "info",
      }));
      // Update localStorage session
      try {
        const raw = localStorage.getItem("loggedInAdmin");
        if (raw) {
          localStorage.setItem("loggedInAdmin", JSON.stringify({ ...JSON.parse(raw), ...changes }));
        }
      } catch { /* ignore */ }
    }
    setProfileLoading(false);
    showToast("Profile updated successfully.");
  };

  // ── Security Tab ─────────────────────────────────────────────────────────

  const [secForm, setSecForm] = useState({ current: "", newPass: "", confirm: "" });
  const [secErrors, setSecErrors] = useState<Partial<typeof secForm>>({});
  const [showPasswords, setShowPasswords] = useState({ current: false, newPass: false, confirm: false });
  const [secLoading, setSecLoading] = useState(false);

  const handlePasswordChange = async () => {
    const errs: Partial<typeof secForm> = {};
    if (!secForm.current.trim()) errs.current = "Current password is required.";
    if (!secForm.newPass.trim()) errs.newPass = "New password is required.";
    else if (secForm.newPass.length < 6) errs.newPass = "Password must be at least 6 characters.";
    if (!secForm.confirm.trim()) errs.confirm = "Please confirm your new password.";
    else if (secForm.newPass !== secForm.confirm) errs.confirm = "Passwords do not match.";
    setSecErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // Verify current password against localStorage
    const stored = loadAdminUsers().find((a) => a.id === currentAdmin?.id);
    if (!stored || stored.password !== secForm.current.trim()) {
      setSecErrors({ current: "Current password is incorrect." });
      return;
    }

    setSecLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    // Update password in the persisted admin list
    const updatedAdmins = loadAdminUsers().map((a) =>
      a.id === currentAdmin?.id ? { ...a, password: secForm.newPass.trim() } : a
    );
    saveAdminUsers(updatedAdmins);
    dispatch(updateAdmin({ id: currentAdmin!.id, changes: { password: secForm.newPass.trim() } }));
    dispatch(logAdminAction({
      actor: getAuditActor(currentAdmin),
      action: "ADMIN_PASSWORD_CHANGED",
      entityType: "admin_user",
      entityId: currentAdmin!.id,
      entityName: currentAdmin!.name,
      details: `Password changed for admin account ${currentAdmin!.email}.`,
      metadata: { email: currentAdmin!.email },
      ipAddress: "127.0.0.1",
      severity: "warning",
    }));

    setSecForm({ current: "", newPass: "", confirm: "" });
    setSecLoading(false);
    showToast("Password changed successfully.");
  };

  const toggleShowPassword = (field: keyof typeof showPasswords) =>
    setShowPasswords((p) => ({ ...p, [field]: !p[field] }));

  // ── Notifications Tab ────────────────────────────────────────────────────

  const notifPrefs: NotificationPreferences = currentAdmin?.notificationPreferences ?? {
    doctorVerificationAlerts: true,
    appointmentAnomalyAlerts: true,
    auditSecurityAlerts: true,
    weeklyDigest: false,
  };

  const [notifLoading, setNotifLoading] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>(notifPrefs);

  useEffect(() => {
    if (currentAdmin?.notificationPreferences) {
      setLocalPrefs(currentAdmin.notificationPreferences);
    }
  }, [currentAdmin]);

  const handleNotifSave = async () => {
    setNotifLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    if (currentAdmin) {
      dispatch(updateAdminNotificationPrefs({ id: currentAdmin.id, prefs: localPrefs }));
      dispatch(updateAdminProfile({ notificationPreferences: localPrefs }));
    }
    setNotifLoading(false);
    showToast("Notification preferences saved.");
  };

  const notifItems: { key: keyof NotificationPreferences; label: string; description: string }[] = [
    {
      key: "doctorVerificationAlerts",
      label: "Doctor Verification Requests",
      description: "Get notified when a new doctor submits documents for verification.",
    },
    {
      key: "appointmentAnomalyAlerts",
      label: "Appointment Anomaly Alerts",
      description: "Get notified about unusual patterns like mass cancellations or high missed rates.",
    },
    {
      key: "auditSecurityAlerts",
      label: "Audit & Security Alerts",
      description: "Receive alerts for high-severity or critical audit log events.",
    },
    {
      key: "weeklyDigest",
      label: "Weekly Summary Digest",
      description: "Receive a weekly email summary of platform activity and key metrics.",
    },
  ];

  // ── Platform Settings Tab ────────────────────────────────────────────────

  const [platformForm, setPlatformForm] = useState<PlatformSettings>(
    platformSettings ?? DEFAULT_PLATFORM_SETTINGS
  );
  const [platformLoading, setPlatformLoading] = useState(false);

  useEffect(() => {
    if (platformSettings) setPlatformForm(platformSettings);
  }, [platformSettings]);

  const handlePlatformSave = async () => {
    setPlatformLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    dispatch(updatePlatformSettings(platformForm));
    dispatch(logAdminAction({
      actor: getAuditActor(currentAdmin),
      action: "PLATFORM_SETTINGS_UPDATED",
      entityType: "settings",
      entityId: "platform-settings",
      entityName: "Platform Settings",
      details: `Platform settings updated by ${currentAdmin?.name ?? "Super Admin"}.`,
      metadata: { settings: platformForm },
      ipAddress: "127.0.0.1",
      severity: "warning",
    }));
    setPlatformLoading(false);
    showToast("Platform settings saved.");
  };

  const handlePlatformReset = async () => {
    setPlatformLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    dispatch(resetPlatformSettings());
    dispatch(logAdminAction({
      actor: getAuditActor(currentAdmin),
      action: "PLATFORM_SETTINGS_UPDATED",
      entityType: "settings",
      entityId: "platform-settings",
      entityName: "Platform Settings",
      details: `Platform settings reset to defaults by ${currentAdmin?.name ?? "Super Admin"}.`,
      metadata: { reset: true },
      ipAddress: "127.0.0.1",
      severity: "warning",
    }));
    setPlatformForm(DEFAULT_PLATFORM_SETTINGS);
    setPlatformLoading(false);
    showToast("Platform settings reset to defaults.");
  };

  const rm = currentAdmin?.adminRole ? ROLE_META[currentAdmin.adminRole] : null;
  const initials = (currentAdmin?.name ?? "A")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-5 lg:p-7 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2">
          <Settings2 size={20} className="text-[var(--brand)]" />
          Settings
        </h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Manage your profile, security, preferences, and platform configuration.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--line)] bg-white p-2 shadow-sm">
        <TabButton id="profile"       label="My Profile"         icon={User}     active={activeTab === "profile"}       onClick={() => setActiveTab("profile")} />
        <TabButton id="security"      label="Security & Password" icon={Lock}     active={activeTab === "security"}     onClick={() => setActiveTab("security")} />
        <TabButton id="notifications" label="Notifications"       icon={Bell}     active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} />
        {isSuperAdmin && (
          <TabButton id="platform" label="Platform Settings" icon={ShieldCheck} active={activeTab === "platform"} onClick={() => setActiveTab("platform")} />
        )}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === "profile" && (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand)] text-white text-xl font-bold shadow-sm">
              {initials}
            </div>
            <div>
              <p className="text-base font-bold text-[var(--ink)]">{currentAdmin?.name}</p>
              <p className="text-sm text-[var(--muted)]">{currentAdmin?.email}</p>
              {rm && (
                <span className={`mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rm.badgeColor} ${rm.badgeBorder}`}>
                  {rm.label}
                </span>
              )}
            </div>
          </div>

          <hr className="border-[var(--line)]" />

          {/* Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="profile-name"
                value={profileForm.name}
                onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]/30 ${profileErrors.name ? "border-rose-400" : "border-[var(--line)]"}`}
              />
              {profileErrors.name && <p className="mt-1 text-xs text-rose-500">{profileErrors.name}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="profile-email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]/30 ${profileErrors.email ? "border-rose-400" : "border-[var(--line)]"}`}
              />
              {profileErrors.email && <p className="mt-1 text-xs text-rose-500">{profileErrors.email}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="profile-mobile"
                type="tel"
                value={profileForm.mobile}
                onChange={(e) => setProfileForm((p) => ({ ...p, mobile: e.target.value }))}
                className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]/30 ${profileErrors.mobile ? "border-rose-400" : "border-[var(--line)]"}`}
              />
              {profileErrors.mobile && <p className="mt-1 text-xs text-rose-500">{profileErrors.mobile}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Role</label>
              <div className="h-10 flex items-center rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3">
                <p className="text-sm text-[var(--muted)]">{rm?.label ?? "—"} (read-only)</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleProfileSave}
              disabled={profileLoading}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-deep)] transition-colors disabled:opacity-60"
              id="profile-save-btn"
            >
              {profileLoading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              <Save size={14} />
              Save Profile
            </button>
          </div>
        </div>
      )}

      {/* ── Security Tab ── */}
      {activeTab === "security" && (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-[var(--ink)]">Change Password</h2>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              Your new password will be required the next time you log in.
            </p>
          </div>

          <hr className="border-[var(--line)]" />

          {[
            { key: "current" as const, label: "Current Password", placeholder: "Enter your current password" },
            { key: "newPass" as const, label: "New Password",     placeholder: "Min. 6 characters" },
            { key: "confirm" as const, label: "Confirm New Password", placeholder: "Re-enter new password" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                {label} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id={`security-${key}`}
                  type={showPasswords[key] ? "text" : "password"}
                  value={secForm[key]}
                  onChange={(e) => setSecForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className={`h-10 w-full rounded-lg border bg-white px-3 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]/30 ${secErrors[key] ? "border-rose-400" : "border-[var(--line)]"}`}
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword(key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                >
                  {showPasswords[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {secErrors[key] && <p className="mt-1 text-xs text-rose-500">{secErrors[key]}</p>}
            </div>
          ))}

          <div className="flex justify-end">
            <button
              onClick={handlePasswordChange}
              disabled={secLoading}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-deep)] transition-colors disabled:opacity-60"
              id="security-save-btn"
            >
              {secLoading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              <Lock size={14} />
              Change Password
            </button>
          </div>
        </div>
      )}

      {/* ── Notifications Tab ── */}
      {activeTab === "notifications" && (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-[var(--ink)]">Notification Preferences</h2>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              Choose which alerts and updates you want to receive.
            </p>
          </div>

          <hr className="border-[var(--line)]" />

          <div className="space-y-4">
            {notifItems.map(({ key, label, description }) => (
              <div key={key} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">{label}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalPrefs((p) => ({ ...p, [key]: !p[key] }))}
                  className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${localPrefs[key] ? "bg-[var(--brand)]" : "bg-slate-300"}`}
                  role="switch"
                  aria-checked={localPrefs[key]}
                  id={`notif-toggle-${key}`}
                >
                  <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${localPrefs[key] ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleNotifSave}
              disabled={notifLoading}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-deep)] transition-colors disabled:opacity-60"
              id="notif-save-btn"
            >
              {notifLoading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              <Save size={14} />
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* ── Platform Settings Tab (Super Admin only) ── */}
      {activeTab === "platform" && isSuperAdmin && (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Platform Settings</h2>
              <p className="mt-0.5 text-sm text-[var(--muted)]">
                Global configuration for the Schedula platform. Changes take effect immediately.
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ROLE_META.super_admin.badgeColor} ${ROLE_META.super_admin.badgeBorder}`}>
              Super Admin Only
            </span>
          </div>

          <hr className="border-[var(--line)]" />

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Platform Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Platform Name</label>
              <input
                id="platform-name"
                value={platformForm.platformName}
                onChange={(e) => setPlatformForm((p) => ({ ...p, platformName: e.target.value }))}
                className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]/30"
              />
            </div>

            {/* Support Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Support Email</label>
              <input
                id="platform-support-email"
                type="email"
                value={platformForm.supportEmail}
                onChange={(e) => setPlatformForm((p) => ({ ...p, supportEmail: e.target.value }))}
                className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]/30"
              />
            </div>

            {/* Appointment Buffer */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Appointment Buffer (minutes)</label>
              <select
                id="platform-buffer"
                value={platformForm.appointmentBufferMinutes}
                onChange={(e) => setPlatformForm((p) => ({ ...p, appointmentBufferMinutes: Number(e.target.value) }))}
                className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]/30"
              >
                {[5, 10, 15, 20, 30, 45, 60].map((v) => (
                  <option key={v} value={v}>{v} minutes</option>
                ))}
              </select>
            </div>

            {/* Max Advance Booking */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Max Advance Booking (days)</label>
              <select
                id="platform-max-booking"
                value={platformForm.maxAdvanceBookingDays}
                onChange={(e) => setPlatformForm((p) => ({ ...p, maxAdvanceBookingDays: Number(e.target.value) }))}
                className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]/30"
              >
                {[7, 14, 30, 45, 60, 90].map((v) => (
                  <option key={v} value={v}>{v} days</option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">System Currency</label>
              <select
                id="platform-currency"
                value={platformForm.currency}
                onChange={(e) => setPlatformForm((p) => ({ ...p, currency: e.target.value as "INR" | "USD" }))}
                className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]/30"
              >
                <option value="INR">₹ INR — Indian Rupee</option>
                <option value="USD">$ USD — US Dollar</option>
              </select>
            </div>

            {/* Maintenance Mode */}
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:col-span-2">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-600" />
                  <p className="text-sm font-medium text-[var(--ink)]">Maintenance Mode</p>
                </div>
                <p className="mt-0.5 text-xs text-amber-700">
                  Enabling this will display a maintenance notice to all users. Admin portal remains accessible.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlatformForm((p) => ({ ...p, maintenanceMode: !p.maintenanceMode }))}
                className={`ml-4 relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${platformForm.maintenanceMode ? "bg-amber-500" : "bg-slate-300"}`}
                role="switch"
                aria-checked={platformForm.maintenanceMode}
                id="platform-maintenance-toggle"
              >
                <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${platformForm.maintenanceMode ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handlePlatformReset}
              disabled={platformLoading}
              className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors disabled:opacity-50"
              id="platform-reset-btn"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handlePlatformSave}
              disabled={platformLoading}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-deep)] transition-colors disabled:opacity-60"
              id="platform-save-btn"
            >
              {platformLoading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              <Save size={14} />
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
