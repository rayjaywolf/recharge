"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await authClient.signIn.email({
        email,
        password,
        fetchOptions: {
            onResponse: () => {
                setLoading(false);
            },
            onSuccess: () => {
                router.push("/");
            },
            onError: (ctx) => {
                alert(ctx.error.message);
            }
        }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40 backdrop-blur-sm">
      <Card className="w-full max-w-sm shadow-xl border-t-4 border-t-primary transition-all duration-300">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription>
            Enter your email and password to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="transition-colors hover:border-primary focus:border-primary"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="transition-colors hover:border-primary focus:border-primary"
              />
            </div>
            <Button className="w-full mt-2 transition-transform active:scale-[0.98]" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pb-6">
          <div className="text-sm text-center text-muted-foreground mt-2">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium underline underline-offset-4 hover:text-primary transition-colors">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
