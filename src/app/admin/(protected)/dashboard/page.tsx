export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)]">
      <div className="text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand)] mx-auto shadow-sm">
          <span className="font-serif text-2xl font-bold text-white">S</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--ink)]">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Phase 1 complete — Layout and full dashboard coming in Phase 2 & 3.
        </p>
      </div>
    </div>
  );
}
