import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { DashboardHeader } from "@/components/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        <main className="flex-1 pb-20 md:pb-0">
          <DashboardHeader />
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
