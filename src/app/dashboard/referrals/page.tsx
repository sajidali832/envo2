
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import { Users, DollarSign, Award, Gift } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Profile = {
    referral_code: string;
    total_referrals: number;
    total_earnings: number;
};

type ReferredUser = {
    full_name: string;
    created_at: string;
    status: 'Joined' | 'Invested'; // Simplified status
}

export default function ReferralsPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [referralLink, setReferralLink] = useState('');

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(profileData);
                
                if (profileData) {
                    const link = `${window.location.origin}/register?ref=${profileData.referral_code}`;
                    setReferralLink(link);

                    // Fetch users referred by the current user
                    const { data: referredData } = await supabase.from('profiles').select('full_name, created_at').eq('referred_by', user.id);
                    // This is a simplified logic. A real app would check investment status.
                    const users = referredData?.map(u => ({ ...u, status: 'Joined' })) ?? [];
                    setReferredUsers(users as ReferredUser[]);
                }
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    const referralsNeeded = 2; // Example value
    
    return (
        <main className="flex-1 flex flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card className="bg-accent/20 border-accent/50 mt-4 md:mt-0">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-accent">
                        <Gift className="h-6 w-6"/>
                        Earn More with Referrals!
                    </CardTitle>
                    <CardDescription className="text-accent-foreground/80">
                        Invite friends to earn bonuses and unlock more withdrawals. You get 200 PKR for every friend who invests!
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{profile?.total_referrals ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Joined from your link</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Referral Bonus</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{(profile?.total_referrals ?? 0) * 200} PKR</div>
                    <p className="text-xs text-muted-foreground">Total earnings from referrals</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Next Withdrawal</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{Math.max(0, referralsNeeded - (profile?.total_referrals ?? 0))} Referrals</div>
                    <p className="text-xs text-muted-foreground">Required to unlock</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Your Unique Referral Link</CardTitle>
                    <CardDescription>Share this link with your friends. When they sign up after investing, you get a bonus.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex w-full items-center space-x-2">
                        <Input type="text" value={referralLink} readOnly placeholder="Generating your link..." className="bg-muted"/>
                        <CopyButton textToCopy={referralLink} />
                    </div>
                </CardContent>
            </Card>
            
                <Card>
                <CardHeader>
                    <CardTitle>Referred Users</CardTitle>
                    <CardDescription>Track the status of users you've invited.</CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? (
                        <div className="text-center text-muted-foreground py-12">Loading...</div>
                     ) : referredUsers.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12">You haven't referred anyone yet.</div>
                     ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User Name</TableHead>
                                    <TableHead>Date Joined</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {referredUsers.map((user, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{user.full_name}</TableCell>
                                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === 'Invested' ? 'default' : 'secondary'}>{user.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     )}
                </CardContent>
            </Card>

        </main>
    );
}
