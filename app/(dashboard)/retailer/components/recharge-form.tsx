"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";

const operators = [
  { value: "JIO", label: "Jio" },
  { value: "AIRTEL", label: "Airtel" },
  { value: "VI", label: "Vi (Vodafone Idea)" },
  { value: "BSNL", label: "BSNL" },
];

export function RechargeForm() {
    const [phone, setPhone] = useState("");
    const [operator, setOperator] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [idempotencyKey, setIdempotencyKey] = useState("");
    const isSubmitting = React.useRef(false);
    const router = useRouter();

    React.useEffect(() => {
       setIdempotencyKey(crypto.randomUUID());
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSubmitting.current) return; // Instantly lock to catch rapid clicks
        isSubmitting.current = true;
        setLoading(true);

        try {
            const res = await fetch("/api/recharge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone,
                    operator,
                    amount: Number(amount),
                    idempotencyKey
                })
            });

            const data = await res.json();
            const params = new URLSearchParams({
                status: res.ok ? "success" : "failed",
                message: res.ok ? (data.message || "Recharge completed successfully") : (data.error || "Failed to process recharge"),
                phone,
                operator,
                amount,
                referenceId: data?.transaction?.apiReferenceId || ""
            });

            router.push(`/retailer/recharge/confirmation?${params.toString()}`);
            router.refresh();
        } catch {
            // Regeneration to permit retry on strict failure
            setIdempotencyKey(crypto.randomUUID());
            const params = new URLSearchParams({
                status: "failed",
                message: "An unexpected error occurred. Please try again.",
                phone,
                operator,
                amount
            });
            router.push(`/retailer/recharge/confirmation?${params.toString()}`);
        } finally {
            isSubmitting.current = false;
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 w-full">
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
              <input type="hidden" name="operator" value={operator} required />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    id="operator"
                    type="button"
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    {operator
                      ? operators.find((item) => item.value === operator)?.label
                      : "Select an operator"}
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {operators.map((item) => (
                    <DropdownMenuItem
                      key={item.value}
                      onSelect={() => setOperator(item.value)}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
