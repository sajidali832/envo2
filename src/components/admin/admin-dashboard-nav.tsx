'use client';

import Link from 'next/link';
import { Users, ShieldCheck, Wallet, BarChart, LogOut, LucideIcon, KeyRound } from 'lucide-react';
import { Button } from '../ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="20" cy="20" r="20" className="fill-primary" />
        <path d="M15.424 26V14H26V16.6H19.584V19.14H24.84V21.74H19.584V26H15.424Z" className="fill-primary-foreground" />
    </svg>
);


const navItems = [
    { href: '/admin/dashboard', icon: BarChart, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'All Users' },
    { href: '/admin/approvals', icon: ShieldCheck, label: 'Approvals' },
    { href: '/admin/withdrawals', icon: Wallet, label: 'Withdrawals' },
    { href: '/admin/accounts', icon: KeyRound, label: 'Accounts' },
];

const NavLink = ({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) => {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href);

    return (
        <Link href={href} className="block">
            <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start"
            >
                <Icon className="mr-2 h-4 w-4" />
                {label}
            </Button>
        </Link>
    );
};

export function AdminDashboardNav() {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center border-b p-4">
                <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold font-headline">
                    <LogoIcon />
                    <span>Envo-Earn Admin</span>
                </Link>
            </div>
            <nav className="flex-1 space-y-2 p-4">
                {navItems.map((item) => (
                    <NavLink key={item.href} {...item} />
                ))}
            </nav>
            <div className="mt-auto border-t p-4">
                <Link href="/admin">
                     <Button variant="ghost" className="w-full justify-start">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </Link>
            </div>
        </div>
    );
}
