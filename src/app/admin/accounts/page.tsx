
"use server";

import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { revalidatePath } from "next/cache";

async function fetchUserAccounts() {
    if (!supabaseAdmin) {
        console.error("Admin client not available");
        return { accounts: [], error: 'Admin client not available' };
    }

    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        return { accounts: [], error: error.message };
    }
    
    const accounts = users.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        is_banned: u.banned_until && new Date(u.banned_until) > new Date(),
    }));

    return { accounts, error: null };
}

export default async function AdminAccountsPage() {
    const { accounts, error } = await fetchUserAccounts();

    async function handleRefresh() {
        'use server'
        revalidatePath('/admin/accounts');
    }

    return (
        <>
            <AdminDashboardHeader title="Registered Accounts" onRefresh={handleRefresh} />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>All Registered Accounts</CardTitle>
                        <CardDescription>
                            This is a list of all users who have successfully created an account.
                            Passwords are not accessible for security reasons.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       {error && <p className="text-destructive">Error: {error}</p>}
                       {!error && (
                           <Table>
                               <TableHeader>
                                   <TableRow>
                                       <TableHead>User ID</TableHead>
                                       <TableHead>Email</TableHead>
                                       <TableHead>Status</TableHead>
                                       <TableHead>Account Created</TableHead>
                                       <TableHead>Last Sign In</TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                    {accounts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                                No registered accounts found.
                                            </TableCell>
                                        </TableRow>
                                    ) : accounts.map((account) => (
                                       <TableRow key={account.id}>
                                           <TableCell className="font-medium truncate max-w-[200px]">{account.id}</TableCell>
                                           <TableCell>{account.email}</TableCell>
                                           <TableCell>
                                                <Badge variant={account.is_banned ? 'destructive' : 'default'}>
                                                    {account.is_banned ? 'Blocked' : 'Active'}
                                                </Badge>
                                           </TableCell>
                                           <TableCell>{new Date(account.created_at).toLocaleString()}</TableCell>
                                           <TableCell>{account.last_sign_in_at ? new Date(account.last_sign_in_at).toLocaleString() : 'Never'}</TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                       )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
