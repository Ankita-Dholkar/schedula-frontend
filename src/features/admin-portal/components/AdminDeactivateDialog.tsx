"use client";

import { useState } from "react";
import { Power, PowerOff, Shield } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { type AdminManagedUser, ROLE_META } from "@/types/admin";
import { wouldRemoveLastSuperAdmin } from "@/lib/admin/permissions";

type Props = {
  admin: AdminManagedUser;
  allAdmins: AdminManagedUser[];
  currentAdminId: string;
  onClose: () => void;
  onConfirm: (id: string, activate: boolean) => void;
};

export default function AdminDeactivateDialog({
  admin,
  allAdmins,
  currentAdminId,
  onClose,
  onConfirm,
}: Props) {
  const [loading, setLoading] = useState(false);
  const activating = !admin.isActive;
  const rm = ROLE_META[admin.adminRole];

  // Compute safeguard warnings
  const isSelf = admin.id === currentAdminId;
  const isLastSuperAdmin =
    !activating && wouldRemoveLastSuperAdmin(allAdmins, admin.id);
  const isBlocked = isSelf || isLastSuperAdmin;

  const handleConfirm = async () => {
    if (isBlocked) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    onConfirm(admin.id, activating);
    setLoading(false);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={activating ? "Activate Admin Account" : "Deactivate Admin Account"}
      description={`${admin.name} — ${rm.label}`}
      maxWidth="max-w-md"
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
            onClick={handleConfirm}
            disabled={loading || isBlocked}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              activating
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
            id="deactivate-confirm-btn"
          >
            {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {activating ? (
              <><Power size={14} /> Activate</>
            ) : (
              <><PowerOff size={14} /> Deactivate</>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Icon + Description */}
        <div className="flex gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${activating ? "bg-emerald-50" : "bg-amber-50"}`}>
            {activating
              ? <Power size={22} className="text-emerald-600" />
              : <PowerOff size={22} className="text-amber-600" />
            }
          </div>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            {activating
              ? `This will re-enable ${admin.name}'s account. They will be able to log in and access the admin portal based on their assigned role.`
              : `This will suspend ${admin.name}'s account. They will immediately lose access to the admin portal. Existing audit logs and history are preserved.`
            }
          </p>
        </div>

        {/* Safeguard warnings */}
        {isSelf && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <Shield size={14} className="mt-0.5 shrink-0 text-rose-500" />
            <p className="text-xs text-rose-700">
              You cannot deactivate your own account. Ask another Super Admin to perform this action.
            </p>
          </div>
        )}

        {!isSelf && isLastSuperAdmin && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <Shield size={14} className="mt-0.5 shrink-0 text-rose-500" />
            <p className="text-xs text-rose-700">
              Cannot deactivate — this is the <strong>last active Super Admin</strong> in the system. Promote another admin to Super Admin first.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
