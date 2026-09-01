import type { Appointment } from "@/types/appointment";


export function downloadPrescription(appointment: Appointment): void {
  const patientName = appointment.patient.name;
  const doctorName = appointment.clinician;
  const specialty = appointment.specialty;
  const date = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(appointment.startsAt));

  const prescription = getPrescriptionContent(appointment.id);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Prescription – ${patientName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; background: #fff; padding: 40px; max-width: 720px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0F8287; padding-bottom: 18px; margin-bottom: 24px; }
    .clinic-name { font-size: 26px; font-weight: bold; color: #0F8287; letter-spacing: 0.5px; }
    .clinic-sub { font-size: 12px; color: #555; margin-top: 4px; }
    .rx-symbol { font-size: 48px; color: #0F8287; font-style: italic; line-height: 1; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 6px; font-family: Arial, sans-serif; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8f9fa; border-radius: 8px; padding: 16px; }
    .info-item label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-family: Arial, sans-serif; display: block; margin-bottom: 2px; }
    .info-item span { font-size: 14px; color: #1a1a1a; font-weight: 600; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    .medications { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .med-header { background: #0F8287; color: white; padding: 10px 16px; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
    .med-item { padding: 14px 16px; border-bottom: 1px solid #f0f0f0; }
    .med-item:last-child { border-bottom: none; }
    .med-name { font-size: 15px; font-weight: bold; color: #0F8287; }
    .med-dosage { font-size: 12px; color: #555; margin-top: 3px; font-family: Arial, sans-serif; }
    .med-duration { font-size: 11px; color: #888; margin-top: 2px; font-family: Arial, sans-serif; }
    .notes { background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; font-size: 13px; line-height: 1.6; }
    .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
    .signature-line { border-top: 2px solid #1a1a1a; width: 200px; padding-top: 8px; text-align: center; font-family: Arial, sans-serif; font-size: 12px; color: #555; }
    .stamp { width: 80px; height: 80px; border: 3px solid #0F8287; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; color: #0F8287; font-size: 9px; font-weight: bold; font-family: Arial, sans-serif; letter-spacing: 1px; text-transform: uppercase; padding: 10px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="clinic-name">Schedula Clinic</div>
      <div class="clinic-sub">123 Medical Avenue, Healthcare District<br/>Phone: +91 98765 43210 | schedula.health</div>
    </div>
    <div class="rx-symbol">℞</div>
  </div>

  <div class="section">
    <div class="section-title">Patient Details</div>
    <div class="info-grid">
      <div class="info-item"><label>Patient Name</label><span>${patientName}</span></div>
      <div class="info-item"><label>Age</label><span>${appointment.patient.age} years</span></div>
      <div class="info-item"><label>Date</label><span>${date}</span></div>
      <div class="info-item"><label>Appointment ID</label><span>${appointment.id}</span></div>
      <div class="info-item"><label>Diagnosis</label><span>${appointment.reason}</span></div>
      <div class="info-item"><label>Type</label><span>${appointment.type ?? "Consultation"}</span></div>
    </div>
  </div>

  <hr class="divider" />

  <div class="section">
    <div class="section-title">Prescribed Medications</div>
    <div class="medications">
      <div class="med-header">Rx — Medications</div>
      ${prescription.medications.map((med) => `
      <div class="med-item">
        <div class="med-name">${med.name} ${med.strength}</div>
        <div class="med-dosage">📋 ${med.dosage}</div>
        <div class="med-duration">⏱ Duration: ${med.duration} &nbsp;|&nbsp; ${med.instructions}</div>
      </div>`).join("")}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Doctor's Notes</div>
    <div class="notes">${prescription.notes}</div>
  </div>

  <div class="footer">
    <div>
      <div class="signature-line">
        ${doctorName}<br/>${specialty}
      </div>
    </div>
    <div class="stamp">Schedula<br/>Clinic<br/>Verified</div>
  </div>
</body>
</html>`;

  // Create a blob and trigger download
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Prescription_${patientName.replace(/\s+/g, "_")}_${appointment.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Per-appointment prescription content ──────────────────────────────────────

type Medication = { name: string; strength: string; dosage: string; duration: string; instructions: string };
type PrescriptionContent = { medications: Medication[]; notes: string };

function getPrescriptionContent(appointmentId: string): PrescriptionContent {
  const prescriptions: Record<string, PrescriptionContent> = {
    "apt-1042": {
      medications: [
        { name: "Amoxicillin", strength: "500mg", dosage: "1 tablet, 3 times daily (after meals)", duration: "7 days", instructions: "Complete the full course" },
        { name: "Paracetamol", strength: "650mg", dosage: "1 tablet if fever/pain, max 3/day", duration: "5 days", instructions: "Do not exceed recommended dose" },
        { name: "Vitamin D3", strength: "60,000 IU", dosage: "1 sachet weekly", duration: "8 weeks", instructions: "Take with warm milk" },
      ],
      notes: "Patient presented with mild upper respiratory symptoms. Advised rest and adequate hydration. Follow-up in 7 days if symptoms persist. Avoid cold beverages and dusty environments.",
    },
    "apt-1046": {
      medications: [
        { name: "Metoprolol", strength: "25mg", dosage: "1 tablet, twice daily", duration: "30 days", instructions: "Take at the same time each day" },
        { name: "Aspirin", strength: "75mg", dosage: "1 tablet, once daily (after breakfast)", duration: "Ongoing", instructions: "Do not skip doses" },
        { name: "Atorvastatin", strength: "10mg", dosage: "1 tablet at bedtime", duration: "Ongoing", instructions: "Avoid grapefruit juice" },
      ],
      notes: "Cardiac evaluation completed. ECG within normal limits. Continue medications as prescribed. Low-salt diet recommended. Next review in 4 weeks.",
    },
    "apt-1048": {
      medications: [
        { name: "Sertraline", strength: "50mg", dosage: "1 tablet, once daily (morning)", duration: "30 days", instructions: "Do not discontinue abruptly" },
        { name: "Alprazolam", strength: "0.25mg", dosage: "1 tablet at bedtime if required", duration: "14 days", instructions: "Avoid alcohol" },
      ],
      notes: "Therapy session completed. Patient shows good progress. Relaxation techniques and mindfulness exercises recommended. Next session in 2 weeks. Emergency contact provided.",
    },
  };

  // Default prescription for any other appointment
  return prescriptions[appointmentId] ?? {
    medications: [
      { name: "Ibuprofen", strength: "400mg", dosage: "1 tablet, twice daily (after meals)", duration: "5 days", instructions: "Take with food" },
      { name: "Multivitamin Complex", strength: "—", dosage: "1 tablet, once daily", duration: "30 days", instructions: "Best taken in the morning" },
    ],
    notes: "General consultation completed. Patient advised to maintain a healthy diet, exercise regularly, and stay hydrated. Return if symptoms worsen.",
  };
}
