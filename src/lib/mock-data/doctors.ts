import type { Doctor, DoctorDocument } from "@/types/doctor";
import type { DoctorUser } from "@/types/user";

//Shared document templates

const makeMCILicense = (
  id: string,
  doctorName: string,
  regNo: string,
  validUntil: string,
  uploadedAt: string
): DoctorDocument => ({
  id,
  name: "Medical Council Registration Certificate",
  type: "license",
  fileName: `mci_license_${regNo.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`,
  fileSize: "1.2 MB",
  uploadedAt,
  issuedBy: "Medical Council of India",
  certificateNumber: regNo,
  validUntil,
});

const makeDegree = (
  id: string,
  doctorName: string,
  degree: string,
  university: string,
  year: string,
  uploadedAt: string
): DoctorDocument => ({
  id,
  name: `${degree} Degree Certificate`,
  type: "degree",
  fileName: `${degree.toLowerCase().replace(/[\s,]+/g, "_")}_certificate.pdf`,
  fileSize: "2.1 MB",
  uploadedAt,
  issuedBy: university,
  certificateNumber: `CERT-${id.toUpperCase()}`,
  validUntil: `Permanent — Issued ${year}`,
});

// Doctor profile data — used for listing on the patient side 
export const doctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Prakash Das",
    specialization: "Sr. Psychologist",
    experience: 7,
    availability: "Available today",
    description: "Dr. Prakash Das has over 7 years of experience in psychological therapy and cognitive-behavioral treatment.",
    availableTime: "08:30 AM - 07:00 PM",
    image: "/doctor-1.png",
    email: "prakash@schedula.com",
    mobile: "9000000001",
    qualification: "MD (Psychiatry), MBBS",
    licenseNumber: "PSY1001",
    hospitalName: "Mindwell Wellness Center",
    gender: "Male",
    city: "Bengaluru",
    address: "12 Serenity Lane, Koramangala",
    clinic: {
      name: "Mindwell Wellness Center",
      address: "12 Serenity Lane, Koramangala, Bengaluru",
    },
    status: "active",
    verificationStatus: "approved",
    submittedAt: "2024-10-15T09:30:00Z",
    documents: [
      makeMCILicense("d1-lic", "Dr. Prakash Das", "PSY/MCI/1001/2017", "2029-10-14", "2024-10-15T09:30:00Z"),
      makeDegree("d1-deg", "Dr. Prakash Das", "MD Psychiatry", "NIMHANS, Bengaluru", "2017", "2024-10-15T09:35:00Z"),
    ],
  },
  {
    id: "doc-2",
    name: "Dr. Anika Rao",
    specialization: "General Physician",
    experience: 10,
    availability: "Available today",
    description: "Experienced general physician providing patient-focused, compassionate primary care for over a decade.",
    availableTime: "09:00 AM - 06:00 PM",
    image: "/doctor-2.png",
    email: "anika@schedula.com",
    mobile: "9000000002",
    qualification: "MBBS, MD (Internal Medicine)",
    licenseNumber: "GP2002",
    hospitalName: "City Center Clinic",
    gender: "Female",
    city: "Pune",
    address: "45 MG Road, Shivajinagar",
    clinic: {
      name: "City Center Clinic",
      address: "45 MG Road, Shivajinagar, Pune",
    },
    status: "active",
    verificationStatus: "approved",
    submittedAt: "2024-09-20T11:00:00Z",
    documents: [
      makeMCILicense("d2-lic", "Dr. Anika Rao", "GP/MCI/2002/2014", "2030-09-19", "2024-09-20T11:00:00Z"),
      makeDegree("d2-deg", "Dr. Anika Rao", "MBBS", "BJ Medical College, Pune", "2014", "2024-09-20T11:05:00Z"),
    ],
  },
  {
    id: "doc-3",
    name: "Dr. Martin Cole",
    specialization: "Dermatologist",
    experience: 8,
    availability: "Available today",
    description: "Specialized in modern skin and dermatology treatments for all skin types with evidence-based care.",
    availableTime: "10:00 AM - 05:00 PM",
    image: "/doctor-3.png",
    email: "martin@schedula.com",
    mobile: "9000000003",
    qualification: "MBBS, MD (Dermatology)",
    licenseNumber: "DERM3003",
    hospitalName: "Westside Skin & Aesthetics",
    gender: "Male",
    city: "Mumbai",
    address: "88 Hill Road, Bandra West",
    clinic: {
      name: "Westside Skin & Aesthetics",
      address: "88 Hill Road, Bandra West, Mumbai",
    },
    status: "active",
    verificationStatus: "approved",
    submittedAt: "2024-11-01T08:45:00Z",
    documents: [
      makeMCILicense("d3-lic", "Dr. Martin Cole", "DERM/MCI/3003/2016", "2028-10-31", "2024-11-01T08:45:00Z"),
      makeDegree("d3-deg", "Dr. Martin Cole", "MD Dermatology", "Grant Medical College, Mumbai", "2016", "2024-11-01T08:50:00Z"),
    ],
  },
  {
    id: "doc-4",
    name: "Dr. Sarah Wilson",
    specialization: "Cardiologist",
    experience: 12,
    availability: "Available tomorrow",
    description: "Experienced cardiologist focused on heart health, preventive cardiology, and cardiac rehabilitation.",
    availableTime: "09:30 AM - 04:30 PM",
    image: "/doctor-4.png",
    email: "sarah@schedula.com",
    mobile: "9000000004",
    qualification: "MBBS, MD (Cardiology), DM",
    licenseNumber: "CARD4004",
    hospitalName: "HeartCare Specialty Hospital",
    gender: "Female",
    city: "Hyderabad",
    address: "3 Cardiac Avenue, Jubilee Hills",
    clinic: {
      name: "HeartCare Specialty Hospital",
      address: "3 Cardiac Avenue, Jubilee Hills, Hyderabad",
    },
    status: "inactive",
    verificationStatus: "pending",
    submittedAt: "2026-09-10T14:20:00Z",
    documents: [
      makeMCILicense("d4-lic", "Dr. Sarah Wilson", "CARD/MCI/4004/2012", "2032-06-15", "2026-09-10T14:20:00Z"),
      makeDegree("d4-deg", "Dr. Sarah Wilson", "DM Cardiology", "AIIMS, New Delhi", "2012", "2026-09-10T14:25:00Z"),
    ],
  },
  {
    id: "doc-5",
    name: "Dr. Rajesh Sharma",
    specialization: "Orthopedic Surgeon",
    experience: 15,
    availability: "Available today",
    description: "Senior orthopedic surgeon specializing in joint replacement, sports injuries, and spine surgery.",
    availableTime: "08:00 AM - 03:00 PM",
    image: "",
    email: "rajesh@schedula.com",
    mobile: "9000000005",
    qualification: "MBBS, MS (Orthopaedics)",
    licenseNumber: "ORTH5005",
    hospitalName: "Apollo Orthocare",
    gender: "Male",
    city: "Chennai",
    address: "21 Anna Salai, Teynampet",
    clinic: {
      name: "Apollo Orthocare",
      address: "21 Anna Salai, Teynampet, Chennai",
    },
    status: "inactive",
    verificationStatus: "rejected",
    submittedAt: "2026-08-25T10:00:00Z",
    rejectionReason:
      "Medical Council Registration certificate scan is blurry and the registration number is illegible. Please provide a clear, high-resolution scanned copy of your MCI/State Council registration certificate. The certificate must clearly show your name, registration number, and validity date.",
    rejectionDate: "2026-09-02T16:30:00Z",
    documents: [
      makeMCILicense("d5-lic", "Dr. Rajesh Sharma", "ORTH/MCI/5005/2009", "2031-07-20", "2026-08-25T10:00:00Z"),
      makeDegree("d5-deg", "Dr. Rajesh Sharma", "MS Orthopaedics", "Madras Medical College", "2009", "2026-08-25T10:05:00Z"),
    ],
  },
  {
    id: "doc-6",
    name: "Dr. Meera Patel",
    specialization: "Pediatrician",
    experience: 9,
    availability: "Not available",
    description: "Caring pediatrician with 9 years of experience in child healthcare, vaccinations, and newborn care.",
    availableTime: "10:00 AM - 04:00 PM",
    image: "",
    email: "meera@schedula.com",
    mobile: "9000000006",
    qualification: "MBBS, MD (Pediatrics)",
    licenseNumber: "PED6006",
    hospitalName: "Rainbow Children's Hospital",
    gender: "Female",
    city: "Ahmedabad",
    address: "7 Nehru Nagar, Satellite",
    clinic: {
      name: "Rainbow Children's Hospital",
      address: "7 Nehru Nagar, Satellite, Ahmedabad",
    },
    status: "inactive",
    verificationStatus: "approved",
    submittedAt: "2025-01-10T09:00:00Z",
    documents: [
      makeMCILicense("d6-lic", "Dr. Meera Patel", "PED/MCI/6006/2015", "2031-01-09", "2025-01-10T09:00:00Z"),
      makeDegree("d6-deg", "Dr. Meera Patel", "MD Pediatrics", "B.J. Medical College, Ahmedabad", "2015", "2025-01-10T09:05:00Z"),
    ],
  },
];

