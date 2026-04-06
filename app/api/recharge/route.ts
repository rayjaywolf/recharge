import { NextResponse } from "next/server";
import { auth, prisma } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phone, operator, amount } = body;

    if (!phone || !operator || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Wrap the initial transaction check in a Prisma $transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock/Fetch user securely to avoid race conditions
      const user = await tx.user.findUnique({
        where: { id: session.user.id }
      });
      
      if (!user) {
        throw new Error("User not found");
      }

      if (user.isSuspended) {
        throw new Error("ACCOUNT_SUSPENDED");
      }

      if (user.balance < amount) {
        throw new Error("Insufficient balance");
      }

      // 2. Deduct balance sequentially
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: amount } }
      });

      // 3. Document PENDING transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          targetPhone: phone,
          operator: operator,
          amount: amount,
          status: "PENDING"
        }
      });

      return transaction;
    });

    // 4. Mock API Call to 3rd party provider
    // Using a timeout to simulate a real payment delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Test data constraint logic: 10% failure chance naturally
    const isSuccess = Math.random() > 0.1; 

    // Update the record with actual gateway result
    const updatedTransaction = await prisma.transaction.update({
      where: { id: result.id },
      data: {
        status: isSuccess ? "SUCCESS" : "FAILED",
        apiMessage: isSuccess ? "Mock provider: Recharge successful" : "Mock provider: Gateway error",
        apiReferenceId: `MOCK-${Date.now()}`
      }
    });

    // Handle refunds seamlessly if gateway fails
    if (!isSuccess) {
      await prisma.$transaction([
        prisma.user.update({
           where: { id: session.user.id },
           data: { balance: { increment: amount } }
        }),
        prisma.transaction.update({
           where: { id: result.id },
           data: { status: "REFUNDED" }
        })
      ]);
      
      return NextResponse.json({ 
        error: "Recharge failed at carrier gateway. Amount has been refunded.",
        transaction: updatedTransaction 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Recharge completed successfully",
      transaction: updatedTransaction 
    });

  } catch (error: any) {
    if (error.message === "ACCOUNT_SUSPENDED") {
      return NextResponse.json({ error: "Your account has been suspended by the administrator." }, { status: 403 });
    }
    if (error.message === "Insufficient balance") {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }
    
    console.error("Recharge processing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
