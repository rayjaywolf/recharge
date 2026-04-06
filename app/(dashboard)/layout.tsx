import { auth, prisma } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

import Link from "next/link"
import { Wallet } from "lucide-react"
import { LogoutButton } from "@/components/logout-button"

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

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar isAdmin={isAdmin} />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            
            <div className="ml-auto flex items-center gap-4">
              <div className="hidden flex-col text-right sm:flex">
                 <span className="text-sm font-medium">{user.name}</span>
                 <span className="text-xs text-muted-foreground">{user.role}</span>
              </div>
              
              <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
                <Wallet className="h-4 w-4" />₹ {user.balance.toFixed(2)}
              </div>
              
              <LogoutButton />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
