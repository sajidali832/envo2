
"use client";

import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type User = {
    id: string;
    full_name: string;
    email: string;
    created_at: string;
    total_earnings: number;
    total_referrals: number;
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newBalance, setNewBalance] = useState<number | string>(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching users', description: error.message });
            setUsers([]);
        } else {
            setUsers(data as User[]);
        }
        setLoading(false);
    }, [toast]);


    useEffect(() => {
        fetchUsers();

        const channel = supabase.channel('realtime-profiles-admin')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles'
            }, (payload) => {
                fetchUsers();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchUsers]);

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setNewBalance(user.total_earnings);
        setIsDialogOpen(true);
    };

    const handleSaveBalance = async () => {
        if (!editingUser || isSaving) return;

        setIsSaving(true);
        const numericBalance = Number(newBalance);
        if (isNaN(numericBalance) || numericBalance < 0) {
            toast({ variant: 'destructive', title: 'Invalid balance value', description: 'Balance must be a non-negative number.' });
            setIsSaving(false);
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ total_earnings: numericBalance })
            .eq('id', editingUser.id);
        
        setIsSaving(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Error updating balance', description: error.message });
        } else {
            toast({ title: 'Balance updated successfully' });
            setIsDialogOpen(false); 
            // The real-time subscription will handle the UI update by calling fetchUsers()
            // but we can also trigger it manually for instant feedback
            await fetchUsers();
        }
    };
    
    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewBalance(value === '' ? '' : Number(value));
    };

    const handleDeleteUser = async (userId: string) => {
        // This requires admin privileges and should ideally be a secure server-side operation.
        // The current implementation uses the Supabase admin client, which should be handled carefully.
        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) {
             toast({ variant: 'destructive', title: 'Error deleting user', description: error.message });
        } else {
            toast({ title: 'User has been permanently deleted' });
            // The subscription should handle the refresh, but we'll call it to be sure
            await fetchUsers();
        }
    };

    return (
        <>
            <AdminDashboardHeader title="User Management" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>All Users</CardTitle>
                            <CardDescription>View, edit, or delete user information.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>User ID</TableHead>
                                   <TableHead>Name</TableHead>
                                   <TableHead>Email</TableHead>
                                   <TableHead>Join Date</TableHead>
                                   <TableHead>Total Earnings</TableHead>
                                   <TableHead>Referrals</TableHead>
                                   <TableHead className="text-right">Actions</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                                            Loading users...
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : users.map((user) => (
                                   <TableRow key={user.id}>
                                       <TableCell className="font-medium truncate max-w-[150px]">{user.id}</TableCell>
                                       <TableCell>{user.full_name}</TableCell>
                                       <TableCell>{user.email}</TableCell>
                                       <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                       <TableCell>{user.total_earnings} PKR</TableCell>
                                       <TableCell className="text-center">{user.total_referrals}</TableCell>
                                       <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => handleEditClick(user)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit User
                                                        </DropdownMenuItem>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-100">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete User
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the user's account and remove their data from our servers.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">Continue</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                       </TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                       </Table>
                    </CardContent>
                </Card>
            </main>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User: {editingUser?.full_name}</DialogTitle>
                    </DialogHeader>
                    {editingUser && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">User ID</Label>
                                <p className="text-sm font-mono">{editingUser.id}</p>
                            </div>
                             <div className="space-y-1">
                                <Label className="text-muted-foreground">Email</Label>
                                <p className="text-sm">{editingUser.email}</p>
                            </div>
                             <div className="space-y-1">
                                <Label className="text-muted-foreground">Join Date</Label>
                                <p className="text-sm">{new Date(editingUser.created_at).toLocaleString()}</p>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4 pt-4">
                                <Label htmlFor="balance" className="text-right col-span-1">Balance (PKR)</Label>
                                <Input id="balance" type="number" value={newBalance} onChange={handleBalanceChange} className="col-span-3" />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                             <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleSaveBalance} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