// ── Doctor auth accounts — used for doctor login/signup ─────────────────────
// IDs match the doctor profile IDs above so they can be linked
export const mockDoctors: DoctorUser[] = [
  { id: "doc-1", name: "Dr. Prakash Das",   email: "prakash@schedula.com", mobile: "9000000001", password: "doctor123", role: "doctor", specialization: "Sr. Psychologist", experience: 7,  licenseNumber: "PSY1001"  },
  { id: "doc-2", name: "Dr. Anika Rao",     email: "anika@schedula.com",   mobile: "9000000002", password: "doctor123", role: "doctor", specialization: "General Physician",  experience: 10, licenseNumber: "GP2002"   },
  { id: "doc-3", name: "Dr. Martin Cole",   email: "martin@schedula.com",  mobile: "9000000003", password: "doctor123", role: "doctor", specialization: "Dermatologist",       experience: 8,  licenseNumber: "DERM3003" },
  { id: "doc-4", name: "Dr. Sarah Wilson",  email: "sarah@schedula.com",   mobile: "9000000004", password: "doctor123", role: "doctor", specialization: "Cardiologist",         experience: 12, licenseNumber: "CARD4004" },
  { id: "doc-5", name: "Dr. Rajesh Sharma", email: "rajesh@schedula.com",  mobile: "9000000005", password: "doctor123", role: "doctor", specialization: "Orthopedic Surgeon",   experience: 15, licenseNumber: "ORTH5005" },
  { id: "doc-6", name: "Dr. Meera Patel",   email: "meera@schedula.com",   mobile: "9000000006", password: "doctor123", role: "doctor", specialization: "Pediatrician",         experience: 9,  licenseNumber: "PED6006"  },
];

