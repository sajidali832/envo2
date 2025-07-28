
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminDashboardNav } from "@/components/admin/admin-dashboard-nav";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const authStatus = localStorage.getItem("admin_auth") === "true";
      setIsAuth(authStatus);
      if (!authStatus) {
        router.replace("/admin");
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
      setIsAuth(false);
      router.replace("/admin");
    }
  }, [router, pathname]);

  if (isAuth === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuth) {
    // This state should be brief as the useEffect will redirect.
    // You can also return a login component here if needed, but redirect is cleaner.
    return null;
  }

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
