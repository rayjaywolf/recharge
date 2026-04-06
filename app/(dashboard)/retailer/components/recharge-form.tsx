"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export function RechargeForm() {
    const [phone, setPhone] = useState("");
    const [operator, setOperator] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: "error" | "success" } | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch("/api/recharge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone,
                    operator,
                    amount: Number(amount)
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ text: data.error || "Failed to process recharge", type: "error" });
            } else {
                setMessage({ text: data.message || "Recharge successful!", type: "success" });
                setPhone("");
                setOperator("");
                setAmount("");
                // Refresh the page router data (like the balance tracking Header sitting in the layout above)
                router.refresh();
            }
        } catch (err) {
            setMessage({ text: "An unexpected error occurred. Please try again.", type: "error" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 w-full">
            {message && (
                <Alert variant={message.type === "error" ? "destructive" : "default"}>
                    {message.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="operator">Operator</Label>
              <Select value={operator} onValueChange={setOperator} required>
                <SelectTrigger id="operator">
                  <SelectValue placeholder="Select an operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JIO">Jio</SelectItem>
                  <SelectItem value="AIRTEL">Airtel</SelectItem>
                  <SelectItem value="VI">Vi (Vodafone Idea)</SelectItem>
                  <SelectItem value="BSNL">BSNL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="100"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <Button className="w-full mt-2" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Initiate Recharge
            </Button>
        </form>
    );
}
