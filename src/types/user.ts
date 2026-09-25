export type Role = "patient" | "doctor" | "admin";

export type BaseUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  password?: string;
  role: Role;
};

export type PatientUser = BaseUser & {
  role: "patient";
  /** Admin-managed account status. Defaults to "active". */
  accountStatus?: "active" | "inactive";
  gender?: "Male" | "Female" | "Other" | "Prefer not to say" | string;
  age?: number;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  /** ISO timestamp of when the patient registered. */
  registeredAt?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
};

export type DoctorUser = BaseUser & {
  role: "doctor";
  specialization?: string;
  experience?: number;
  licenseNumber?: string;
  consultationFee?: number;
  checkupFee?: number;
};

export type AdminUser = BaseUser & {
  role: "admin";
  isActive: boolean;
};

export type User = PatientUser | DoctorUser | AdminUser;
