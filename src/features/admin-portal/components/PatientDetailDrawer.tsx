"use client";

import { useState, useMemo } from "react";
import {
  X, Mail, Phone, MapPin, User, Heart, Calendar,
  Activity, AlertCircle, Pill, Shield, Users,
  Power, PowerOff, CalendarDays, Video, Building2,
  CreditCard, Clock, Stethoscope,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import ConfirmationDialog from "./ConfirmationDialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setPatientAccountStatus, refreshPatients } from "@/store/slices/patientsSlice";
import { logAdminAction } from "@/store/slices/auditLogsSlice";
import { getAuditActor } from "@/types/auditLog";
import { getUserHealthProfile } from "@/lib/mock-data/userProfiles";
import { getComputedAppointmentStatus } from "@/lib/mock-data/appointments";
import { hasPermission } from "@/lib/admin/permissions";
import type { PatientUser } from "@/types/user";

type Props = {
  patient: PatientUser | null;
  open: boolean;
  onClose: () => void;
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--canvas)]">
        <Icon size={13} className="text-[var(--muted)]" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
        <p className="text-sm text-[var(--ink)] break-words">{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
      {children}
    </p>
  );
}

function TagList({ items, color = "slate" }: { items: string[]; color?: string }) {
  if (!items.length) return <p className="text-xs text-[var(--muted)]">None recorded</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium
            ${color === "red"    ? "border-red-200 bg-red-50 text-red-700"       : ""}
            ${color === "blue"   ? "border-blue-200 bg-blue-50 text-blue-700"    : ""}
            ${color === "slate"  ? "border-slate-200 bg-slate-50 text-slate-700" : ""}
          `}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function getStatusConfig(status: string): { label: string; variant: BadgeVariant } {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    confirmed:       { label: "Confirmed",     variant: "confirmed" },
    upcoming:        { label: "Upcoming",      variant: "confirmed" },
    "starting-soon": { label: "Starting Soon", variant: "confirmed" },
    live:            { label: "Live",          variant: "live"      },
    pending:         { label: "Pending",       variant: "pending"   },
    completed:       { label: "Completed",     variant: "completed" },
    cancelled:       { label: "Cancelled",     variant: "cancelled" },
    missed:          { label: "Missed",        variant: "missed"    },
  };
  return map[status] ?? { label: status, variant: "default" };
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

export default function PatientDetailDrawer({ patient, open, onClose }: Props) {
  const dispatch = useAppDispatch();
  const allAppointments = useAppSelector((s) => s.appointments.appointments);
  const currentAdmin = useAppSelector((s) => s.adminAuth.admin);
  const canEditPatients = hasPermission(currentAdmin, "patients", "edit");

  const [dialog, setDialog] = useState<"activate_patient" | "deactivate_patient" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Patient appointments (matched by name, matching the existing appointment data model)
  const patientAppointments = useMemo(() => {
    if (!patient) return [];
    return allAppointments
      .filter((a) => a.patient.name === patient.name)
      .map((a) => ({ ...a, _computed: getComputedAppointmentStatus(a) }))
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  }, [allAppointments, patient]);

  // Health profile (from localStorage if patient has filled it)
  const healthProfile = useMemo(() => {
    if (!patient) return null;
    try { return getUserHealthProfile(patient.id); } catch { return null; }
  }, [patient]);

  const isActive = patient?.accountStatus !== "inactive";

  const handleConfirm = async () => {
    if (!patient || !dialog) return;
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const newStatus = dialog === "activate_patient" ? "active" : "inactive";
    dispatch(setPatientAccountStatus({
      id: patient.id,
      accountStatus: newStatus,
    }));
    dispatch(logAdminAction({
      actor: getAuditActor(currentAdmin),
      action: "PATIENT_STATUS_TOGGLED",
      entityType: "patient",
      entityId: patient.id,
      entityName: patient.name,
      details: `Patient account for ${patient.name} ${newStatus === "active" ? "activated" : "deactivated"} by admin.`,
      metadata: { previousStatus: newStatus === "active" ? "inactive" : "active", newStatus },
      ipAddress: "127.0.0.1",
      severity: newStatus === "inactive" ? "warning" : "info",
    }));
    dispatch(refreshPatients());
    setActionLoading(false);
    setDialog(null);
    onClose();
  };

  if (!open || !patient) return null;

  const initials = patient.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Patient details — ${patient.name}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[500px] flex-col bg-white shadow-2xl border-l border-[var(--line)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--ink)]">Patient Profile</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)] transition-colors"
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── Identity ── */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white text-lg font-bold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-[var(--ink)]">{patient.name}</h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                ID: <span className="font-mono font-medium">{patient.id}</span>
              </p>
              {patient.registeredAt && (
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Registered {fmtDate(patient.registeredAt)}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge
                  variant={isActive ? "active" : "inactive"}
                  label={isActive ? "Active" : "Inactive"}
                  dot
                />
                {patient.bloodGroup && (
                  <Badge variant="default" label={`Blood: ${patient.bloodGroup}`} />
                )}
              </div>
            </div>
          </div>

          {/* ── Personal Information ── */}
          <section>
            <SectionHeader>Personal Information</SectionHeader>
            <div className="space-y-3">
              <InfoRow icon={Mail}     label="Email"        value={patient.email} />
              <InfoRow icon={Phone}    label="Mobile"       value={patient.mobile} />
              <InfoRow icon={User}     label="Gender"       value={patient.gender} />
              <InfoRow icon={Calendar} label="Date of Birth" value={patient.dateOfBirth ? fmtDate(patient.dateOfBirth) : undefined} />
              <InfoRow icon={User}     label="Age"          value={patient.age ? `${patient.age} years` : undefined} />
              <InfoRow icon={MapPin}   label="Address"      value={patient.address} />
              <InfoRow icon={Heart}    label="Blood Group"  value={patient.bloodGroup} />
            </div>
          </section>

          {/* ── Emergency Contact ── */}
          {patient.emergencyContact && (
            <section>
              <SectionHeader>Emergency Contact</SectionHeader>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-4 space-y-2">
                <InfoRow icon={Users}  label="Name"     value={patient.emergencyContact.name} />
                <InfoRow icon={Phone}  label="Phone"    value={patient.emergencyContact.phone} />
                <InfoRow icon={User}   label="Relation" value={patient.emergencyContact.relation} />
              </div>
            </section>
          )}

          {/* ── Health Profile ── */}
          {healthProfile && (
            <section>
              <SectionHeader>Health Profile</SectionHeader>
              <div className="space-y-4">
                {healthProfile.medicalConditions.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-[var(--muted)]">Medical Conditions</p>
                    <TagList items={healthProfile.medicalConditions} color="red" />
                  </div>
                )}
                {healthProfile.allergies.length > 0 && (
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
                      <AlertCircle size={12} /> Allergies
                    </p>
                    <TagList items={healthProfile.allergies} color="red" />
                  </div>
                )}
                {healthProfile.currentMedications.length > 0 && (
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
                      <Pill size={12} /> Current Medications
                    </p>
                    <div className="space-y-1.5">
                      {healthProfile.currentMedications.map((m, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs">
                          <span className="font-medium text-[var(--ink)]">{m.name}</span>
                          <span className="text-[var(--muted)]">{m.dosage} · {m.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(healthProfile.insuranceProvider || healthProfile.insurancePolicyNumber) && (
                  <div>
                    <InfoRow icon={Shield} label="Insurance Provider"    value={healthProfile.insuranceProvider} />
                    <div className="mt-2">
                      <InfoRow icon={Shield} label="Insurance Policy No." value={healthProfile.insurancePolicyNumber} />
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Appointment History ── */}
          <section>
            <SectionHeader>
              Appointment History ({patientAppointments.length})
            </SectionHeader>
            {patientAppointments.length === 0 ? (
              <div className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] py-8 text-center">
                <CalendarDays size={24} className="mx-auto mb-2 text-[var(--muted)]" strokeWidth={1.5} />
                <p className="text-xs text-[var(--muted)]">No appointments found for this patient.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {patientAppointments.map((apt) => {
                  const { label, variant } = getStatusConfig(apt._computed as string);
                  return (
                    <div
                      key={apt.id}
                      className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-4"
                    >
                      {/* Row 1: Doctor + status badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--ink)] truncate">{apt.clinician}</p>
                          <p className="text-xs text-[var(--muted)]">{apt.specialty}</p>
                        </div>
                        <Badge variant={variant} label={label} />
                      </div>
                      {/* Row 2: Mode + date/time */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                        <span className="flex items-center gap-1">
                          {apt.appointmentMode === "online"
                            ? <><Video size={11} /> Online</>
                            : <><Building2 size={11} /> In-person</>
                          }
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {fmtDate(apt.startsAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {fmtTime(apt.startsAt)}
                        </span>
                      </div>
                      {/* Row 3: Fee + payment */}
                      {(apt.consultationFee || apt.paymentStatus) && (
                        <div className="mt-2 flex items-center gap-3 text-xs">
                          {apt.consultationFee && (
                            <span className="flex items-center gap-1 text-[var(--muted)]">
                              <CreditCard size={11} />
                              ₹{apt.consultationFee}
                            </span>
                          )}
                          {apt.paymentStatus && (
                            <span className={`rounded-full px-2 py-0.5 font-medium
                              ${apt.paymentStatus === "paid"    ? "bg-emerald-50 text-emerald-700" : ""}
                              ${apt.paymentStatus === "pending" ? "bg-amber-50 text-amber-700"    : ""}
                              ${apt.paymentStatus === "failed"  ? "bg-red-50 text-red-700"        : ""}
                            `}>
                              {apt.paymentStatus.charAt(0).toUpperCase() + apt.paymentStatus.slice(1)}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Row 4: Reason */}
                      <div className="mt-2 flex items-start gap-1 text-xs text-[var(--muted)]">
                        <Stethoscope size={11} className="mt-0.5 shrink-0" />
                        <span className="truncate">{apt.reason}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── Action Footer ── */}
        {canEditPatients && (
          <div className="border-t border-[var(--line)] px-6 py-4">
            {isActive ? (
              <button
                onClick={() => setDialog("deactivate_patient")}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <PowerOff size={15} /> Deactivate Account
              </button>
            ) : (
              <button
                onClick={() => setDialog("activate_patient")}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <Power size={15} /> Activate Account
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Confirmation Dialog */}
      {dialog && (
        <ConfirmationDialog
          open={!!dialog}
          onClose={() => setDialog(null)}
          mode={dialog}
          entityName={patient.name}
          onConfirm={handleConfirm}
          loading={actionLoading}
        />
      )}
    </>
  );
}
