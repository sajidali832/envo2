
'use client';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge";
import { Wallet, Edit, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

type SavedAccount = {
    id: number;
    user_id: string;
    method: 'Easypaisa' | 'JazzCash';
    account_name: string;
    account_number: string;
};

type WithdrawalHistory = {
    id: number;
    requested_at: string;
    method: string;
    status: string;
    amount: number;
}

type View = 'loading' | 'setup' | 'saved' | 'request';

export default function WithdrawPage() {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [savedAccount, setSavedAccount] = useState<SavedAccount | null>(null);
    const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistory[]>([]);
    const [view, setView] = useState<View>('loading');

    // Form states
    const [method, setMethod] = useState<'Easypaisa' | 'JazzCash' | ''>('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [requestAmount, setRequestAmount] = useState<number | string>('');
    
    const latestWithdrawal = withdrawalHistory?.[0];

    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setView('setup'); // Or redirect to login
            return;
        }
        setUser(user);

        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const { data: accountData, error: accountError } = await supabase.from('withdrawal_accounts').select('*').eq('user_id', user.id).maybeSingle();
        const { data: historyData } = await supabase.from('withdrawals').select('*').eq('user_id', user.id).order('requested_at', { ascending: false });
        
        if (accountError) {
             console.error("Error fetching account:", accountError);
             // This can happen if the RLS policies are not set up correctly or if there's a network issue.
             // We still want to let the user try to set up their account.
             if (accountError.code !== 'PGRST116') { // Ignore "not found" errors which are expected
                toast({ variant: 'destructive', title: 'Could not fetch withdrawal account', description: accountError.message });
             }
        }

        setProfile(profileData);
        const currentAccount = accountData ?? null;
        setSavedAccount(currentAccount);
        setWithdrawalHistory(historyData as WithdrawalHistory[] ?? []);
        
        if (currentAccount) {
            setView('saved');
        } else {
            setView('setup');
        }
    }

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('realtime-withdrawals')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, (payload) => {
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_accounts' }, (payload) => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleSaveAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !method || !accountName || !accountNumber) {
            toast({ variant: 'destructive', title: 'Please fill all fields.' });
            return;
        }

        const { error } = await supabase.from('withdrawal_accounts').upsert({
            user_id: user.id,
            method,
            account_name: accountName,
            account_number: accountNumber,
        }, {
            onConflict: 'user_id'
        });

        if (error) {
            console.error("Save account error:", error);
            toast({ variant: 'destructive', title: 'Error saving account', description: error.message });
        } else {
            toast({ title: 'Account saved successfully!' });
            await fetchData(); // This will refresh the state and change the view
        }
    };
    
    const handleEdit = () => {
        if(savedAccount) {
            setMethod(savedAccount.method);
            setAccountName(savedAccount.account_name);
            setAccountNumber(savedAccount.account_number);
            setView('setup');
        }
    }

    const handleWithdrawRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !requestAmount || !savedAccount) {
             toast({ variant: 'destructive', title: 'Please enter an amount.' });
            return;
        }
       
        const { error } = await supabase.from('withdrawals').insert({
            user_id: user.id,
            amount: requestAmount,
            method: savedAccount.method,
            account_info: { name: savedAccount.account_name, number: savedAccount.account_number },
            status: 'pending'
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Error submitting request', description: error.message });
        } else {
            toast({ title: 'Withdrawal request submitted!' });
            setRequestAmount('');
            fetchData();
        }
    };
    
    const renderWithdrawalStatus = () => {
        if (!latestWithdrawal || latestWithdrawal.status === 'approved' || latestWithdrawal.status === 'rejected') {
            return (
                 <form onSubmit={handleWithdrawRequest} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (PKR)</Label>
                        <Input id="amount" type="number" placeholder="600" value={requestAmount} onChange={e => setRequestAmount(e.target.value)} required/>
                    </div>
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Request Withdrawal</Button>
                </form>
            );
        }
        
        let statusText, Icon, colorClass;
        
        switch(latestWithdrawal.status) {
            case 'pending':
                statusText = 'Processing...';
                Icon = RefreshCw;
                colorClass = 'text-primary animate-spin';
                break;
            default:
                // This case handles approved/rejected for the latest request, showing the form again.
                // It should already be handled by the condition above, but as a fallback:
                 return (
                     <form onSubmit={handleWithdrawRequest} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (PKR)</Label>
                            <Input id="amount" type="number" placeholder="600" value={requestAmount} onChange={e => setRequestAmount(e.target.value)} required/>
                        </div>
                        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Request Withdrawal</Button>
                    </form>
                );
        }

        return (
            <div className="text-center py-4">
                <Icon className={`mx-auto h-10 w-10 mb-2 ${colorClass}`} />
                <p className="font-semibold text-lg">{statusText}</p>
                <p className="text-muted-foreground text-sm">Your request of {latestWithdrawal.amount} PKR is {latestWithdrawal.status}.</p>
            </div>
        )
    }

  return (
      <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="grid md:grid-cols-3 gap-8 mt-4 md:mt-0">
                <div className="md:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-6 w-6 text-primary"/>
                                Available Balance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">{profile?.total_earnings ?? 0} PKR</p>
                            <p className="text-xs text-muted-foreground">Ready for withdrawal</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Withdrawal Limits</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Minimum</span>
                                <span className="font-medium">600 PKR</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Maximum</span>
                                <span className="font-medium">1600 PKR</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                     {view === 'loading' && (
                        <Card>
                            <CardContent className="flex items-center justify-center h-48">
                                <p className="text-muted-foreground">Loading your account...</p>
                            </CardContent>
                        </Card>
                    )}
                    {view === 'setup' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Setup Withdrawal Method</CardTitle>
                                <CardDescription>Add your Easypaisa or JazzCash account details.</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <form onSubmit={handleSaveAccount} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="platform">Platform</Label>
                                    <Select value={method} onValueChange={(value) => setMethod(value as any)} required>
                                        <SelectTrigger id="platform">
                                            <SelectValue placeholder="Select Easypaisa or JazzCash" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Easypaisa">Easypaisa</SelectItem>
                                            <SelectItem value="JazzCash">JazzCash</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account-name">Account Holder Name</Label>
                                    <Input id="account-name" placeholder="e.g. Zulekhan Bibi" value={accountName} onChange={e => setAccountName(e.target.value)} required/>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="account-number">Account Number</Label>
                                    <Input id="account-number" placeholder="e.g. 03130306344" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} required/>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" className="w-full">Save Account</Button>
                                    {savedAccount && <Button variant="outline" className="w-full" onClick={() => setView('saved')}>Cancel</Button>}
                                </div>
                              </form>
                            </CardContent>
                        </Card>
                    )}
                    {view === 'saved' && savedAccount && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Request a Withdrawal</CardTitle>
                                <div className="flex items-center justify-between">
                                    <CardDescription>Your payment method is saved.</CardDescription>
                                     <Button variant="outline" size="sm" onClick={handleEdit}><Edit className="h-3 w-3 mr-2"/>Edit</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/20 text-green-700">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5"/>
                                        <h3 className="font-semibold">Information Saved</h3>
                                    </div>
                                    <p className="text-sm mt-1">Method: {savedAccount.method}</p>
                                    <p className="text-sm">Name: {savedAccount.account_name}</p>
                                    <p className="text-sm">Number: {savedAccount.account_number}</p>
                                </div>
                                {renderWithdrawalStatus()}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Withdrawal History</CardTitle>
                    <CardDescription>A record of your past withdrawal requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {view === 'loading' ? (
                                 <TableRow><TableCell colSpan={4} className="text-center py-12">Loading history...</TableCell></TableRow>
                             ) : withdrawalHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                                        You have no withdrawal history.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                withdrawalHistory.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{new Date(item.requested_at).toLocaleDateString()}</TableCell>
                                        <TableCell>{item.method}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                item.status === 'approved' ? 'default' :
                                                item.status === 'pending' ? 'secondary' : 'destructive'
                                                } className={
                                                    item.status === 'approved' ? 'bg-green-500/20 text-green-700' : ''
                                                }>
                                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{item.amount.toFixed(2)} PKR</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </div>
      </div>
  );
}
