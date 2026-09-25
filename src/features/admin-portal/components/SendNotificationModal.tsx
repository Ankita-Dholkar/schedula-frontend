"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Users,
  Stethoscope,
  UserCheck,
  ChevronDown,
  Loader2,
  Bell,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { sendNotification } from "@/store/slices/adminNotificationsSlice";
import { logAdminAction } from "@/store/slices/auditLogsSlice";
import { getAuditActor } from "@/types/auditLog";
import type {
  AdminNotification,
  NotificationTarget,
  NotificationCategory,
} from "@/types/notification";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: NotificationCategory; label: string; color: string }[] = [
  { value: "announcement", label: "Announcement", color: "bg-blue-100 text-blue-700" },
  { value: "maintenance", label: "Maintenance", color: "bg-orange-100 text-orange-700" },
  { value: "promotion", label: "Promotion", color: "bg-emerald-100 text-emerald-700" },
  { value: "reminder", label: "Reminder", color: "bg-violet-100 text-violet-700" },
  { value: "alert", label: "Alert", color: "bg-red-100 text-red-700" },
];

const TARGET_OPTIONS: { value: NotificationTarget; label: string; sub: string; icon: React.ElementType }[] = [
  { value: "all_patients", label: "All Patients", sub: "Send to every registered patient", icon: Users },
  { value: "all_doctors", label: "All Doctors", sub: "Send to every registered doctor", icon: Stethoscope },
  { value: "selected_users", label: "Selected Users", sub: "Choose specific people by name", icon: UserCheck },
];

