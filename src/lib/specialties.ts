/**
 * Canonical list of medical specializations used across:
 * - Doctor signup form (Step 2)
 * - Specialty filter on the doctor listing page
 *
 * Keep this as the single source of truth so search filters always align
 * with what doctors can register under.
 */
export const SPECIALTIES = [
  "Cardiologist",
  "Dermatologist",
  "Endocrinologist",
  "ENT Specialist",
  "Gastroenterologist",
  "General Physician",
  "Gynecologist",
  "Neurologist",
  "Ophthalmologist",
  "Orthopedist",
  "Pediatrician",
  "Psychiatrist",
  "Psychologist",
  "Pulmonologist",
  "Sr. Psychologist",
  "Urologist",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];
