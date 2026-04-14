import { auth, prisma } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ApprovalsTable } from "./components/approvals-table"

export default async function ApprovalsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== "ADMIN") {
    redirect("/retailer")
  }

  // Fetch pending users
  const pendingUsers = await prisma.user.findMany({
    where: { isApproved: false, isRejected: false, role: { not: "ADMIN" } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      whatsappNumber: true,
      aadharNumber: true,
      panNumber: true,
      gstNumber: true,
      businessType: true,
      address: true,
      pincode: true,
      state: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
        <p className="mt-1 text-muted-foreground">
          Review KYC submissions and approve new platform registrations.
        </p>
      </div>

      <div className="mt-8">
        <ApprovalsTable initialData={pendingUsers as any} />
      </div>
    </div>
  )
}