// Mock user list for "selected_users" multi-select
const MOCK_USERS = [
  "Priya Sharma", "Arjun Mehta", "Sunita Patel", "Rohan Gupta", "Anjali Singh",
  "Vikram Nair", "Kavya Reddy", "Aditya Kumar", "Meera Joshi", "Rajesh Rao",
  "Dr. Prakash Das", "Dr. Anika Rao", "Dr. Martin Cole", "Dr. Priya Nair",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function approximateRecipientCount(
  target: NotificationTarget,
  selectedUsers: string[]
): number {
  if (target === "all_patients") return 120;
  if (target === "all_doctors") return 18;
  return selectedUsers.length;
}

// ─── Form field ───────────────────────────────────────────────────────────────

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-[var(--muted)] mb-1.5">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
  onSent?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SendNotificationModal({ open, onClose, onSent }: Props) {
  const dispatch = useAppDispatch();
  const currentAdmin = useAppSelector((s) => s.adminAuth.admin);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<NotificationTarget>("all_patients");
  const [category, setCategory] = useState<NotificationCategory>("announcement");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // UI state
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset on open
  useEffect(() => {
    if (open) {
      setTitle("");
      setMessage("");
      setTarget("all_patients");
      setCategory("announcement");
      setSelectedUsers([]);
      setUserSearch("");
      setUserDropdownOpen(false);
      setSending(false);
      setSent(false);
      setErrors({});
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, sending]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    else if (title.trim().length < 5) newErrors.title = "Title must be at least 5 characters.";
    if (!message.trim()) newErrors.message = "Message is required.";
    else if (message.trim().length < 10) newErrors.message = "Message must be at least 10 characters.";
    if (target === "selected_users" && selectedUsers.length === 0) {
      newErrors.users = "Select at least one recipient.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));

    const notification: AdminNotification = {
      id: generateId(),
      title: title.trim(),
      message: message.trim(),
      target,
      selectedUsers: target === "selected_users" ? selectedUsers : undefined,
      category,
      status: "sent",
      sentAt: new Date().toISOString(),
      sentBy: currentAdmin?.name ?? "Admin",
      recipientCount: approximateRecipientCount(target, selectedUsers),
    };

    dispatch(sendNotification(notification));
    dispatch(logAdminAction({
      actor: getAuditActor(currentAdmin),
      action: "NOTIFICATION_BROADCAST",
      entityType: "notification",
      entityId: notification.id,
      entityName: notification.title,
      details: `Broadcast notification "${notification.title}" sent to ${notification.target.replace(/_/g, " ")} (${notification.recipientCount ?? 0} recipients).`,
      metadata: {
        target: notification.target,
        recipientCount: notification.recipientCount,
        category: notification.category,
        selectedUsers: notification.selectedUsers,
      },
      ipAddress: "127.0.0.1",
      severity: "info",
    }));
    setSending(false);
    setSent(true);
    onSent?.();
    setTimeout(() => onClose(), 1500);
  };

  const toggleUser = (name: string) => {
    setSelectedUsers((prev) =>
      prev.includes(name) ? prev.filter((u) => u !== name) : [...prev, name]
    );
    if (errors.users) setErrors((e) => ({ ...e, users: "" }));
  };

  const filteredUsers = MOCK_USERS.filter((u) =>
    u.toLowerCase().includes(userSearch.toLowerCase())
  );

  const recipientPreview = approximateRecipientCount(target, selectedUsers);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => {
        if (e.target === overlayRef.current && !sending) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-label="Send Notification"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--canvas)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
              <Bell size={17} className="text-[var(--brand)]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--ink)]">Send Notification</p>
              <p className="text-xs text-[var(--muted)]">Broadcast to platform users</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-stone-100 hover:text-[var(--ink)] disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success state */}
        {sent ? (
          <div className="flex flex-col items-center justify-center gap-4 px-8 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <Send size={28} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--ink)]">Notification Sent!</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Your message has been delivered to{" "}
                <span className="font-semibold text-[var(--ink)]">{recipientPreview}</span> recipient{recipientPreview !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-h-[calc(90vh-160px)] overflow-y-auto p-5 space-y-5">

            {/* Target audience */}
            <div>
              <FieldLabel htmlFor="target-select" required>Target Audience</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {TARGET_OPTIONS.map(({ value, label, sub, icon: Icon }) => (
                  <button
                    key={value}
                    id={`target-${value}`}
                    type="button"
                    onClick={() => { setTarget(value); setSelectedUsers([]); }}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                      target === value
                        ? "border-[var(--brand)] bg-teal-50 ring-1 ring-[var(--brand)]"
                        : "border-[var(--line)] hover:border-[var(--brand)]/40 hover:bg-stone-50"
                    }`}
                  >
                    <Icon size={16} className={target === value ? "text-[var(--brand)]" : "text-[var(--muted)]"} />
                    <span className={`text-xs font-semibold ${target === value ? "text-[var(--brand)]" : "text-[var(--ink)]"}`}>
                      {label}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] leading-snug">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected users picker */}
            {target === "selected_users" && (
              <div>
                <FieldLabel htmlFor="user-search" required>Select Recipients</FieldLabel>
                <div className="relative">
                  <button
                    id="user-search"
                    type="button"
                    onClick={() => setUserDropdownOpen((o) => !o)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition focus:outline-none ${
                      errors.users
                        ? "border-red-400 bg-red-50"
                        : "border-[var(--line)] focus:border-[var(--brand)]"
                    }`}
                  >
                    <span className={selectedUsers.length === 0 ? "text-stone-400" : "text-[var(--ink)]"}>
                      {selectedUsers.length === 0
                        ? "Select users…"
                        : `${selectedUsers.length} user${selectedUsers.length !== 1 ? "s" : ""} selected`}
                    </span>
                    <ChevronDown size={14} className={`text-[var(--muted)] transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {userDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full rounded-xl border border-[var(--line)] bg-white shadow-lg">
                      <div className="p-2 border-b border-[var(--line)]">
                        <input
                          type="text"
                          placeholder="Search users…"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="w-full rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm outline-none focus:border-[var(--brand)]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1">
                        {filteredUsers.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-[var(--muted)]">No users found</p>
                        ) : (
                          filteredUsers.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => toggleUser(name)}
                              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition ${
                                selectedUsers.includes(name)
                                  ? "bg-teal-50 text-[var(--brand)] font-medium"
                                  : "text-[var(--ink)] hover:bg-stone-50"
                              }`}
                            >
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                selectedUsers.includes(name)
                                  ? "border-[var(--brand)] bg-[var(--brand)]"
                                  : "border-stone-300"
                              }`}>
                                {selectedUsers.includes(name) && (
                                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </span>
                              {name}
                            </button>
                          ))
                        )}
                      </div>
                      {selectedUsers.length > 0 && (
                        <div className="border-t border-[var(--line)] p-2">
                          <button
                            type="button"
                            onClick={() => setSelectedUsers([])}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {errors.users && <p className="mt-1 text-xs text-red-500">{errors.users}</p>}
                {/* Selected chips */}
                {selectedUsers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedUsers.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-xs font-medium text-teal-700"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => toggleUser(name)}
                          className="ml-0.5 text-teal-500 hover:text-teal-700"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Category */}
            <div>
              <FieldLabel htmlFor="category-select" required>Category</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(({ value, label, color }) => (
                  <button
                    key={value}
                    id={`cat-${value}`}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                      category === value
                        ? `${color} ring-2 ring-offset-1 ring-current`
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <FieldLabel htmlFor="notif-title" required>Notification Title</FieldLabel>
              <input
                id="notif-title"
                type="text"
                placeholder="e.g. Platform Maintenance Notice"
                value={title}
                maxLength={100}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((er) => ({ ...er, title: "" }));
                }}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition placeholder:text-stone-400 focus:ring-1 ${
                  errors.title
                    ? "border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-200"
                    : "border-[var(--line)] focus:border-[var(--brand)] focus:ring-[var(--brand)]"
                }`}
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.title ? (
                  <p className="text-xs text-red-500">{errors.title}</p>
                ) : (
                  <span />
                )}
                <span className="text-[10px] text-[var(--muted)]">{title.length}/100</span>
              </div>
            </div>

            {/* Message */}
            <div>
              <FieldLabel htmlFor="notif-message" required>Message</FieldLabel>
              <textarea
                id="notif-message"
                placeholder="Write your notification message here…"
                value={message}
                maxLength={500}
                rows={4}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors((er) => ({ ...er, message: "" }));
                }}
                className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition placeholder:text-stone-400 focus:ring-1 ${
                  errors.message
                    ? "border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-200"
                    : "border-[var(--line)] focus:border-[var(--brand)] focus:ring-[var(--brand)]"
                }`}
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.message ? (
                  <p className="text-xs text-red-500">{errors.message}</p>
                ) : (
                  <span />
                )}
                <span className="text-[10px] text-[var(--muted)]">{message.length}/500</span>
              </div>
            </div>

            {/* Preview banner */}
            <div className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-4">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
                Preview
              </p>
              <div className="mt-2 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]">
                  <Bell size={14} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--ink)] truncate">
                    {title || <span className="italic text-[var(--muted)]">Notification title…</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted)] line-clamp-2">
                    {message || <span className="italic">Message body…</span>}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    → ~{recipientPreview} recipient{recipientPreview !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!sent && (
          <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--canvas)] px-5 py-4">
            <p className="text-xs text-[var(--muted)]">
              ~<span className="font-semibold text-[var(--ink)]">{recipientPreview}</span> recipient{recipientPreview !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-stone-50 transition disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                id="send-notification-btn"
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2 text-sm font-bold text-white hover:bg-teal-700 transition disabled:opacity-60"
              >
                {sending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Send Now
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
