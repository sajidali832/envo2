
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
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="20" cy="20" r="20" className="fill-primary" />
        <path d="M15.424 26V14H26V16.6H19.584V19.14H24.84V21.74H19.584V26H15.424Z" className="fill-primary-foreground" />
    </svg>
);


function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [investmentId, setInvestmentId] = useState<number | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    const refFromQuery = searchParams.get('ref');

    // If user lands on /register with a ref code, redirect to /invest
    if (refFromQuery && !emailFromQuery) {
        router.replace(`/invest?ref=${refFromQuery}`);
        return;
    }

    if (refFromQuery) {
        setRefCode(refFromQuery);
    }

    if (!emailFromQuery) {
      setIsValid(false);
      return;
    }
    
    const verifyInvestment = async () => {
        const { data, error } = await supabase
            .from('investments')
            .select('id, status')
            .eq('email', emailFromQuery)
            .eq('status', 'approved')
            .is('user_id', null) // Check if account is not already created
            .limit(1)
            .single();

        if (error || !data) {
            setIsValid(false);
        } else {
            setIsValid(true);
            setEmail(emailFromQuery);
            setInvestmentId(data.id);
        }
    };
    verifyInvestment();
  }, [searchParams, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }
    if (!investmentId) {
      toast({ variant: "destructive", title: "Error", description: "Could not find a valid investment to link." });
      return;
    }
    setLoading(true);

    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          referral_code: `${fullName.split(' ')[0].toLowerCase()}${Math.random().toString(36).substring(2, 6)}`
        }
      }
    });

    if (error) {
        setLoading(false);
        toast({ variant: "destructive", title: "Registration Failed", description: error.message });
        return;
    }
    
    if (user) {
        // Call the RPC function to finalize registration
        const { error: rpcError } = await supabase.rpc('finalize_registration_with_bonus', {
            p_investment_id: investmentId,
            p_new_user_id: user.id,
            p_referral_code: refCode
        });

        if (rpcError) {
             setLoading(false);
             toast({ variant: "destructive", title: "Bonus Error", description: `Account created, but failed to apply referral bonus: ${rpcError.message}` });
             // Even if bonus fails, we proceed
        }
    }
    
    setLoading(false);
    toast({ title: "Registration Successful!", description: "Please check your email to verify your account." });
    router.push("/login");
  };

  if (isValid === null) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
             <Card className="w-full max-w-md mx-4 p-8 text-center">
                Verifying your eligibility...
             </Card>
        </div>
      )
  }

  if (!isValid) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
             <Card className="w-full max-w-md mx-4">
                 <CardHeader>
                     <CardTitle>Registration Not Allowed</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        You must have a recent, approved investment to create an account, or an account may already exist for this investment. Please start by making a new investment.
                      </AlertDescription>
                    </Alert>
                    <Button asChild className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                        <Link href="/invest">Invest Now</Link>
                    </Button>
                 </CardContent>
            </Card>
        </div>
      );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
                <LogoIcon />
          </div>
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>
            Your investment is approved! Complete your registration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input id="full-name" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
              {loading ? 'Creating...' : 'Create account'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RegisterForm />
        </Suspense>
    )
}
