import { AdminDashboardNav } from "@/components/admin/admin-dashboard-nav";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <AdminDashboardNav />
      </div>
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  );
}
