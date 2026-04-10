import { Wallet } from "lucide-react"
import Link from "next/link"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type DashboardHeaderProps = {
  userName: string
  userRole: string
  balance: number
  isRetailer: boolean
}

export function DashboardHeader({
  userName,
  userRole,
  balance,
  isRetailer,
}: DashboardHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />

      <div className="ml-auto flex items-center gap-4">
        <div className="hidden flex-col text-right sm:flex">
          <span className="text-sm font-medium">{userName}</span>
          <span className="text-xs text-muted-foreground">{userRole}</span>
        </div>

        {isRetailer ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-9 gap-2 px-3">
                <Wallet className="h-4 w-4" />₹ {balance.toFixed(2)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/retailer/funds">Add Funds</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
            <Wallet className="h-4 w-4" />₹ {balance.toFixed(2)}
          </div>
        )}

        <LogoutButton />
      </div>
    </header>
  )
}
