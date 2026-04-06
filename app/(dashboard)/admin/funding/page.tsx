import { auth, prisma } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BankControls } from "./components/bank-controls";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function BankControlPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") {
    redirect("/retailer");
  }

  // Preload retailers for the Bank Controls Select menu
  const retailersList = await prisma.user.findMany({
    where: { role: "RETAILER" },
    select: { id: true, name: true, email: true, balance: true },
    orderBy: { name: "asc" }
  });

  // Fetch only manual banking actions
  const bankLedger = await prisma.transaction.findMany({
    where: {
      operator: { in: ["MANUAL_CREDIT", "MANUAL_DEBIT"] }
    },
    include: {
      user: { select: { name: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bank & Funding Center</h1>
        <p className="text-muted-foreground mt-1">Directly control active liquid limits, inject capital, and perform structural debits.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
         {/* Left Side: Actions */}
         <div>
            <BankControls retailers={retailersList} />
         </div>

         {/* Right Side: Ledger */}
         <div className="space-y-4">
            <h2 className="text-xl font-bold">Funding Ledger</h2>
            <div className="rounded-md border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Target Retailer</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankLedger.length === 0 ? (
                     <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No manual ledger actions recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                      bankLedger.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                             <div className="flex flex-col">
                               <span>{tx.createdAt.toLocaleDateString()}</span>
                               <span className="text-xs">{tx.createdAt.toLocaleTimeString()}</span>
                             </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{tx.user.name}</div>
                            <div className="text-xs text-muted-foreground">{tx.user.email}</div>
                          </TableCell>
                          <TableCell>
                             <div className={`font-bold p-1 px-2 rounded-md inline-block ${tx.operator === 'MANUAL_CREDIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                               {tx.operator === 'MANUAL_CREDIT' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                             </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={tx.apiMessage || "No remarks applied."}>
                              {tx.apiMessage || "No remarks"}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
         </div>
      </div>
    </div>
  );
}
