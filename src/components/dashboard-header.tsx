"use client";

import Image from "next/image";
  
export function DashboardHeader() {

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <div className="flex items-center gap-2 font-semibold font-headline text-xl">
                <Image src="/logo.png" alt="Envo-Earn Logo" width={28} height={28} />
                <span>Envo-Earn</span>
            </div>
        </header>
    )
}
