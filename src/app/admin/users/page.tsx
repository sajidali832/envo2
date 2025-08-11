
"use client";

import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Ban, Edit, MapPin } from "lucide-react";
import { useEffect, useState, useCallback, useTransition } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateUserBalance, toggleUserBlock } from "./actions";

type User = {
    id: string;
    full_name: string;
    email: string;
    created_at: string;
    total_earnings: number;
    total_referrals: number;
    status: 'active' | 'blocked';
    location: {
        type: 'Point',
        coordinates: [number, number]
    } | null;
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newBalance, setNewBalance] = useState<number | string>("");
    const [isSaving, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dataVersion, setDataVersion] = useState(0); 
    const { toast } = useToast();

    const forceRefresh = useCallback(() => {
        setDataVersion(v => v + 1);
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*, user_email:users(email)')
            .order('created_at', { ascending: false });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching users', description: error.message });
            setUsers([]);
        } else {
             const formattedUsers = data.map((u: any) => ({
                ...u,
                email: u.user_email?.email ?? 'N/A' 
            }));
            setUsers(formattedUsers as User[]);
        }
        setLoading(false);
    }, [toast]);


    useEffect(() => {
        fetchUsers();
         const channel = supabase
            .channel('realtime-profiles-admin')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
                forceRefresh();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchUsers, dataVersion]);

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setNewBalance(user.total_earnings);
        setIsDialogOpen(true);
    };

    const handleSaveBalance = async () => {
        if (!editingUser) return;

        const numericBalance = Number(newBalance);
        if (isNaN(numericBalance) || numericBalance < 0) {
            toast({ variant: 'destructive', title: 'Invalid balance value', description: 'Balance must be a non-negative number.' });
            return;
        }

        startTransition(async () => {
            try {
                await updateUserBalance(editingUser.id, numericBalance);
                toast({ title: 'Balance updated successfully' });
                forceRefresh(); 
                setIsDialogOpen(false); 
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error updating balance', description: error.message });
            }
        });
    };
    
    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewBalance(value === '' ? '' : Number(value));
    };

    const handleBlockUser = async (user: User) => {
        const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
        try {
            await toggleUserBlock(user.id, newStatus);
            toast({ title: `User has been ${newStatus}`});
            forceRefresh();
        } catch (error: any) {
             toast({ variant: 'destructive', title: `Error ${newStatus === 'blocked' ? 'blocking' : 'unblocking'} user`, description: error.message });
        }
    };
    
    const onDialogClose = (open: boolean) => {
        if (!open) {
            setIsDialogOpen(false);
            setEditingUser(null);
            setNewBalance("");
        }
    }

    const getLocationLink = (location: User['location']) => {
        if (!location?.coordinates) return '#';
        const [long, lat] = location.coordinates;
        return `https://www.google.com/maps?q=${lat},${long}`;
    }

    return (
        <>
            <AdminDashboardHeader title="User Management" onRefresh={forceRefresh} />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>All Users</CardTitle>
                            <CardDescription>View, edit, or block user information.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>User ID</TableHead>
                                   <TableHead>Name</TableHead>
                                   <TableHead>Email</TableHead>
                                   <TableHead>Status</TableHead>
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
                                   <TableRow key={user.id} className={user.status === 'blocked' ? 'bg-destructive/10' : ''}>
                                       <TableCell className="font-medium truncate max-w-[150px]">{user.id}</TableCell>
                                       <TableCell>{user.full_name}</TableCell>
                                       <TableCell>{user.email}</TableCell>
                                       <TableCell>
                                            <Badge variant={user.status === 'blocked' ? 'destructive' : 'default'}>
                                                {user.status === 'blocked' ? 'Blocked' : 'Active'}
                                            </Badge>
                                       </TableCell>
                                       <TableCell>{user.total_earnings} PKR</TableCell>
                                       <TableCell className="text-center">{user.total_referrals}</TableCell>
                                       <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleEditClick(user);}}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleBlockUser(user)} className={user.status === 'blocked' ? 'text-green-600 focus:text-green-600' : 'text-red-600 focus:text-red-600'}>
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        {user.status === 'blocked' ? 'Unblock User' : 'Block User'}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                       </TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                       </Table>
                    </CardContent>
                </Card>
            </main>

            <Dialog open={isDialogOpen} onOpenChange={onDialogClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User: {editingUser?.full_name}</DialogTitle>
                    </DialogHeader>
                    {editingUser && (
                        <div className="grid gap-4 py-4">
                             <div className="space-y-1">
                                <Label className="text-muted-foreground">Email</Label>
                                <p className="text-sm">{editingUser.email}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</Label>
                                {editingUser.location ? (
                                    <a href={getLocationLink(editingUser.location)} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                                        View on Map ({editingUser.location.coordinates[1].toFixed(4)}, {editingUser.location.coordinates[0].toFixed(4)})
                                    </a>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Not available</p>
                                )}
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4 pt-4">
                                <Label htmlFor="balance" className="text-right col-span-1">Balance (PKR)</Label>
                                <Input id="balance" type="number" value={newBalance} onChange={handleBalanceChange} className="col-span-3" />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onDialogClose(false)}>Cancel</Button>
                        <Button onClick={handleSaveBalance} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
