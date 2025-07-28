
"use client";

const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="12" cy="12" r="10" className="fill-primary" />
        <path d="M15.5 9.5L12 13L8.5 9.5" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 13V16" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 7H14" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
  
export function DashboardHeader() {

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <div className="flex items-center gap-2 font-semibold font-headline text-xl">
                <LogoIcon />
                <span>Envo Earn</span>
            </div>
        </header>
    )
}
