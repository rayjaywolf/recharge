"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2, Landmark, ArrowDownToDot, ArrowUpFromDot } from "lucide-react";

type RetailerInfo = {
  id: string;
  name: string;
  email: string;
  balance: number;
};

export function BankControls({ retailers }: { retailers: RetailerInfo[] }) {
    const [activeTab, setActiveTab] = useState<"credit" | "debit">("credit");
    const [userId, setUserId] = useState("");
    const [amount, setAmount] = useState("");
    const [remarks, setRemarks] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: "error" | "success" } | null>(null);
    const router = useRouter();

    const selectedRetailer = retailers.find(r => r.id === userId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch("/api/admin/fund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    amount: Number(amount),
                    actionType: activeTab,
                    remarks: remarks.trim() === "" ? undefined : remarks.trim()
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ text: data.error || "Bank request failed.", type: "error" });
            } else {
                setMessage({ text: data.message || "Transaction committed successfully!", type: "success" });
                setAmount("");
                setRemarks("");
                router.refresh(); 
            }
        } catch (err) {
            setMessage({ text: "An unexpected error occurred.", type: "error" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="w-full">
            <CardHeader className="pb-4">
                <div className="flex bg-muted p-1 rounded-md mb-4 w-full">
                  <button 
                    type="button"
                    onClick={() => { setActiveTab("credit"); setMessage(null); }}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center ${activeTab === 'credit' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <ArrowDownToDot className="mr-2 h-4 w-4 text-emerald-500" />
                    Credit Wallet
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setActiveTab("debit"); setMessage(null); }}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center ${activeTab === 'debit' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <ArrowUpFromDot className="mr-2 h-4 w-4 text-red-500" />
                    Debit / Revert
                  </button>
                </div>

                <CardTitle>
                    {activeTab === "credit" ? "Inject Retailer Capital" : "Revert Wallet Funds"}
                </CardTitle>
                <CardDescription>
                    {activeTab === "credit" 
                       ? "Push live usable funds into a retailer's limits safely." 
                       : "Extract capabilities back from a retailer's live available limits."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form id="bank-form" onSubmit={handleSubmit} className="grid gap-6">
                    {message && (
                        <Alert variant={message.type === "error" ? "destructive" : "default"}>
                            {message.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="grid gap-2">
                      <Label htmlFor="retailer">Select Target Account</Label>
                      <Select value={userId} onValueChange={(val) => { setUserId(val); setMessage(null); }} required>
                        <SelectTrigger id="retailer">
                          <SelectValue placeholder="Choose a target retailer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {retailers.length === 0 ? (
                            <SelectItem value="empty" disabled>No active constraints</SelectItem>
                          ) : (
                            retailers.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name} · {r.email}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      
                      {selectedRetailer && (
                        <div className="text-xs mt-1 text-muted-foreground bg-muted p-2 rounded-md">
                          Live Active Wallet: <span className="font-bold text-foreground">₹ {selectedRetailer.balance.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="amount">Capital Payload (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="1"
                        placeholder="5000"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={activeTab === 'debit' ? 'border-red-200 focus-visible:ring-red-200' : 'border-emerald-200 focus-visible:ring-emerald-200'}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="remarks">Ledger Remarks (Optional)</Label>
                      <Input
                        id="remarks"
                        type="text"
                        placeholder="e.g. Paid via UPI on specific date..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    </div>
                </form>
            </CardContent>
            <CardFooter>
                 <Button form="bank-form" className={`w-full ${activeTab === 'debit' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`} type="submit" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Landmark className="mr-2 h-4 w-4" />}
                    {activeTab === "credit" ? "Commit Credit Matrix" : "Force Debit Deduction"}
                 </Button>
            </CardFooter>
        </Card>
    );
}