// localStorage override helpers (admin-managed status changes) 
const OVERRIDES_KEY = "schedula_doctor_overrides";

type DoctorOverride = {
  verificationStatus?: Doctor["verificationStatus"];
  status?: Doctor["status"];
  rejectionReason?: string;
  rejectionDate?: string;
  submittedAt?: string;
};

type OverridesMap = Record<string, DoctorOverride>;

function getOverrides(): OverridesMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as OverridesMap) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides: OverridesMap) {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore */
  }
}

/** Admin: approve or reject a doctor's verification (persisted to localStorage). */
export function updateDoctorVerification(
  id: string,
  status: "approved" | "rejected",
  reason?: string
) {
  const overrides = getOverrides();
  overrides[id] = {
    ...overrides[id],
    verificationStatus: status,
    status: status === "approved" ? "active" : "inactive",
    rejectionReason: status === "rejected" ? (reason ?? "") : undefined,
    rejectionDate: status === "rejected" ? new Date().toISOString() : undefined,
  };
  saveOverrides(overrides);
}

/** Admin: activate or deactivate a doctor's account (persisted to localStorage). */
export function updateDoctorAccountStatus(
  id: string,
  status: "active" | "inactive"
) {
  const overrides = getOverrides();
  const currentVerif =
    overrides[id]?.verificationStatus ??
    doctors.find((d) => d.id === id)?.verificationStatus;
  // If doctor's application is rejected or pending, account status cannot be activated
  if (status === "active" && (currentVerif === "rejected" || currentVerif === "pending")) {
    return;
  }
  overrides[id] = { ...overrides[id], status };
  saveOverrides(overrides);
}

