"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ExternalLink, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

type RetailerData = {
  id: string;
  name: string;
  email: string;
  balance: number;
  isSuspended: boolean;
  createdAt: Date;
  _count: { transactions: number };
};

export function RetailerTable({ initialData }: { initialData: RetailerData[] }) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const filteredData = data.filter(r => 
    r.name.toLowerCase().includes(query.toLowerCase()) || 
    r.email.toLowerCase().includes(query.toLowerCase())
  );

  const toggleSuspension = async (userId: string, currentStatus: boolean) => {
    // Optimistic rendering update
    setData(prev => prev.map(r => r.id === userId ? { ...r, isSuspended: !currentStatus } : r));

    try {
      const res = await fetch("/api/admin/retailer/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      if (!res.ok) {
        throw new Error("API Exception");
      }
      // Re-trigger router props silently to keep cached layouts in sync
      router.refresh();
    } catch {
      alert("Failed to securely toggle status. Reverting.");
      setData(prev => prev.map(r => r.id === userId ? { ...r, isSuspended: currentStatus } : r));
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search retailers by name or email..." 
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
              <TableHead>Retailer Info</TableHead>
              <TableHead>Wallet Balance</TableHead>
              <TableHead>Tx Volume</TableHead>
              <TableHead>Access Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No retailers match your search criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((retailer) => (
                <TableRow key={retailer.id} className={retailer.isSuspended ? "bg-muted/40" : ""}>
                  <TableCell>
                    <div className="font-semibold text-foreground">{retailer.name}</div>
                    <div className="text-sm text-muted-foreground">{retailer.email}</div>
                  </TableCell>
                  <TableCell className="font-bold text-lg">
                    ₹ {retailer.balance.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground">
                    {retailer._count.transactions} total
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center space-x-3">
                        <div className={`text-xs inline-flex items-center font-bold px-2.5 py-0.5 rounded-full ${retailer.isSuspended ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                          {retailer.isSuspended ? "Suspended" : "Active"}
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant={retailer.isSuspended ? "outline" : "destructive"} 
                        size="sm" 
                        onClick={() => toggleSuspension(retailer.id, retailer.isSuspended)}
                      >
                        {retailer.isSuspended ? "Remove Suspension" : <><ShieldAlert className="mr-1 h-3 w-3"/> Suspend</>}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => router.push(`/admin/retailer/${retailer.id}`)}>
                         View Ledgers <ExternalLink className="ml-1.5 h-3 w-3" />
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
  );
}
