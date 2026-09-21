import type { PatientUser } from "@/types/user";
import { getUserHealthProfile } from "./userProfiles";

const ACCOUNT_STATUS_KEY = "patientAccountStatuses";

// Mock patient accounts — used for login/signup auth and Admin Patient Management
export const mockPatients: PatientUser[] = [
  {
    id: "pat-1",
    name: "Alex Smith",
    email: "alex@example.com",
    mobile: "9876543210",
    password: "password123",
    role: "patient",
    gender: "Male",
    age: 32,
    dateOfBirth: "1993-04-15",
    bloodGroup: "O+",
    address: "12 Baker Street, Andheri West, Mumbai - 400053",
    registeredAt: "2025-11-02T08:30:00Z",
    emergencyContact: { name: "Sarah Smith", phone: "9876500001", relation: "Spouse" },
  },
  {
    id: "pat-2",
    name: "Priya Sharma",
    email: "priya@example.com",
    mobile: "9876543212",
    password: "password123",
    role: "patient",
    gender: "Female",
    age: 29,
    dateOfBirth: "1996-07-22",
    bloodGroup: "B+",
    address: "58 Jubilee Hills, Hyderabad - 500033",
    registeredAt: "2025-11-15T10:00:00Z",
    emergencyContact: { name: "Rajesh Sharma", phone: "9876500002", relation: "Father" },
  },
  {
    id: "pat-3",
    name: "Maya Patel",
    email: "maya@example.com",
    mobile: "9876543213",
    password: "password123",
    role: "patient",
    gender: "Female",
    age: 34,
    dateOfBirth: "1991-03-08",
    bloodGroup: "A+",
    address: "22 Koramangala, Bengaluru - 560034",
    registeredAt: "2025-12-01T09:15:00Z",
    emergencyContact: { name: "Vikram Patel", phone: "9876500003", relation: "Husband" },
  },
  {
    id: "pat-4",
    name: "Ethan Brooks",
    email: "ethan@example.com",
    mobile: "9876543214",
    password: "password123",
    role: "patient",
    gender: "Male",
    age: 41,
    dateOfBirth: "1984-09-12",
    bloodGroup: "AB-",
    address: "33 Shivajinagar, Pune - 411005",
    registeredAt: "2025-12-10T14:00:00Z",
    emergencyContact: { name: "Linda Brooks", phone: "9876500004", relation: "Wife" },
  },
  {
    id: "pat-5",
    name: "Sofia Chen",
    email: "sofia@example.com",
    mobile: "9876543215",
    password: "password123",
    role: "patient",
    gender: "Female",
    age: 28,
    dateOfBirth: "1997-01-30",
    bloodGroup: "O-",
    address: "7 Salt Lake City, Kolkata - 700091",
    registeredAt: "2026-01-05T11:20:00Z",
    emergencyContact: { name: "Wei Chen", phone: "9876500005", relation: "Brother" },
  },
  {
    id: "pat-6",
    name: "Noah Williams",
    email: "noah@example.com",
    mobile: "9876543216",
    password: "password123",
    role: "patient",
    gender: "Male",
    age: 52,
    dateOfBirth: "1973-06-18",
    bloodGroup: "A-",
    address: "19 Sector 12, Dwarka, New Delhi - 110078",
    registeredAt: "2026-01-20T08:00:00Z",
    emergencyContact: { name: "Emma Williams", phone: "9876500006", relation: "Daughter" },
  },
  {
    id: "pat-7",
    name: "James Turner",
    email: "james@example.com",
    mobile: "9876543217",
    password: "password123",
    role: "patient",
    gender: "Male",
    age: 60,
    dateOfBirth: "1965-11-04",
    bloodGroup: "B-",
    address: "45 MG Road, Kochi - 682016",
    registeredAt: "2026-02-01T13:30:00Z",
    emergencyContact: { name: "Catherine Turner", phone: "9876500007", relation: "Wife" },
  },
  {
    id: "pat-8",
    name: "Lena Moore",
    email: "lena@example.com",
    mobile: "9876543218",
    password: "password123",
    role: "patient",
    gender: "Female",
    age: 35,
    dateOfBirth: "1990-05-25",
    bloodGroup: "AB+",
    address: "88 Banjara Hills, Hyderabad - 500034",
    registeredAt: "2026-02-14T10:45:00Z",
    emergencyContact: { name: "Brian Moore", phone: "9876500008", relation: "Husband" },
  },
  {
    id: "pat-9",
    name: "Ravi Gupta",
    email: "ravi@example.com",
    mobile: "9876543219",
    password: "password123",
    role: "patient",
    gender: "Male",
    age: 45,
    dateOfBirth: "1980-08-14",
    bloodGroup: "O+",
    address: "16 Saket, New Delhi - 110017",
    registeredAt: "2026-03-03T07:30:00Z",
    emergencyContact: { name: "Sunita Gupta", phone: "9876500009", relation: "Wife" },
  },
  {
    id: "pat-10",
    name: "Kavya Reddy",
    email: "kavya@example.com",
    mobile: "9876543220",
    password: "password123",
    role: "patient",
    gender: "Female",
    age: 31,
    dateOfBirth: "1994-02-28",
    bloodGroup: "B+",
    address: "3 Gachibowli, Hyderabad - 500032",
    registeredAt: "2026-03-20T09:00:00Z",
    emergencyContact: { name: "Anand Reddy", phone: "9876500010", relation: "Father" },
  },
  {
    id: "pat-11",
    name: "Arjun Mehta",
    email: "arjun@example.com",
    mobile: "9876543221",
    password: "password123",
    role: "patient",
    gender: "Male",
    age: 27,
    dateOfBirth: "1998-10-10",
    bloodGroup: "A+",
    address: "28 Indiranagar, Bengaluru - 560038",
    registeredAt: "2026-04-07T15:00:00Z",
    emergencyContact: { name: "Priya Mehta", phone: "9876500011", relation: "Mother" },
  },
  {
    id: "pat-12",
    name: "Sara Nair",
    email: "sara@example.com",
    mobile: "9876543222",
    password: "password123",
    role: "patient",
    gender: "Female",
    age: 22,
    dateOfBirth: "2003-12-05",
    bloodGroup: "O+",
    address: "5 Palarivattom, Kochi - 682025",
    registeredAt: "2026-04-25T12:00:00Z",
    emergencyContact: { name: "Thomas Nair", phone: "9876500012", relation: "Father" },
  },
  {
    id: "pat-13",
    name: "David Lin",
    email: "david@example.com",
    mobile: "9876543223",
    password: "password123",
    role: "patient",
    gender: "Male",
    age: 48,
    dateOfBirth: "1977-07-19",
    bloodGroup: "AB+",
    address: "101 Anna Salai, Chennai - 600002",
    registeredAt: "2026-05-10T08:30:00Z",
    emergencyContact: { name: "Amy Lin", phone: "9876500013", relation: "Sister" },
  },
  {
    id: "pat-14",
    name: "Neha Joshi",
    email: "neha@example.com",
    mobile: "9876543224",
    password: "password123",
    role: "patient",
    gender: "Female",
    age: 36,
    dateOfBirth: "1989-03-11",
    bloodGroup: "B-",
    address: "64 Viman Nagar, Pune - 411014",
    registeredAt: "2026-05-28T11:15:00Z",
    emergencyContact: { name: "Amit Joshi", phone: "9876500014", relation: "Husband" },
  },
  {
    id: "pat-15",
    name: "Rohan Verma",
    email: "rohan@example.com",
    mobile: "9876543225",
    password: "password123",
    role: "patient",
    gender: "Male",
    age: 19,
    dateOfBirth: "2006-06-23",
    bloodGroup: "A-",
    address: "12 Rajouri Garden, New Delhi - 110027",
    registeredAt: "2026-06-15T10:00:00Z",
    emergencyContact: { name: "Sunita Verma", phone: "9876500015", relation: "Mother" },
  },
  {
    id: "pat-16",
    name: "Fatima Hassan",
    email: "fatima@example.com",
    mobile: "9876543226",
    password: "password123",
    role: "patient",
    gender: "Female",
    age: 55,
    dateOfBirth: "1970-09-30",
    bloodGroup: "O-",
    address: "8 Frazer Town, Bengaluru - 560005",
    registeredAt: "2026-07-03T09:45:00Z",
    emergencyContact: { name: "Imran Hassan", phone: "9876500016", relation: "Son" },
  },
  {
    id: "pat-17",
    name: "Tom Bradley",
    email: "tom@example.com",
    mobile: "9876543227",
    password: "password123",
    role: "patient",
    gender: "Male",
    age: 43,
    dateOfBirth: "1982-12-17",
    bloodGroup: "B+",
    address: "55 Bandra West, Mumbai - 400050",
    registeredAt: "2026-07-20T14:30:00Z",
    emergencyContact: { name: "Karen Bradley", phone: "9876500017", relation: "Wife" },
  },
];

