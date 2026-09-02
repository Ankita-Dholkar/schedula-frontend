"use client";

import { useEffect, useState } from "react";
import DoctorPortalHeader from "@/features/doctor-portal/components/DoctorPortalHeader";
import PrescriptionEditor from "@/features/doctor-portal/components/PrescriptionEditor";
import { getAllAppointments } from "@/lib/mock-data/appointments";
import { getPrescription } from "@/lib/mock-data/prescriptions";
import type { Appointment } from "@/types/appointment";
import type { Prescription } from "@/types/prescription";
import { ClipboardList, CheckCircle, Search } from "lucide-react";

type StoredUser = { id: string; name: string; email: string; role: string };

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export default function DoctorPrescriptionsDashboard() {
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [doctorUser, setDoctorUser] = useState<StoredUser | null>(null);
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const refreshData = () => {
    try {
      const stored = localStorage.getItem("loggedInUser");
      if (stored) {
        const user: StoredUser = JSON.parse(stored);
        setDoctorUser(user);
        // Only get completed appointments for this doctor
        const mine = getAllAppointments().filter((a) => a.clinician === user.name && a.status === "completed");
        // Sort descending by date
        mine.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
        setCompletedAppointments(mine);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOpenEditor = (apt: Appointment) => {
    const existing = getPrescription(apt.id);
    setActivePrescription(existing);
    setSelectedAppointment(apt);
  };

  const handleCloseEditor = () => {
    setSelectedAppointment(null);
    setActivePrescription(null);
    refreshData();
  };

  const filtered = completedAppointments.filter((a) => 
    a.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <DoctorPortalHeader title="Prescriptions" />

      <main className="flex-1 flex flex-col p-6 min-h-0">
        {selectedAppointment && doctorUser ? (
          <div className="flex-1 min-h-0">
            <PrescriptionEditor
              appointmentId={selectedAppointment.id}
              doctorId={doctorUser.id}
              patientId={selectedAppointment.patient.name} // Note: mock data might not have patientId, using name as stand-in
              patientName={selectedAppointment.patient.name}
              existingPrescription={activePrescription}
              onBack={handleCloseEditor}
              onSaved={handleCloseEditor}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white rounded-xl border border-[var(--line)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--line)] bg-[var(--canvas)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--ink)]">Completed Consultations</h2>
                <p className="text-sm text-[var(--muted)] mt-0.5">Manage and issue prescriptions for past appointments.</p>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  placeholder="Search patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-lg border border-[var(--line)] bg-white text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <ClipboardList size={40} className="text-[var(--line)] mb-4" strokeWidth={1.5} />
                  <p className="font-medium text-[var(--ink)]">No completed appointments found</p>
                  <p className="text-sm text-[var(--muted)] mt-1 max-w-sm">
                    Once you mark an appointment as 'Completed' from the dashboard, it will appear here for prescription management.
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-stone-50 border-b border-[var(--line)] sticky top-0">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-[var(--muted)] uppercase tracking-wider text-xs">Patient & Date</th>
                      <th className="px-6 py-3 font-semibold text-[var(--muted)] uppercase tracking-wider text-xs">Reason</th>
                      <th className="px-6 py-3 font-semibold text-[var(--muted)] uppercase tracking-wider text-xs">Status</th>
                      <th className="px-6 py-3 font-semibold text-[var(--muted)] uppercase tracking-wider text-xs text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {filtered.map((apt) => {
                      const hasPrescription = !!getPrescription(apt.id);
                      return (
                        <tr key={apt.id} className="hover:bg-stone-50 transition group">
                          <td className="px-6 py-4">
                            <p className="font-medium text-[var(--ink)]">{apt.patient.name}</p>
                            <p className="text-xs text-[var(--muted)] mt-0.5">{formatDate(apt.startsAt)}</p>
                          </td>
                          <td className="px-6 py-4 text-[var(--muted)]">
                            {apt.reason}
                          </td>
                          <td className="px-6 py-4">
                            {hasPrescription ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                <CheckCircle size={12} /> Prescribed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenEditor(apt)}
                              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                                hasPrescription 
                                  ? "border border-[var(--line)] text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)] bg-white"
                                  : "bg-[var(--brand)] text-white hover:bg-[var(--brand-deep)]"
                              }`}
                            >
                              {hasPrescription ? "View / Edit" : "Create Prescription"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
