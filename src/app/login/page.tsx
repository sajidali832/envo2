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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } else {
      router.push("/dashboard");
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
       <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
                <Image src="/logo.png" alt="Envo-Earn Logo" width={40} height={40} />
            </div>
            <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
            <CardDescription>
                Enter your credentials to access your account
            </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/invest" className="underline font-bold text-accent">
              Invest Now
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
