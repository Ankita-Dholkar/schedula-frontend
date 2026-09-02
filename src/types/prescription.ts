export type Medication = {
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
};

export type Prescription = {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  diagnosis: string;
  medications: Medication[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};
