"use client";

import { useState } from "react";
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
import { Landmark } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Sajid092#d") {
      // In a real app, you'd use a more secure session management.
      // For this prototype, we'll use a simple flag in localStorage.
      try {
        localStorage.setItem("admin_auth", "true");
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1 text-center">
           <div className="flex justify-center mb-4">
                <Landmark className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="text-2xl font-headline">Admin Panel Access</CardTitle>
          <CardDescription>
            Enter the password to manage Envo-Earn.
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
