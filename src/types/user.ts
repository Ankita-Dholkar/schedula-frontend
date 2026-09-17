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
};

export type DoctorUser = BaseUser & {
  role: "doctor";
  specialization?: string;
  experience?: number;
  licenseNumber?: string;
};

export type AdminUser = BaseUser & {
  role: Role;
};

export type User = PatientUser | DoctorUser | AdminUser;
