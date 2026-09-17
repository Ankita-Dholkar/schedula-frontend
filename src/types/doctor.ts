export type DoctorVerificationStatus = "pending" | "verified";

export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  availability: string;
  description: string;
  availableTime: string;
  image: string;
  /** Primary clinic where in-person appointments are conducted. */
  clinic?: {
    name: string;
    address?: string;
  };
  /**
   * Verification status managed by the Admin Portal.
   * - pending:  newly registered, awaiting admin review
   * - verified: approved by admin, visible to patients and active on the platform
   * Defaults to "pending" for runtime-registered doctors.
   */
  verificationStatus?: DoctorVerificationStatus;
};