import { auth, prisma } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { RechargeForm } from "./components/recharge-form";

export default async function RetailerDashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Retailer Portal</h1>
        <p className="text-muted-foreground mt-2">Initiate remote recharges and view your personal history.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Recharge</CardTitle>
            <CardDescription>Enter details below to perform a recharge instantly.</CardDescription>
          </CardHeader>
          <CardContent>
             <RechargeForm />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent History</CardTitle>
            <CardDescription>Your latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                No recent transactions.
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
