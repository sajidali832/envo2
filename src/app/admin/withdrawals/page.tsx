"use client";

import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

type Withdrawal = {
    id: number;
    requested_at: string;
    amount: number;
    method: string;
    account_info: { name: string; number: string };
    status: string;
    profiles: { full_name: string } | null;
};


export default function AdminWithdrawalsPage() {
    const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    async function fetchWithdrawals() {
        setLoading(true);
        const { data, error } = await supabase
            .from('withdrawals')
            .select(`
                id,
                requested_at,
                amount,
                method,
                account_info,
                status,
                profiles ( full_name )
            `)
            .eq('status', 'pending')
            .order('requested_at', { ascending: true });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching withdrawals', description: error.message });
        } else {
            setPendingWithdrawals(data as any);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const handleUpdate = async (id: number, newStatus: 'approved' | 'rejected') => {
        const { error } = await supabase
            .from('withdrawals')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            toast({ variant: 'destructive', title: 'Error updating status', description: error.message });
        } else {
            toast({ title: `Withdrawal ${newStatus}` });
            fetchWithdrawals(); // Refresh list
        }
    };


    return (
        <>
            <AdminDashboardHeader title="Withdrawal Requests" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Pending Withdrawals</CardTitle>
                        <CardDescription>Process pending withdrawal requests from users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Request ID</TableHead>
                                    <TableHead>User Name</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Account</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingWithdrawals.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.id}</TableCell>
                                        <TableCell>{req.profiles?.full_name ?? 'N/A'}</TableCell>
                                        <TableCell>{new Date(req.requested_at).toLocaleString()}</TableCell>
                                        <TableCell className="font-semibold">{req.amount} PKR</TableCell>
                                        <TableCell>
                                             <Badge variant="secondary">{req.method}</Badge>
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            {req.account_info.name} ({req.account_info.number})
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="icon" className="text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200" onClick={() => handleUpdate(req.id, 'approved')}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                             <Button variant="outline" size="icon" className="text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200" onClick={() => handleUpdate(req.id, 'rejected')}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                       </Table>
                         {(loading) && (
                            <div className="text-center text-muted-foreground py-12">
                                Loading withdrawals...
                            </div>
                       )}
                       {!loading && pendingWithdrawals.length === 0 && (
                            <div className="text-center text-muted-foreground py-12">
                                No pending withdrawal requests.
                            </div>
                       )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
