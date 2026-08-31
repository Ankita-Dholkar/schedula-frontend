import { redirect } from "next/navigation";

// Redirect /doctor → /doctor/dashboard
export default function DoctorIndexPage() {
  redirect("/doctor/dashboard");
}
