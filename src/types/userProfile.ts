// ── Per-user health profile stored in localStorage by userId ──────────────────

export type CurrentMedication = {
  name: string;
  dosage: string;
  frequency: string;
};

export type UserHealthProfile = {
  userId: string;

  // Physical
  bloodGroup: string;
  height: string; // in cm
  weight: string; // in kg

  // Medical
  medicalConditions: string[];
  allergies: string[];
  currentMedications: CurrentMedication[];

  // Insurance
  insuranceProvider: string;
  insurancePolicyNumber: string;

  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;

  updatedAt: string;
};
