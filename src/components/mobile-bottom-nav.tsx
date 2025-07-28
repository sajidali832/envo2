"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, Users, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/withdraw', icon: Wallet, label: 'Withdraw' },
    { href: '/dashboard/referrals', icon: Users, label: 'Referrals' },
];

const NavLink = ({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link href={href} className={cn(
            "flex flex-col items-center justify-center h-full flex-1 gap-1 p-1 transition-colors duration-200 rounded-md",
            isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
        )}>
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium">{label}</span>
        </Link>
    );
};

export function MobileBottomNav() {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="bg-card/95 backdrop-blur-sm border-t p-1">
                <nav className="flex items-center justify-around h-14 gap-1">
                   {navItems.map((item) => (
                        <NavLink key={item.href} {...item} />
                    ))}
                </nav>
            </div>
        </div>
    );
}
