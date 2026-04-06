import { auth, prisma } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Wallet,
  LogOut,
  FileText,
  Users,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const navLinks = isAdmin
    ? [
        { name: "Overview", href: "/admin", icon: LayoutDashboard },
        { name: "Ledger", href: "/admin/ledger", icon: Users },
      ]
    : [
        { name: "Recharges", href: "/retailer", icon: LayoutDashboard },
        {
          name: "Transaction History",
          href: "/retailer/history",
          icon: FileText,
        },
      ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2 text-lg font-bold">
          RechargePro
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden flex-col text-right sm:flex">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.role}</span>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
            <Wallet className="h-4 w-4" />₹ {user.balance.toFixed(2)}
          </div>

          <Link href="/api/auth/signout">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
          <nav className="grid gap-1 p-4 text-sm font-medium">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
