"use client";

import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit } from "lucide-react";
import { useEffect, useState } from "react";
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
    const { toast } = useToast();

    async function fetchUsers() {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*');
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching users', description: error.message });
        } else {
            setUsers(data as User[]);
        }
        setLoading(false);
    }

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
    }, []);


    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setNewBalance(user.total_earnings);
    };

    const handleSaveBalance = async () => {
        if (!editingUser) return;

        const numericBalance = Number(newBalance);
        if (isNaN(numericBalance)) {
            toast({ variant: 'destructive', title: 'Invalid balance value' });
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ total_earnings: numericBalance })
            .eq('id', editingUser.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error updating balance', description: error.message });
        } else {
            toast({ title: 'Balance updated successfully' });
            // The realtime subscription will handle the UI update
            const dialogCloseButton = document.getElementById('edit-dialog-close');
            if (dialogCloseButton) {
                dialogCloseButton.click();
            }
        }
    };
    
    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewBalance(value === '' ? '' : value);
    };


    const handleDeleteUser = async (userId: string) => {
        // This is a "soft delete" by disabling the user's account
        const { error } = await supabase.auth.admin.updateUserById(userId, {
            ban_duration: 'none' // 'none' is a Supabase term for indefinite ban
        });

        if (error) {
             toast({ variant: 'destructive', title: 'Error deleting user', description: error.message });
        } else {
            toast({ title: 'User has been blocked' });
            // The realtime subscription will handle the UI update
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
                        <div className="w-full max-w-sm">
                            <Input placeholder="Search users by name, email, or ID..." />
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
                                       <TableCell className="font-medium truncate max-w-xs">{user.id}</TableCell>
                                       <TableCell>{user.full_name}</TableCell>
                                       <TableCell>{user.email}</TableCell>
                                       <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                       <TableCell>{user.total_earnings} PKR</TableCell>
                                       <TableCell className="text-center">{user.total_referrals}</TableCell>
                                       <TableCell className="text-right">
                                           <Dialog onOpenChange={(open) => !open && setEditingUser(null)}>
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={() => handleEditUser(user)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit User
                                                            </DropdownMenuItem>
                                                        </DialogTrigger>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-red-600">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete User
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action will permanently block the user from accessing their account. They will not be able to log in again.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Continue</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Edit User: {editingUser?.full_name}</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="balance" className="text-right">Balance (PKR)</Label>
                                                        <Input id="balance" type="number" value={newBalance} onChange={handleBalanceChange} className="col-span-3" />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                         <Button id="edit-dialog-close" variant="outline">Cancel</Button>
                                                    </DialogClose>
                                                    <Button onClick={handleSaveBalance}>Save changes</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                           </Dialog>
                                       </TableCell>
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