// ── Persistence helpers ────────────────────────────────────────────────────────

/**
 * Persist a patient account-status change to localStorage.
 * Uses key `patientAccountStatuses` as a Record<id, "active"|"inactive">.
 */
export function updatePatientAccountStatus(
  id: string,
  status: "active" | "inactive"
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ACCOUNT_STATUS_KEY);
    const map: Record<string, "active" | "inactive"> = raw ? JSON.parse(raw) : {};
    map[id] = status;
    localStorage.setItem(ACCOUNT_STATUS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/**
 * Read the persisted account-status overrides map.
 */
function getAccountStatusOverrides(): Record<string, "active" | "inactive"> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ACCOUNT_STATUS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function calculateAge(dob?: string): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return undefined;
  const diff = Date.now() - birth.getTime();
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return age >= 0 ? age : undefined;
}

// ── Data access ────────────────────────────────────────────────────────────────

/**
 * getAllPatients() — merges static mock patients with any patients registered
 * at runtime (stored in localStorage.registeredUsers), then applies persisted
 * accountStatus overrides from `patientAccountStatuses`.
 *
 * - New registrations from the signup flow appear automatically with demographics.
 * - Profile updates (gender, DOB, blood group, emergency contact) are synced.
 * - Unique accounts are guaranteed by id and email.
 * - Default accountStatus is "active" for all patients.
 * - Safe to call inside useEffect / client components.
 */
