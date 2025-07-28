"use client";

const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="20" cy="20" r="20" className="fill-primary" />
        <path d="M15.424 26V14H26V16.6H19.584V19.14H24.84V21.74H19.584V26H15.424Z" className="fill-primary-foreground" />
    </svg>
);
  
export function DashboardHeader() {

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <div className="flex items-center gap-2 font-semibold font-headline text-xl">
                <LogoIcon />
                <span>Envo-Earn</span>
            </div>
        </header>
    )
}
