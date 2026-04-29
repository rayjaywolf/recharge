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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function RetailerCommissionsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  // Assuming a retailer doesn't have a specific role string restriction to view their own dashboard,
  // but if they do, we'd check it. Typically any user can be a retailer.
  if (user?.role === "ADMIN" || user?.role === "DISTRIBUTOR") {
    // Optional: redirect to their own dashboard, though typically standard users fall back here.
  }

  const rules = await prisma.commissionRule.findMany({
    orderBy: { operator: "asc" }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Commissions</h1>
        <p className="mt-1 text-muted-foreground">
          View the margin you earn for each operator when processing a recharge.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operator Margins</CardTitle>
          <CardDescription>
            These are the standard rates applied to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operator</TableHead>
                <TableHead className="text-right">Your Margin (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                    No commission rules currently configured by the admin.
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.operator}</TableCell>
                    <TableCell className="text-right font-medium">
                      {rule.retailerMargin.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
