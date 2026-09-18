import AdminLoginForm from "@/features/auth/components/AdminLoginForm";

export const metadata = {
  title: "Admin Login — Schedula",
  description: "Restricted access portal for Schedula administrators.",
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
