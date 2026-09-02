"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Save, FileText } from "lucide-react";
import type { Prescription, Medication } from "@/types/prescription";
import { savePrescription, updatePrescription } from "@/lib/mock-data/prescriptions";
import Toast from "@/features/auth/components/Toast";

type Props = {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  existingPrescription: Prescription | null;
  onBack: () => void;
  onSaved: () => void;
};

const emptyMedication: Medication = {
  name: "",
  dosage: "",
  duration: "",
  instructions: "",
};

export default function PrescriptionEditor({
  appointmentId,
  doctorId,
  patientId,
  patientName,
  existingPrescription,
  onBack,
  onSaved,
}: Props) {
  const [diagnosis, setDiagnosis] = useState(existingPrescription?.diagnosis || "");
  const [notes, setNotes] = useState(existingPrescription?.notes || "");
  const [medications, setMedications] = useState<Medication[]>(
    existingPrescription?.medications?.length ? existingPrescription.medications : [{ ...emptyMedication }]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const addMedication = () => setMedications([...medications, { ...emptyMedication }]);
  
  const removeMedication = (index: number) => {
    if (medications.length === 1) return; // keep at least one
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const newMeds = [...medications];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setMedications(newMeds);
  };

  const handleSave = async () => {
    if (!diagnosis.trim()) {
      setToast({ message: "Diagnosis is required.", type: "error" });
      return;
    }

    const hasEmptyMed = medications.some((m) => !m.name.trim() || !m.dosage.trim());
    if (hasEmptyMed) {
      setToast({ message: "Please fill in all medication names and dosages, or remove empty rows.", type: "error" });
      return;
    }

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));

    const prescriptionData: Prescription = {
      appointmentId,
      doctorId,
      patientId,
      diagnosis,
      medications,
      notes,
      createdAt: existingPrescription?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingPrescription) {
      updatePrescription(appointmentId, prescriptionData);
    } else {
      savePrescription(prescriptionData);
    }

    setIsSaving(false);
    setToast({ message: "Prescription saved successfully!", type: "success" });
    
    // Give a small delay before returning to list
    setTimeout(() => onSaved(), 1000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-[var(--line)] overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--canvas)] shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1.5 rounded-full text-[var(--muted)] hover:bg-stone-200 transition">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)] flex items-center gap-2">
              <FileText size={18} className="text-[var(--brand)]" />
              {existingPrescription ? "Edit Prescription" : "Create Prescription"}
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Patient: <strong className="text-[var(--ink)]">{patientName}</strong></p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-deep)] disabled:opacity-70"
        >
          {isSaving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save size={15} />}
          Save
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/30">
        
        {/* Diagnosis */}
        <div className="bg-white p-5 rounded-xl border border-[var(--line)] shadow-sm">
          <label className="block text-sm font-semibold text-[var(--ink)] mb-2">Primary Diagnosis <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Acute Bronchitis"
            className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>

        {/* Medications */}
        <div className="bg-white p-5 rounded-xl border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-semibold text-[var(--ink)]">Medications</label>
            <button
              onClick={addMedication}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--brand)] hover:underline"
            >
              <Plus size={14} /> Add Medicine
            </button>
          </div>

          <div className="space-y-4">
            {medications.map((med, index) => (
              <div key={index} className="relative grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border border-stone-200 rounded-lg bg-stone-50 group">
                {medications.length > 1 && (
                  <button
                    onClick={() => removeMedication(index)}
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm border border-red-200 hover:bg-red-200"
                    title="Remove"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">Medicine Name & Strength</label>
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) => updateMedication(index, "name", e.target.value)}
                    placeholder="e.g. Amoxicillin 500mg"
                    className="w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                  />
                </div>
                
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">Dosage</label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                    placeholder="e.g. 1-0-1 (Twice daily)"
                    className="w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">Duration</label>
                  <input
                    type="text"
                    value={med.duration}
                    onChange={(e) => updateMedication(index, "duration", e.target.value)}
                    placeholder="e.g. 5 days"
                    className="w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">Instructions</label>
                  <input
                    type="text"
                    value={med.instructions}
                    onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                    placeholder="e.g. After meals"
                    className="w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor's Notes */}
        <div className="bg-white p-5 rounded-xl border border-[var(--line)] shadow-sm">
          <label className="block text-sm font-semibold text-[var(--ink)] mb-2">Doctor's Notes / Advice</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add any general advice, dietary restrictions, or follow-up instructions..."
            className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] resize-none"
          />
        </div>
      </div>
    </div>
  );
}
