import { auth, prisma } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RetailerTable } from "./components/retailer-table";

export default async function LedgerPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") {
    redirect("/retailer");
  }

  // Fetch all retailers with total transaction counts
  const retailers = await prisma.user.findMany({
    where: { role: "RETAILER" },
    select: {
      id: true,
      name: true,
      email: true,
      balance: true,
      isSuspended: true,
      createdAt: true,
      _count: {
        select: { transactions: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Retailer Directory</h1>
        <p className="text-muted-foreground mt-1">Manage network access, view wallet balances, and enforce platform security.</p>
      </div>

      <div className="mt-8">
        <RetailerTable initialData={retailers} />
      </div>
    </div>
  );
}
