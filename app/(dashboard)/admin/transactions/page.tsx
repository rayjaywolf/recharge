import { auth, prisma } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FilterBar } from "./components/filter-bar"

export default async function MasterLedgerPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== "ADMIN") redirect("/retailer")

  const resolvedParams = await props.searchParams

  const status = resolvedParams.status as string
  const operator = resolvedParams.operator as string
  const search = resolvedParams.search as string
  const dateFrom = resolvedParams.dateFrom as string
  const dateTo = resolvedParams.dateTo as string

  // Build dynamic Where clause filtering out manual limits automatically
  const whereClause: any = {
    operator: { notIn: ["MANUAL_CREDIT", "MANUAL_DEBIT"] },
  }

  if (status && status !== "ALL") {
    whereClause.status = status as any
  }

  if (operator && operator !== "ALL") {
    whereClause.operator = operator
  }

  if (search && search.trim() !== "") {
    whereClause.OR = [
      { targetPhone: { contains: search, mode: "insensitive" } },
      { apiReferenceId: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ]
  }

  if (dateFrom || dateTo) {
    whereClause.createdAt = {}
    if (dateFrom) {
      whereClause.createdAt.gte = new Date(dateFrom)
    }
    if (dateTo) {
      // Add one day to dateTo to map midnight constraints correctly
      const endsAt = new Date(dateTo)
      endsAt.setDate(endsAt.getDate() + 1)
      whereClause.createdAt.lte = endsAt
    }
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 150, // Hard limit for safety in MVP rendering
  })

  return (
    <div className="animate-in space-y-6 duration-500 fade-in slide-in-from-bottom-3">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="mt-1 text-muted-foreground">
          View and filter all platform transactions.
        </p>
      </div>

      <div className="flex flex-col space-y-4">
        <FilterBar
          initialStatus={status || "ALL"}
          initialOperator={operator || "ALL"}
          initialSearch={search || ""}
          initialDateFrom={dateFrom || ""}
          initialDateTo={dateTo || ""}
        />

        <div className="overflow-hidden rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Retailer</TableHead>
                <TableHead>Carrier & Phone</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No transactions match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {tx.createdAt.toLocaleDateString()}
                        </span>
                        <span className="text-xs">
                          {tx.createdAt.toLocaleTimeString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{tx.user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {tx.user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{tx.operator}</div>
                      <div className="font-mono text-sm tracking-tight text-muted-foreground">
                        {tx.targetPhone}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">
                      ₹{tx.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                          tx.status === "SUCCESS"
                            ? "bg-emerald-500/15 text-emerald-700"
                            : tx.status === "FAILED" || tx.status === "REFUNDED"
                              ? "bg-red-500/15 text-red-700"
                              : "bg-amber-500/15 text-amber-700"
                        }`}
                      >
                        {tx.status}
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-[150px] truncate font-mono text-xs text-muted-foreground"
                      title={tx.apiReferenceId || tx.id}
                    >
                      {tx.apiReferenceId || tx.id}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
