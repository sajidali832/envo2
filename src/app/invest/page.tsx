
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
import { ArrowLeft, Info, UserPlus } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { processInvestment } from "./actions";

const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="12" cy="12" r="10" className="fill-primary" />
        <path d="M15.5 9.5L12 13L8.5 9.5" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 13V16" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 7H14" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


function InvestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await processInvestment(formData);

    if (result.error) {
        toast({ variant: "destructive", title: "Submission failed", description: result.error });
    } else {
        toast({ title: "Submission successful!", description: "Your investment is under review."});
        const email = formData.get('email') as string;
        const redirectUrl = ref ? `/payment-status?email=${encodeURIComponent(email)}&ref=${ref}` : `/payment-status?email=${encodeURIComponent(email)}`;
        router.push(redirectUrl);
    }
    
    setLoading(false);
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
                <LogoIcon />
                <span className="font-bold font-headline">Envo Earn</span>
            </Link>
            <div className="w-10"></div>
          </div>
          <div className="text-center mt-4">
            <CardTitle className="text-2xl font-headline">Make Your Investment</CardTitle>
            <CardDescription>Follow the steps below to complete your payment.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {ref && referrerName && (
            <Alert variant="default" className="bg-green-500/10 border-green-500/20 text-green-700">
              <UserPlus className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">You were invited by {referrerName}!</AlertTitle>
              <AlertDescription className="text-green-700">
                Register after your investment is approved to receive a <strong>200 PKR bonus</strong>.
              </AlertDescription>
            </Alert>
          )}
           {ref && !referrerName && (
            <Alert variant="default" className="bg-green-500/10 border-green-500/20 text-green-700">
              <UserPlus className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">You were invited by a friend!</AlertTitle>
              <AlertDescription className="text-green-700">
                Register after your investment is approved to receive a <strong>200 PKR bonus</strong>.
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
                    <Label htmlFor="fullName">Your Full Name</Label>
                    <Input id="fullName" name="fullName" placeholder="e.g., John Doe" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Your Email Address</Label>
                    <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="accountNumber">Your Easypaisa Account Number</Label>
                    <Input id="accountNumber" name="accountNumber" placeholder="e.g., 03001234567" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="screenshot">Payment Screenshot</Label>
                    <Input id="screenshot" name="screenshot" type="file" required className="pt-2" />
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