export function getAllPatients(): PatientUser[] {
  let result: PatientUser[] = mockPatients.map((p) => ({ ...p, accountStatus: p.accountStatus ?? "active" }));
  if (typeof window === "undefined") return result;

  try {
    let activeSessionUser: Record<string, unknown> | null = null;
    try {
      const logged = localStorage.getItem("loggedInUser");
      if (logged) activeSessionUser = JSON.parse(logged);
    } catch {
      /* ignore */
    }
    const sessionUser = activeSessionUser;

    // Merge runtime-registered patients from signup flow
    const stored = localStorage.getItem("registeredUsers");
    if (stored) {
      const users: Array<Record<string, unknown>> = JSON.parse(stored);
      users
        .filter((u) => u.role === "patient")
        .forEach((u) => {
          const id = (u.id as string) || `pat-${u.email}`;
          const email = ((u.email as string) || "").toLowerCase();
          const existsIndex = result.findIndex(
            (p) => p.id === id || (email && p.email.toLowerCase() === email)
          );

          const isCurrentLoggedIn = Boolean(
            sessionUser &&
              (sessionUser.id === id ||
                (email && (sessionUser.email as string)?.toLowerCase() === email))
          );

          const rawDOB =
            (isCurrentLoggedIn ? (sessionUser?.dateOfBirth as string) : undefined) ||
            (u.dateOfBirth as string) ||
            (u.dob as string) ||
            undefined;

          const rawGender =
            (isCurrentLoggedIn ? (sessionUser?.gender as PatientUser["gender"]) : undefined) ||
            (u.gender as PatientUser["gender"]) ||
            undefined;

          const hp = getUserHealthProfile(id);

          const bloodGroup =
            hp?.bloodGroup ||
            (u.bloodGroup as string) ||
            undefined;

          const emergencyContact = hp?.emergencyContactName
            ? {
                name: hp.emergencyContactName,
                phone: hp.emergencyContactPhone,
                relation: hp.emergencyContactRelation,
              }
            : (u.emergencyContact as PatientUser["emergencyContact"]) || undefined;

          const age = calculateAge(rawDOB) ?? (u.age as number) ?? undefined;

          const patientObj: PatientUser = {
            id,
            name:
              (isCurrentLoggedIn ? (sessionUser?.name as string) : null) ||
              (u.name as string) ||
              "Patient",
            email: (u.email as string) || "",
            mobile:
              (isCurrentLoggedIn ? ((sessionUser?.mobile as string) || (sessionUser?.phone as string)) : null) ||
              (u.mobile as string) ||
              (u.phone as string) ||
              "",
            password: (u.password as string) || "",
            role: "patient",
            accountStatus: "active",
            gender: rawGender,
            dateOfBirth: rawDOB,
            age,
            bloodGroup,
            emergencyContact,
            address: (u.address as string) || undefined,
            registeredAt: (u.registeredAt as string) || new Date().toISOString(),
          };

          if (existsIndex >= 0) {
            // Merge updated demographic and profile fields while preserving account status
            result[existsIndex] = {
              ...result[existsIndex],
              ...patientObj,
              accountStatus: result[existsIndex].accountStatus,
            };
          } else {
            result.push(patientObj);
          }
        });
    }

    // Enhance all patients (including static mock accounts) with any saved health profiles or session updates
    result = result.map((p) => {
      const isCurrentLoggedIn = Boolean(
        sessionUser &&
          (sessionUser.id === p.id ||
            (p.email && (sessionUser.email as string)?.toLowerCase() === p.email.toLowerCase()))
      );

      const rawDOB =
        (isCurrentLoggedIn ? (sessionUser?.dateOfBirth as string) : undefined) ||
        p.dateOfBirth;

      const rawGender =
        (isCurrentLoggedIn ? (sessionUser?.gender as PatientUser["gender"]) : undefined) ||
        p.gender;

      const hp = getUserHealthProfile(p.id);
      const computedAge = calculateAge(rawDOB) ?? p.age;


      return {
        ...p,
        gender: rawGender,
        dateOfBirth: rawDOB,
        age: computedAge,
        bloodGroup: hp?.bloodGroup || p.bloodGroup,
        emergencyContact: hp?.emergencyContactName
          ? {
              name: hp.emergencyContactName,
              phone: hp.emergencyContactPhone,
              relation: hp.emergencyContactRelation,
            }
          : p.emergencyContact,
      };
    });
  } catch {
    /* Return merged static + override list if localStorage is unavailable */
  }

  // Apply persisted accountStatus overrides (activate/deactivate from admin actions)
  const overrides = getAccountStatusOverrides();
  return result.map((p) =>
    overrides[p.id] !== undefined ? { ...p, accountStatus: overrides[p.id] } : p
  );
}

