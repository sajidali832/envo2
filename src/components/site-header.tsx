import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image src="/logo.png" alt="Envo-Earn Logo" width={28} height={28} />
            <span className="font-bold font-headline sm:inline-block">
              Envo-Earn
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
