import { auth, prisma } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, User as UserIcon, Wallet, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function RetailerLedgerPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") {
    redirect("/retailer");
  }

  const { id } = await props.params;

  // Pull individual transaction block
  const targetRetailer = await prisma.user.findUnique({
    where: { id: id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!targetRetailer) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Retailer Not Found</h2>
        <Link href="/admin/users" className="text-sm text-primary hover:underline">
          Return to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Retailer Trace</h1>
        <p className="text-muted-foreground mt-1">Audit transactions, manual credits, and limits for {targetRetailer.name}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Info</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tracking-tight truncate">{targetRetailer.email}</div>
            <p className="text-xs text-muted-foreground mt-1">Joined {targetRetailer.createdAt.toLocaleDateString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tracking-tight text-emerald-600">₹ {targetRetailer.balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total operational limit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="mt-1">
                <div className={`text-xs inline-flex items-center font-bold px-2.5 py-0.5 rounded-full ${targetRetailer.isSuspended ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                  {targetRetailer.isSuspended ? "SUSPENDED" : "ACTIVE"}
                </div>
             </div>
            <p className="text-xs text-muted-foreground mt-2">Change status inside directory.</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-card mt-8">
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reference ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {targetRetailer.transactions.length === 0 ? (
               <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No transaction history logged for this retailer yet.
                </TableCell>
              </TableRow>
            ) : (
                targetRetailer.transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                       {tx.createdAt.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {tx.operator === "MANUAL_CREDIT" ? (
                        <span className="font-semibold text-emerald-600">Wallet Top-up</span>
                      ) : (
                        <div>
                           <div className="font-semibold">{tx.operator}</div>
                           <div className="text-xs text-muted-foreground">{tx.targetPhone}</div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-bold">
                       ₹ {tx.amount.toLocaleString()}
                    </TableCell>
                     <TableCell>
                       <div className={`px-2 py-0.5 rounded-md text-xs font-semibold inline-block ${
                          tx.status === "SUCCESS" ? "bg-emerald-500/15 text-emerald-700" :
                          tx.status === "FAILED" || tx.status === "REFUNDED" ? "bg-red-500/15 text-red-700" :
                          "bg-amber-500/15 text-amber-700"
                       }`}>
                         {tx.status}
                       </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground max-w-xs truncate" title={tx.apiReferenceId || tx.id}>
                        {tx.apiReferenceId || tx.id}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
         </Table>
      </div>

    </div>
  );
}
