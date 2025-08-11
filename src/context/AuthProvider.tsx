
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';

type Profile = {
    id: string;
    full_name: string;
    referral_code: string;
    total_investment: number;
    total_earnings: number;
    referral_count: number;
    referral_bonus_total: number;
    status: 'active' | 'pending_approval' | 'blocked';
    plan: 'free' | 'basic' | 'standard' | 'premium';
    created_at: string;
    location: any;
};

type AuthContextType = {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAdminAuth = () => {
             if (typeof window !== 'undefined') {
                const adminAuth = localStorage.getItem("admin_auth") === "true";
                setIsAdmin(adminAuth);
             }
        };
        checkAdminAuth();
    }, [pathname]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                setLoading(true);

                if (currentUser) {
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', currentUser.id)
                        .single();

                    if (profileError) {
                        console.error("Error fetching profile on auth state change:", profileError.message);
                        setProfile(null);
                    } else {
                        setProfile(profileData as Profile | null);
                    }
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        user,
        profile,
        loading,
        isAdmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
