"use client";

import { Landmark } from "lucide-react";
  
export function DashboardHeader() {

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <div className="flex items-center gap-2 font-semibold font-headline text-xl">
                <Landmark className="h-6 w-6 text-primary" />
                <span>Envo-Earn</span>
            </div>
        </header>
    )
}
