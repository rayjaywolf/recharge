"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, ExternalLink, ShieldAlert, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

type UserData = {
  id: string
  name: string
  email: string
  role: string
  balance: number
  isSuspended: boolean
  createdAt: Date
  distributor?: { name: string } | null
  _count: { transactions: number }
}

export function UserTable({
  title,
  initialData,
  distributors,
  hideDistributorCol = false,
}: {
  title: string
  initialData: UserData[]
  distributors: { id: string; name: string }[]
  hideDistributorCol?: boolean
}) {
  const [data, setData] = useState(initialData)
  const [query, setQuery] = useState("")
  const router = useRouter()

  const filteredData = data.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.email.toLowerCase().includes(query.toLowerCase())
  )

  const toggleSuspension = async (userId: string, currentStatus: boolean) => {
    // Optimistic rendering update
    setData((prev) =>
      prev.map((r) =>
        r.id === userId ? { ...r, isSuspended: !currentStatus } : r
      )
    )

    try {
      const res = await fetch("/api/admin/retailer/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) {
        throw new Error("API Exception")
      }
      // Re-trigger router props silently to keep cached layouts in sync
      router.refresh()
    } catch {
      alert("Failed to securely toggle status. Reverting.")
      setData((prev) =>
        prev.map((r) =>
          r.id === userId ? { ...r, isSuspended: currentStatus } : r
        )
      )
    }
  }

  const updateRole = async (userId: string) => {
    const roleStr = prompt("Enter new role: RETAILER, DISTRIBUTOR, or ADMIN", "RETAILER");
    if (!roleStr) return;
    const role = roleStr.toUpperCase();
    if (!["RETAILER", "DISTRIBUTOR", "ADMIN"].includes(role)) return alert("Invalid role");

    let distributorId = null;
    if (role === "RETAILER") {
       const distOptions = distributors.map(d => `${d.id} (${d.name})`).join("\n");
       distributorId = prompt(`Enter Distributor ID (optional):\n${distOptions}`);
       // allow null
       if (!distributorId) distributorId = null;
    }

    try {
      const res = await fetch("/api/admin/users/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role, distributorId }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      alert("User updated successfully");
      router.refresh();
    } catch (e) {
      alert("Error updating user");
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Info</TableHead>
              <TableHead>Role</TableHead>
              {!hideDistributorCol && <TableHead>Distributor</TableHead>}
              <TableHead>Wallet Balance</TableHead>
              <TableHead>Tx Volume</TableHead>
              <TableHead>Access Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No users match your search criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((user) => (
                <TableRow
                  key={user.id}
                  className={user.isSuspended ? "bg-muted/40" : ""}
                >
                  <TableCell>
                    <div className="font-semibold text-foreground">
                      {user.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold">
                      {user.role}
                    </span>
                  </TableCell>
                  {!hideDistributorCol && (
                    <TableCell className="text-sm text-muted-foreground">
                      {user.distributor ? user.distributor.name : "—"}
                    </TableCell>
                  )}
                  <TableCell className="text-lg font-bold">
                    ₹ {user.balance.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground">
                    {user._count.transactions} total
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${user.isSuspended ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}
                      >
                        {user.isSuspended ? "Suspended" : "Active"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateRole(user.id)}
                      >
                        <Settings className="mr-1 h-3 w-3" /> Config
                      </Button>
                      <Button
                        variant={
                          user.isSuspended ? "outline" : "destructive"
                        }
                        size="sm"
                        onClick={() =>
                          toggleSuspension(user.id, user.isSuspended)
                        }
                      >
                        {user.isSuspended ? (
                          "Restore"
                        ) : (
                          <>
                            <ShieldAlert className="mr-1 h-3 w-3" /> Suspend
                          </>
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/retailer/${user.id}`)
                        }
                      >
                        Ledgers <ExternalLink className="ml-1.5 h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
