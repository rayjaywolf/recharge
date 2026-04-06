"use client"

import * as React from "react"
import { LayoutDashboard, FileText, Users, Zap, Landmark, History } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"

import Link from "next/link"

export function AppSidebar({ isAdmin }: { isAdmin: boolean }) {
  const navLinks = isAdmin
    ? [
        { name: "Overview", href: "/admin", icon: LayoutDashboard },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Funding", href: "/admin/funding", icon: Landmark },
        { name: "Master Ledger", href: "/admin/transactions", icon: History },
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-14 items-center justify-center border-b border-border px-4 py-0">
        <div className="flex w-full items-center gap-2 text-lg font-bold group-data-[collapsible=icon]:justify-center">
          <span className="group-data-[collapsible=icon]:hidden">RechargePro</span>
          <span className="hidden group-data-[collapsible=icon]:block">R</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mt-2">Menu</SidebarGroupLabel>
          <SidebarMenu>
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton asChild tooltip={link.name}>
                    <Link href={link.href}>
                      <Icon />
                      <span>{link.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
