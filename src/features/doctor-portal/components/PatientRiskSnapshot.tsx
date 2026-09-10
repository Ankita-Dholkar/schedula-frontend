"use client";

import { useMemo } from "react";
import { AlertCircle, Calendar, Activity, Pill, Clock } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { Prescription } from "@/types/prescription";
import { useAppSelector } from "@/store/hooks";

type Props = {
  appointment: Appointment;
};

export default function PatientRiskSnapshot({ appointment }: Props) {
  const allAppointments = useAppSelector((state) => state.appointments.appointments);
  const prescriptionsObj = useAppSelector((state) => state.prescriptions.prescriptions);

  const snapshot = useMemo(() => {
    // 1. Filter past history
    // We match by patient name as a fallback since Appointment type lacks a unique patient ID currently.
    const currentStartsAt = new Date(appointment.startsAt).getTime();
    const pastAppointments = allAppointments.filter((a) => {
      // Must be the same patient, but strictly before this appointment
      return a.patient.name === appointment.patient.name &&
             new Date(a.startsAt).getTime() < currentStartsAt &&
             a.id !== appointment.id;
    });

    if (pastAppointments.length === 0) {
      return null; // Signals First-Time Patient
    }

    // 2. Classify statuses
    const completedApts = pastAppointments.filter((a) => a.status === "completed");
    const missedApts = pastAppointments.filter((a) => a.status === "missed");
    // 'cancelled' appointments are ignored entirely for visits/misses count

    // 3. Last visit date
    const sortedCompleted = [...completedApts].sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
    );
    const lastVisitDate = sortedCompleted.length > 0 ? sortedCompleted[0].startsAt : null;

    // 4. Recurring complaints
    const complaintsMap: Record<string, number> = {};
    pastAppointments.forEach((a) => {
      if (!a.reason) return;
      // Basic text normalization
      const normalizedReason = a.reason.toLowerCase().trim();
      complaintsMap[normalizedReason] = (complaintsMap[normalizedReason] || 0) + 1;
    });
    // Filter to only those occurring more than once, and find their original casing
    const recurringComplaints = Object.entries(complaintsMap)
      .filter(([_, count]) => count > 1)
      .map(([reasonLow, count]) => {
        // Find an original casing for display
        const original = pastAppointments.find(a => a.reason?.toLowerCase().trim() === reasonLow)?.reason || reasonLow;
        return { reason: original, count };
      });

    // 5. Ongoing Conditions & Recent Medications
    // Find prescriptions linked to the patient's completed historical appointments
    const completedPrescriptions: Prescription[] = [];
    sortedCompleted.forEach((a) => {
      const rx = prescriptionsObj[a.id];
      if (rx) {
        completedPrescriptions.push(rx);
      }
    });

    // They are already sorted by appointment date because sortedCompleted is sorted by startsAt descending.
    // Thus completedPrescriptions[0] is the most recent prescription.
    const recentPrescription = completedPrescriptions.length > 0 ? completedPrescriptions[0] : null;
    const recentMedications = recentPrescription?.medications || [];

    // Ongoing Conditions (chronic) across ALL historical prescriptions for this patient
    const allHistoricalPrescriptions = pastAppointments
      .map(a => prescriptionsObj[a.id])
      .filter(Boolean) as Prescription[];
      
    const ongoingConditionsSet = new Set<string>();
    allHistoricalPrescriptions.forEach(rx => {
      if (rx.diagnosisType === "chronic" && rx.diagnosis) {
        ongoingConditionsSet.add(rx.diagnosis);
      }
    });
    const ongoingConditions = Array.from(ongoingConditionsSet);

    return {
      previousVisits: completedApts.length,
      missedAppointments: missedApts.length,
      lastVisitDate,
      recurringComplaints,
      ongoingConditions,
      recentMedications,
    };
  }, [appointment, allAppointments, prescriptionsObj]);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));

  if (!snapshot) {
    return (
      <div className="mb-6 rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-5 text-center">
        <h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">Patient Risk Snapshot</h3>
        <p className="text-sm font-medium text-[var(--muted)]">First Visit — No previous patient history is available.</p>
      </div>
    );
  }

  const needsAttention = snapshot.missedAppointments > 0 || snapshot.ongoingConditions.length > 0 || snapshot.recurringComplaints.length > 0;

  return (
    <div className={`mb-6 rounded-xl border p-5 shadow-sm ${needsAttention ? "border-amber-200 bg-amber-50" : "border-[var(--line)] bg-[var(--canvas)]"}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
          <Activity size={16} className={needsAttention ? "text-amber-600" : "text-[var(--brand)]"} />
          Patient Risk Snapshot
        </h3>
        {needsAttention && (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <AlertCircle size={12} /> Attention Required
          </span>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 text-[var(--ink)]">
          <Calendar size={14} className="text-[var(--muted)]" />
          <span className="font-semibold">{snapshot.previousVisits}</span> <span className="text-[var(--muted)]">Previous Visits</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--ink)]">
          <AlertCircle size={14} className="text-[var(--muted)]" />
          <span className="font-semibold">{snapshot.missedAppointments}</span> <span className="text-[var(--muted)]">Missed Appointments</span>
        </div>
        {snapshot.lastVisitDate && (
          <div className="flex items-center gap-2 text-[var(--ink)]">
            <Clock size={14} className="text-[var(--muted)]" />
            <span className="text-[var(--muted)]">Last Visit:</span> <span className="font-semibold">{formatDate(snapshot.lastVisitDate)}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {snapshot.recurringComplaints.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Recurring Complaints</h4>
            <ul className="space-y-1 text-sm text-[var(--ink)]">
              {snapshot.recurringComplaints.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {c.reason} — <span className="font-medium">{c.count} visits</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {snapshot.ongoingConditions.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Ongoing Conditions</h4>
            <ul className="space-y-1 text-sm text-[var(--ink)]">
              {snapshot.ongoingConditions.map((cond, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span className="font-medium">{cond}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {snapshot.recentMedications.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Recent Medications</h4>
            <ul className="space-y-1 text-sm text-[var(--ink)]">
              {snapshot.recentMedications.map((med, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Pill size={14} className="mt-0.5 shrink-0 text-blue-500" />
                  <span>
                    <span className="font-medium">{med.name}</span>
                    {med.dosage && <span className="text-[var(--muted)]"> ({med.dosage})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {snapshot.recurringComplaints.length === 0 && snapshot.ongoingConditions.length === 0 && snapshot.recentMedications.length === 0 && (
           <p className="text-sm text-[var(--muted)]">No recurring conditions or recent medications recorded.</p>
        )}
      </div>
    </div>
  );
}