/** Doctor: resubmit verification documents after rejection. */
export function resubmitDoctorVerification(id: string) {
  const overrides = getOverrides();
  overrides[id] = {
    ...overrides[id],
    verificationStatus: "pending",
    status: "inactive",
    rejectionReason: undefined,
    rejectionDate: undefined,
    submittedAt: new Date().toISOString(),
  };
  saveOverrides(overrides);
}

/**
 * getAllDoctors() — merges static mock doctors with any doctors registered
 * at runtime (stored in localStorage.registeredUsers), then applies any
 * admin status overrides (stored in schedula_doctor_overrides).
 * Safe to call only inside useEffect / client components.
 */
export function getAllDoctors(): Doctor[] {
  const result: Doctor[] = [...doctors];

  // Merge runtime registered doctors
  try {
    const stored = localStorage.getItem("registeredUsers");
    if (stored) {
      const users: Array<Record<string, unknown>> = JSON.parse(stored);
      users
        .filter((u) => u.role === "doctor")
        .forEach((u) => {
          const id   = u.id as string;
          const name = u.name as string;
          if (!result.find((d) => d.id === id)) {
            result.push({
              id,
              name,
              email: u.email as string | undefined,
              mobile: u.mobile as string | undefined,
              specialization: (u.specialization as string) || "General Physician",
              experience: Number(u.experience) || 0,
              licenseNumber: u.licenseNumber as string | undefined,
              qualification: u.qualification as string | undefined,
              hospitalName: u.hospitalName as string | undefined,
              city: u.city as string | undefined,
              address: u.address as string | undefined,
              gender: u.gender as string | undefined,
              availability: "Available",
              description: `${name} is a registered doctor on Schedula.`,
              availableTime: "09:00 AM - 05:00 PM",
              image: "",
              status: "inactive",
              verificationStatus: "pending", // new sign-ups await admin approval
              submittedAt: new Date().toISOString(),
            });
          }
        });
    }
  } catch {
    /* ignore — return static list */
  }

  // Apply admin overrides
  const overrides = getOverrides();
  return result.map((doctor) => {
    const override = overrides[doctor.id];
    const merged = override
      ? {
          ...doctor,
          ...(override.verificationStatus !== undefined && { verificationStatus: override.verificationStatus }),
          ...(override.status !== undefined && { status: override.status }),
          ...(override.rejectionReason !== undefined && { rejectionReason: override.rejectionReason }),
          ...(override.rejectionDate !== undefined && { rejectionDate: override.rejectionDate }),
          ...(override.submittedAt !== undefined && { submittedAt: override.submittedAt }),
        }
      : { ...doctor };

    // If a doctor's verification is pending or rejected, their account status must be inactive
    if (merged.verificationStatus === "pending" || merged.verificationStatus === "rejected") {
      merged.status = "inactive";
    }

    return merged;
  });
}