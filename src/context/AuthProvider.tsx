
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

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
};

type AuthContextType = {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getActiveSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error("Error getting session:", error.message);
                setLoading(false);
                return;
            }

            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();

                if (profileError) {
                    console.error("Error fetching profile:", profileError.message);
                }
                setProfile(profileData as Profile | null);
            }
            setLoading(false);
        };

        getActiveSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                setProfile(null); // Reset profile on auth change

                if (currentUser) {
                    setLoading(true);
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', currentUser.id)
                        .single();

                    if (profileError) {
                        console.error("Error fetching profile on auth state change:", profileError.message);
                    }
                    setProfile(profileData as Profile | null);
                    setLoading(false);
                } else {
                    setLoading(false);
                }
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const value = {
        user,
        profile,
        loading,
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
