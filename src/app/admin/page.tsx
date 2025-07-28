"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import AdminDashboardLayout from "./layout";

const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="10" className="fill-primary" />
      <path d="M15.5 9.5L12 13L8.5 9.5" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 13V16" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 7H14" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    try {
      if (localStorage.getItem("admin_auth") === "true") {
        setIsAuth(true);
        router.replace("/admin/dashboard");
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, use a secure password check.
    if (password === "Sajid092#d") {
      try {
        localStorage.setItem("admin_auth", "true");
        setIsAuth(true);
        router.push("/admin/dashboard");
      } catch (error) {
        console.error("Could not set item in localStorage", error);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Could not save session. Please enable cookies/localStorage.",
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Incorrect password. Please try again.",
      });
    }
  };

  const handleLogout = () => {
      try {
        localStorage.removeItem("admin_auth");
      } catch (error) {
        console.error("Could not remove item from localStorage", error);
      }
      setIsAuth(false);
      // No need to push, just state change will re-render to the login form
  };


  if (isAuth) {
    // This part should not be reached due to the redirect, but as a fallback:
    // It renders the content within the layout if somehow the user is auth'd but on this page.
    return (
        <AdminDashboardLayout>
            <div className="flex flex-col items-center justify-center h-full">
                <p>You are logged in.</p>
                <Button onClick={handleLogout} className="mt-4">Logout</Button>
            </div>
        </AdminDashboardLayout>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1 text-center">
           <div className="flex justify-center mb-4">
                <LogoIcon />
            </div>
          <CardTitle className="text-2xl font-headline">Admin Panel Access</CardTitle>
          <CardDescription>
            Enter the password to manage Envo Earn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Enter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
