"use client";

import Link from "next/link";
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
import { Landmark, ArrowLeft, Info, UserPlus } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

function InvestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setRef(refCode);
      const fetchReferrer = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('referral_code', refCode)
          .single();
        if (data) {
          setReferrerName(data.full_name);
        }
      };
      fetchReferrer();
    }
  }, [searchParams]);

  const easypaisaDetails = {
    accountName: "Zulekhan",
    phoneNumber: "03130306344",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshot || !email) {
        toast({ variant: "destructive", title: "Please fill all fields and upload a screenshot."});
        return;
    }

    setLoading(true);

    try {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${email}-${Date.now()}.${fileExt}`;
        const filePath = `screenshots/${fileName}`;

        let { error: uploadError } = await supabase.storage
            .from('investments')
            .upload(filePath, screenshot);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('investments')
            .getPublicUrl(filePath);

        const { error: insertError } = await supabase
            .from('investments')
            .insert({
                user_name: fullName,
                user_account_number: accountNumber,
                screenshot_url: publicUrl,
                status: 'pending',
                email: email,
                referred_by_code: ref,
            });

        if (insertError) throw insertError;

        toast({ title: "Submission successful!", description: "Your investment is under review."});
        router.push(`/payment-status?email=${encodeURIComponent(email)}`);

    } catch (error: any) {
        toast({ variant: "destructive", title: "Submission failed", description: error.message });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <Link href="/" className="flex items-center gap-2">
                <Landmark className="h-6 w-6 text-primary" />
                <span className="font-bold font-headline">Envo-Earn</span>
            </Link>
            <div className="w-10"></div>
          </div>
          <div className="text-center mt-4">
            <CardTitle className="text-2xl font-headline">Make Your Investment</CardTitle>
            <CardDescription>Follow the steps below to complete your payment.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {referrerName && (
            <Alert variant="default" className="bg-primary/10 border-primary/20">
              <UserPlus className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">You were referred!</AlertTitle>
              <AlertDescription>
                You were invited by <strong>{referrerName}</strong>.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <h3 className="font-semibold mb-2">Step 1: Send payment via Easypaisa</h3>
            <div className="p-4 rounded-lg border bg-background space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Account Name</p>
                        <p className="font-medium">{easypaisaDetails.accountName}</p>
                    </div>
                    <CopyButton textToCopy={easypaisaDetails.accountName} />
                </div>
                 <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Phone Number</p>
                        <p className="font-mono text-lg">{easypaisaDetails.phoneNumber}</p>
                    </div>
                    <CopyButton textToCopy={easypaisaDetails.phoneNumber} />
                </div>
            </div>
             <Alert className="mt-4 bg-accent/20 border-accent/50">
              <Info className="h-4 w-4 text-accent" />
              <AlertTitle className="font-headline text-accent">Important!</AlertTitle>
              <AlertDescription>
                Please send exactly <strong>6000 PKR</strong> and save a screenshot of the transaction.
              </AlertDescription>
            </Alert>
          </div>

          <div>
             <h3 className="font-semibold mb-2">Step 2: Submit your details</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="account-name">Your Full Name</Label>
                    <Input id="account-name" placeholder="e.g., John Doe" required value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Your Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="account-number">Your Easypaisa Account Number</Label>
                    <Input id="account-number" placeholder="e.g., 03001234567" required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="screenshot">Payment Screenshot</Label>
                    <Input id="screenshot" type="file" required className="pt-2" onChange={e => setScreenshot(e.target.files ? e.target.files[0] : null)} />
                    <p className="text-xs text-muted-foreground">Upload the screenshot of your payment confirmation.</p>
                </div>
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit for Verification'}
                </Button>
             </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvestPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <InvestContent />
        </Suspense>
    )
}
