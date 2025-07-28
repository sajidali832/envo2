"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const ref = searchParams.get("ref");
  const router = useRouter();

  const [status, setStatus] = useState<string | null>(null); // 'pending', 'approved', 'rejected', or null
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    if (!email) {
      setError("No email address provided. Please start the investment process again.");
      return;
    }

    const checkStatus = async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("status")
        .eq("email", email)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        setError("Could not verify your payment status. Please try again later.");
      } else if (data) {
        setStatus(data.status);
      } else {
         setError("No investment submission found for this email address.");
      }
    };
    
    checkStatus();
    
    const statusInterval = setInterval(() => {
        if (status === 'pending') {
            checkStatus();
        } else {
            clearInterval(statusInterval);
        }
    }, 5000); // Poll status every 5 seconds

     const timerInterval = setInterval(() => {
        setCountdown(prev => {
            if (prev <= 1 || status !== 'pending') {
                clearInterval(timerInterval);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    return () => {
        clearInterval(statusInterval);
        clearInterval(timerInterval);
    };
  }, [email, router, status]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  const renderContent = () => {
    if (error) {
      return (
        <>
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <CardTitle className="text-2xl font-headline mt-4">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </>
      );
    }
    
    switch (status) {
        case 'approved':
            return (
                <>
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <CardTitle className="text-2xl font-headline mt-4">Verification Complete</CardTitle>
                    <CardDescription>Your payment has been approved. You can now create your account.</CardDescription>
                </>
            );
        case 'rejected':
            return (
                <>
                    <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle className="text-2xl font-headline mt-4">Investment Rejected</CardTitle>
                    <CardDescription>There was an issue with your submission (e.g., incorrect payment amount or invalid screenshot). Please try again.</CardDescription>
                </>
            );
        case 'pending':
        default:
            return (
                <>
                    <div className="relative w-32 h-32 mx-auto">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                                className="text-gray-200 stroke-current"
                                strokeWidth="5"
                                cx="50"
                                cy="50"
                                r="45"
                                fill="transparent"
                            ></circle>
                            {/* Progress circle */}
                            <circle
                                className="text-primary-500 progress-ring__circle stroke-current"
                                strokeWidth="5"
                                strokeLinecap="round"
                                cx="50"
                                cy="50"
                                r="45"
                                fill="transparent"
                                strokeDasharray="282.6"
                                strokeDashoffset={`calc(282.6 - (282.6 * ${countdown}) / 600)`}
                                style={{ transition: 'stroke-dashoffset 1s linear' }}
                            ></circle>
                        </svg>
                         <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-2xl font-mono font-bold text-primary">
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-headline mt-4">Payment Under Review</CardTitle>
                    <CardDescription>Please wait while we verify your payment. This page will update automatically.</CardDescription>
                </>
            );
    }
  };

  const renderAction = () => {
     if (status === 'approved') {
         const registerUrl = ref ? `/register?email=${encodeURIComponent(email!)}&ref=${ref}` : `/register?email=${encodeURIComponent(email!)}`;
         return (
            <Button asChild size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href={registerUrl}>Create Your Account</Link>
            </Button>
         )
     }
      if (status === 'rejected') {
         return (
            <Button asChild size="lg" className="w-full">
              <Link href="/invest" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4"/>
                  Try Again
              </Link>
            </Button>
         )
     }
     return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-md mx-4 text-center">
        <CardHeader>
            {renderContent()}
        </CardHeader>
        <CardContent className="space-y-6">
            {renderAction()}
             <p className="text-xs text-muted-foreground">
                You can safely close this window. We will notify you via email if your status changes.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentStatusPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PaymentStatusContent />
        </Suspense>
    )
}
