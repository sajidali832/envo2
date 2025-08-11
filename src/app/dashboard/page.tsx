
"use client";

import {
  Card,
  CardContent,
  CardDescription,
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
import { Users, TrendingUp, PiggyBank, History } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type EarningHistory = {
    id: number;
    type: string;
    amount: number;
    created_at: string;
};

export default function DashboardPage() {
    const { profile, loading: authLoading } = useAuth();
    const [history, setHistory] = useState<EarningHistory[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            if (profile?.id) {
                setHistoryLoading(true);
                const { data: historyData, error: historyError } = await supabase
                    .from('earnings_history')
                    .select('*')
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false })
                    .limit(10);
                
                if (historyError) {
                    console.error('Error fetching earnings history:', `Database query failed. Is RLS policy for "earnings_history" correct? Details: ${historyError.message}`);
                } else {
                    setHistory(historyData);
                }
                setHistoryLoading(false);
            }
        }

        if (!authLoading) {
          fetchDashboardData();
        }

        const earningsChannel = supabase.channel('dashboard-earnings-history')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'earnings_history' }, (payload) => {
                if(payload.new.user_id === profile?.id) {
                    fetchDashboardData();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(earningsChannel);
        };
    }, [profile, authLoading]);

    const formatEarningType = (type: string) => {
        switch(type) {
            case 'daily_earning': return 'Daily Return';
            case 'referral_bonus': return 'Referral Bonus';
            default: return 'Earning';
        }
    }


  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3 pt-4 md:pt-0">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
                    <PiggyBank className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {authLoading ? <Skeleton className="h-8 w-3/4" /> : (
                        <div className="text-3xl font-bold">{profile?.total_investment ?? 0} PKR</div>
                    )}
                     <p className="text-xs text-muted-foreground">Your approved investment plan</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {authLoading ? <Skeleton className="h-8 w-3/4" /> : (
                        <div className="text-3xl font-bold text-green-600">{profile?.total_earnings ?? 0} PKR</div>
                    )}
                    <p className="text-xs text-muted-foreground">Includes referral bonuses & daily credits</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
                    <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {authLoading ? <Skeleton className="h-8 w-1/4" /> : (
                        <div className="text-3xl font-bold">{profile?.referral_count ?? 0}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Friends who joined with your code</p>
                </CardContent>
            </Card>
        </div>
         <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/> Earning History</CardTitle>
              <CardDescription>A log of your recent earnings activity.</CardDescription>
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
                  {historyLoading ? (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                            <div className="flex justify-center items-center gap-2">
                                Loading history...
                            </div>
                        </TableCell>
                    </TableRow>
                  ) : history.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                            No earnings recorded yet.
                        </TableCell>
                    </TableRow>
                  ) : history.map((transaction) => (
                    <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                            <Badge variant={transaction.type === 'referral_bonus' ? 'default' : 'secondary'} className={transaction.type === 'referral_bonus' ? 'bg-green-100 text-green-800' : ''}>
                                {formatEarningType(transaction.type)}
                            </Badge>
                        </TableCell>
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
