
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon, Calendar, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = {
    full_name: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();
                setProfile(profileData);
            } else {
                router.push('/login'); // Redirect if not logged in
            }
            setLoading(false);
        };
        fetchUserData();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <main className="flex-1 flex flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card className="mt-4 md:mt-0">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserIcon className="h-6 w-6" />
                        Account Information
                    </CardTitle>
                    <CardDescription>
                        Your personal details and account information.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loading ? (
                        <>
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-8 w-2/3" />
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-4">
                               <Mail className="h-5 w-5 text-muted-foreground"/>
                                <div>
                                    <Label className="text-muted-foreground">Email</Label>
                                    <p className="font-medium">{user?.email}</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-4">
                               <UserIcon className="h-5 w-5 text-muted-foreground"/>
                                <div>
                                    <Label className="text-muted-foreground">Full Name</Label>
                                    <p className="font-medium">{profile?.full_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <Calendar className="h-5 w-5 text-muted-foreground"/>
                                <div>
                                    <Label className="text-muted-foreground">Joined On</Label>
                                    <p className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                </CardHeader>
                 <CardContent>
                     <Button variant="destructive" className="w-full md:w-auto" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
