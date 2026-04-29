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
    const { phone, operator, amount, idempotencyKey } = body;

    if (!phone || !operator || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (idempotencyKey) {
      const existing = await prisma.transaction.findUnique({ where: { idempotencyKey } });
      if (existing) {
         return NextResponse.json({ error: "Duplicate action detected. Request is already processing." }, { status: 409 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
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

      await tx.user.update({
        where: { id: user.id, balance: { gte: amount } },
        data: { balance: { decrement: amount } }
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          targetPhone: phone,
          operator: operator,
          amount: amount,
          status: "PENDING",
          idempotencyKey: idempotencyKey || undefined
        }
      });

      return { transaction, distributorId: user.distributorId };
    });

    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const isSuccess = Math.random() > 0.1; 

    const rule = await prisma.commissionRule.findUnique({ where: { operator } });
    const rMargin = rule ? rule.retailerMargin : 0;
    const dMargin = rule ? rule.distributorMargin : 0;
    const aMargin = rule ? rule.adminMargin : 0;

    const rCommission = (amount * rMargin) / 100;
    const dCommission = (amount * dMargin) / 100;
    const aCommission = (amount * aMargin) / 100;

    const updatedTransaction = await prisma.transaction.update({
      where: { id: result.transaction.id },
      data: {
        status: isSuccess ? "SUCCESS" : "FAILED",
        apiMessage: isSuccess ? "Mock provider: Recharge successful" : "Mock provider: Gateway error",
        apiReferenceId: `MOCK-${Date.now()}`,
        ...(isSuccess ? {
          retailerCommission: rCommission,
          distributorCommission: dCommission,
          adminCommission: aCommission
        } : {})
      }
    });

    if (!isSuccess) {
      await prisma.$transaction([
        prisma.user.update({
           where: { id: session.user.id },
           data: { balance: { increment: amount } }
        }),
        prisma.transaction.update({
           where: { id: result.transaction.id },
           data: { status: "REFUNDED" }
        })
      ]);
      
      return NextResponse.json({ 
        error: "Recharge failed at carrier gateway. Amount has been refunded.",
        transaction: updatedTransaction 
      }, { status: 400 });
    }

    // Process Commissions (Only reached if isSuccess is true)
    const queries = [];
    if (rCommission > 0) {
      queries.push(prisma.user.update({
        where: { id: session.user.id },
        data: { earnings: { increment: rCommission } }
      }));
    }
    if (dCommission > 0 && result.distributorId) {
      queries.push(prisma.user.update({
        where: { id: result.distributorId },
        data: { earnings: { increment: dCommission } }
      }));
    }
    if (aCommission > 0) {
      // Find the first ADMIN to credit
      const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (adminUser) {
        queries.push(prisma.user.update({
          where: { id: adminUser.id },
          data: { earnings: { increment: aCommission } }
        }));
      }
    }
    
    if (queries.length > 0) {
      await prisma.$transaction(queries);
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
