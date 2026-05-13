"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Capacitor } from "@capacitor/core"
import { Share2 } from "lucide-react"

export function ReceiptActions({ isSuccess, phone, amount }: { isSuccess: boolean, phone: string, amount: string }) {
  const isCapacitor = Capacitor.isNativePlatform()

  const handleShare = async () => {
    if (isCapacitor) {
      // In a real app, use Capacitor Share plugin here
      alert(`Sharing receipt for ₹${amount} recharge on ${phone}`)
    }
  }

  return (
    <div className="flex gap-3 pt-2 flex-wrap">
      <Button asChild className="select-none">
        <Link href="/retailer/recharge">Do Another Recharge</Link>
      </Button>
      <Button asChild variant="outline" className="select-none">
        <Link href="/retailer/ledger">View Ledger</Link>
      </Button>
      {isSuccess && isCapacitor && (
        <Button variant="secondary" onClick={handleShare} className="select-none flex items-center gap-2">
          <Share2 className="w-4 h-4" /> Share Receipt
        </Button>
      )}
    </div>
  )
}
