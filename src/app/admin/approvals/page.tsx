"use client";

import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Check, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Approval = {
    id: number;
    user_name: string;
    email: string;
    user_account_number: string;
    submitted_at: string;
    screenshot_url: string;
    status: string;
};

export default function AdminApprovalsPage() {
    const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    async function fetchApprovals() {
        setLoading(true);
        const { data, error } = await supabase
            .from('investments')
            .select(`*`)
            .eq('status', 'pending')
            .order('submitted_at', { ascending: true });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching approvals', description: error.message });
        } else {
            setPendingApprovals(data as Approval[]);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchApprovals();

        const channel = supabase.channel('realtime-investments')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'investments'
            }, (payload) => {
                fetchApprovals(); // Refetch when a new investment is made
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, []);

    const handleApproval = async (id: number, newStatus: 'approved' | 'rejected') => {
        const { error } = await supabase
            .from('investments')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            toast({ variant: 'destructive', title: 'Error updating status', description: error.message });
        } else {
            toast({ title: `Submission ${newStatus}` });
            fetchApprovals(); // Refresh the list
        }
    };

    return (
        <>
            <AdminDashboardHeader title="Investment Approvals" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Pending Approvals</CardTitle>
                        <CardDescription>Review and approve or reject new investment submissions. Approving will allow the user to register.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>Submission ID</TableHead>
                                   <TableHead>User Name</TableHead>
                                   <TableHead>Email</TableHead>
                                   <TableHead>User Account</TableHead>
                                   <TableHead>Submitted At</TableHead>
                                   <TableHead>Screenshot</TableHead>
                                   <TableHead className="text-right">Actions</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {pendingApprovals.map((approval) => (
                                   <TableRow key={approval.id}>
                                       <TableCell className="font-medium">{approval.id}</TableCell>
                                       <TableCell>{approval.user_name}</TableCell>
                                       <TableCell>{approval.email}</TableCell>
                                       <TableCell>{approval.user_account_number}</TableCell>
                                       <TableCell>{new Date(approval.submitted_at).toLocaleString()}</TableCell>
                                       <TableCell>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="icon">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Screenshot for Submission #{approval.id}</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="mt-4">
                                                        <Image src={approval.screenshot_url} alt={`Screenshot for submission ${approval.id}`} width={800} height={600} className="rounded-md object-contain"/>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                       </TableCell>
                                       <TableCell className="text-right space-x-2">
                                           <Button variant="outline" size="icon" className="text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200" onClick={() => handleApproval(approval.id, 'approved')}>
                                               <Check className="h-4 w-4" />
                                           </Button>
                                            <Button variant="outline" size="icon" className="text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200" onClick={() => handleApproval(approval.id, 'rejected')}>
                                               <X className="h-4 w-4" />
                                           </Button>
                                       </TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                       </Table>
                       {(loading) && (
                            <div className="text-center text-muted-foreground py-12">
                                Loading approvals...
                            </div>
                       )}
                       {!loading && pendingApprovals.length === 0 && (
                            <div className="text-center text-muted-foreground py-12">
                                No pending approvals.
                            </div>
                       )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
