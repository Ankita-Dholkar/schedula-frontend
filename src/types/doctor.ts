export type DoctorVerificationStatus = "pending" | "approved" | "rejected" | "verified";

export type DoctorAccountStatus = "active" | "inactive";

export type DoctorDocument = {
  id: string;
  /** Human-readable document name */
  name: string;
  type: "license" | "degree" | "id_proof" | "other";
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  /** Optional URL for preview (mock: will render a simulated certificate) */
  previewUrl?: string;
  /** Issuing authority / registration body */
  issuedBy?: string;
  /** Registration / certificate number */
  certificateNumber?: string;
  /** Validity period */
  validUntil?: string;
};

export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  availability: string;
  description: string;
  availableTime: string;
  image: string;
  /** Primary clinic / hospital where appointments are conducted. */
  clinic?: {
    name: string;
    address?: string;
  };

  // ── Contact & profile (from registration / profile edits) ──
  email?: string;
  mobile?: string;
  qualification?: string;
  licenseNumber?: string;
  hospitalName?: string;
  address?: string;
  city?: string;
  gender?: string;
  dob?: string;

  // ── Admin-managed status fields ──
  /**
   * Account status — controls visibility to patients.
   * - active:   visible and bookable by patients
   * - inactive: hidden from patient search / booking
   * Defaults to "active" for all static doctors.
   */
  status?: DoctorAccountStatus;

  /**
   * Verification status managed by the Admin Portal.
   * - pending:  newly registered or resubmitted, awaiting admin review
   * - approved: admin approved; patient-facing "Verified Doctor" badge shown
   * - rejected: admin rejected; rejection reason stored; doctor can resubmit
   * - verified: legacy alias for approved (backward compatible)
   */
  verificationStatus?: DoctorVerificationStatus;

  /** Reason provided by admin when rejecting verification. */
  rejectionReason?: string;

  /** ISO date when the admin rejected this doctor's verification. */
  rejectionDate?: string;

  /** ISO date when the doctor last submitted their verification documents. */
  submittedAt?: string;

  /** Submitted qualification / license documents for admin review. */
  documents?: DoctorDocument[];
};