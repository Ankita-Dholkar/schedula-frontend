import DoctorSidebar from "@/features/doctor-portal/components/DoctorSidebar";

export default function DoctorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
      {/* Fixed Sidebar */}
      <DoctorSidebar />

      {/* Scrollable main content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
