import UserSidebar from "@/features/user-portal/components/UserSidebar";

export default function UserPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
      {/* Fixed Sidebar */}
      <UserSidebar />

      {/* Scrollable main content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
