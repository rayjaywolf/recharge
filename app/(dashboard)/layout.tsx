import { auth, prisma } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DashboardHeader } from "@/components/dashboard-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    redirect("/login")
  }

  const isAdmin = user.role === "ADMIN"
  const isRetailer = user.role === "RETAILER"
  const notifications: {
    id: string
    title: string
    description: string
    createdAt: string
  }[] = []

  if (isRetailer) {
    const [recentCredits, recentRechargeUpdates] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: user.id,
          operator: "MANUAL_CREDIT",
        },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.transaction.findMany({
        where: {
          userId: user.id,
          operator: { notIn: ["MANUAL_CREDIT", "MANUAL_DEBIT"] },
          status: { in: ["SUCCESS", "FAILED", "REFUNDED"] },
        },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    ])

    for (const credit of recentCredits) {
      notifications.push({
        id: `balance-added-${credit.id}`,
        title: "Balance added",
        description: `INR ${credit.amount.toLocaleString()} was added to your wallet.`,
        createdAt: credit.createdAt.toISOString(),
      })
    }

    for (const recharge of recentRechargeUpdates) {
      const title =
        recharge.status === "SUCCESS"
          ? "Recharge successful"
          : recharge.status === "REFUNDED"
            ? "Recharge refunded"
            : "Recharge failed"

      notifications.push({
        id: `recharge-update-${recharge.id}`,
        title,
        description: `${recharge.operator} recharge for ${recharge.targetPhone} of INR ${recharge.amount.toLocaleString()}.`,
        createdAt: recharge.createdAt.toISOString(),
      })
    }

    notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar isAdmin={isAdmin} />
        <SidebarInset>
          <DashboardHeader
            userName={user.name}
            userRole={user.role}
            balance={user.balance}
            isRetailer={isRetailer}
            userId={user.id}
            notifications={notifications}
          />

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mx-auto">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
