"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Landmark, Users, TrendingUp, PiggyBank } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

type Profile = {
    total_earnings: number;
    total_referrals: number;
};

type EarningHistory = {
    id: number;
    description: string;
    amount: number;
    created_at: string;
};

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [earningHistory, setEarningHistory] = useState<EarningHistory[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchData() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(profileData);

            // Fetch earning history (this is an example, you might need a dedicated table for this)
            // For now, we'll simulate it based on approved withdrawals
            const { data: withdrawalData } = await supabase.from('withdrawals').select('requested_at, amount, status').eq('user_id', user.id).eq('status', 'approved');
            
            const history: EarningHistory[] = withdrawalData?.map(w => ({
                id: Math.random(),
                description: `Withdrawal (${w.status})`,
                amount: w.amount,
                created_at: w.requested_at
            })) ?? [];
            setEarningHistory(history);

        }
        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, []);


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="grid gap-6 md:grid-cols-1 pt-4 md:pt-0">
             <Card className="bg-primary/80 text-primary-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
                    <PiggyBank className="h-5 w-5 text-primary-foreground/80" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">6,000 PKR</div>
                     <p className="text-xs text-primary-foreground/80">Initial investment amount</p>
                </CardContent>
            </Card>
             <Card className="bg-accent/80 text-accent-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                    <TrendingUp className="h-5 w-5 text-accent-foreground/80" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{profile?.total_earnings ?? 0} PKR</div>
                    <p className="text-xs text-accent-foreground/80">Includes referral bonuses</p>
                </CardContent>
            </Card>
             <Card className="bg-secondary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                    <Users className="h-5 w-5 text-secondary-foreground/80" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{profile?.total_referrals ?? 0}</div>
                    <p className="text-xs text-secondary-foreground/80">Friends who invested</p>
                </CardContent>
            </Card>
        </div>
         <Card>
            <CardHeader>
              <CardTitle>Earning History</CardTitle>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                            Loading history...
                        </TableCell>
                    </TableRow>
                  ) : earningHistory.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                            No earnings recorded yet.
                        </TableCell>
                    </TableRow>
                  ) : earningHistory.map((transaction) => (
                    <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">+ {transaction.amount} PKR</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
               </Table>
            </CardContent>
          </Card>
      </main>
  );
}
