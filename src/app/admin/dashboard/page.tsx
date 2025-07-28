"use client";

import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { Users, ShieldCheck, Wallet, Hourglass, Activity } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ActivityLog = {
    type: string;
    user: string;
    amount?: number;
    status: string;
    time: string;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingApprovals: 0,
        pendingWithdrawals: 0,
        totalWithdrawn: 0,
    });
    const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchDashboardData() {
        setLoading(true);
        try {
            // Fetch stats
            const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: pendingApprovals } = await supabase.from('investments').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            const { data: pendingWithdrawalsData, count: pendingWithdrawalsCount } = await supabase.from('withdrawals').select('amount', {count: 'exact'}).eq('status', 'pending');
            const { data: totalWithdrawnData } = await supabase.from('withdrawals').select('amount').eq('status', 'approved');

            const totalWithdrawn = totalWithdrawnData?.reduce((acc, curr) => acc + curr.amount, 0) ?? 0;

            setStats({
                totalUsers: totalUsers ?? 0,
                pendingApprovals: pendingApprovals ?? 0,
                pendingWithdrawals: pendingWithdrawalsCount ?? 0,
                totalWithdrawn,
            });

            // Fetch recent activities
            const { data: investments } = await supabase.from('investments').select('user_name, submitted_at, status').order('submitted_at', { ascending: false }).limit(5);
            const { data: withdrawals } = await supabase.from('withdrawals').select('*, profiles(full_name)').order('requested_at', { ascending: false }).limit(5);

            const activities: ActivityLog[] = [];
            investments?.forEach(i => activities.push({
                type: 'Investment',
                user: i.user_name,
                status: i.status.charAt(0).toUpperCase() + i.status.slice(1),
                time: new Date(i.submitted_at).toLocaleString()
            }));
            withdrawals?.forEach(w => activities.push({
                type: 'Withdrawal',
                user: w.profiles?.full_name ?? 'N/A',
                amount: w.amount,
                status: w.status.charAt(0).toUpperCase() + w.status.slice(1),
                time: new Date(w.requested_at).toLocaleString()
            }));

            // Sort and slice activities
            activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
            setRecentActivities(activities.slice(0, 10));

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDashboardData();
        const investmentsChannel = supabase
            .channel('admin-dashboard-investments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'investments' }, fetchDashboardData)
            .subscribe();

        const withdrawalsChannel = supabase
            .channel('admin-dashboard-withdrawals')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, fetchDashboardData)
            .subscribe();
            
        const profilesChannel = supabase
            .channel('admin-dashboard-profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchDashboardData)
            .subscribe();

        return () => {
            supabase.removeChannel(investmentsChannel);
            supabase.removeChannel(withdrawalsChannel);
            supabase.removeChannel(profilesChannel);
        }
    }, []);

    return (
        <>
            <AdminDashboardHeader title="Admin Dashboard" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                 <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Approvals
                        </CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold text-accent">{stats.pendingApprovals}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Withdrawals
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.pendingWithdrawals}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Withdrawn
                        </CardTitle>
                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">{stats.totalWithdrawn} PKR</div>
                        </CardContent>
                    </Card>
                 </div>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5"/>
                            Recent Activity
                        </CardTitle>
                        <CardDescription>An overview of the latest platform events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                     <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                            Loading activities...
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && recentActivities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                            No recent activity.
                                        </TableCell>
                                    </TableRow>
                                ) : recentActivities.map((activity, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{activity.type}</TableCell>
                                        <TableCell>{activity.user}</TableCell>
                                        <TableCell>{activity.amount ? `${activity.amount} PKR` : 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                activity.status === 'Approved' || activity.status === 'Registered' ? 'default' :
                                                activity.status === 'Pending' ? 'secondary' : 'destructive'
                                            }
                                            className={
                                                activity.status === 'Approved' ? 'bg-green-500/20 text-green-700' :
                                                activity.status === 'Registered' ? 'bg-blue-500/20 text-blue-700' : ''
                                            }
                                            >
                                                {activity.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">{activity.time}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
            </main>
        </>
    );
}
