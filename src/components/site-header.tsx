
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="12" cy="12" r="10" className="fill-primary" />
        <path d="M15.5 9.5L12 13L8.5 9.5" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 13V16" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 7H14" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <LogoIcon />
            <span className="font-bold font-headline sm:inline-block">
              Envo Earn
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="hidden sm:flex items-center space-x-2">
            <Button asChild variant="ghost">
                <Link href="/invest">Invest</Link>
            </Button>
            <Button asChild>
                <Link href="/login">Sign In</Link>
            </Button>
          </nav>
          <Button asChild className="sm:hidden">
              <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
