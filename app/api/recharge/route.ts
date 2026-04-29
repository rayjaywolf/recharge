import { NextResponse } from "next/server";
import { auth, prisma } from "@/lib/auth";
import { headers } from "next/headers";

function getOperatorCode(opName: string): string {
  const normalized = opName.toLowerCase();
  
  if (normalized === "airtel") return "A";
  if (normalized === "vodafone") return "V";
  if (normalized === "vi") return "V";
  if (normalized === "bsnl topup") return "BT";
  if (normalized === "reliance - jio") return "RC";
  if (normalized === "jio") return "RC";
  if (normalized === "idea") return "I";
  if (normalized === "bsnl - stv") return "BR";
  if (normalized === "bsnl recharge") return "BR";
  
  return opName;
}

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

    let isSuccess = false;
    let isPending = false;
    let apiMessage = "Unknown error";
    let apiReferenceId = "";

    try {
      const apiUrl = new URL("https://business.a1topup.com/recharge/api");
      apiUrl.searchParams.append("username", process.env.A1TOPUP_USERNAME || "");
      apiUrl.searchParams.append("pwd", process.env.A1TOPUP_PASSWORD || "");
      apiUrl.searchParams.append("number", phone);
      apiUrl.searchParams.append("operatorcode", getOperatorCode(operator));
      apiUrl.searchParams.append("amount", amount.toString());
      apiUrl.searchParams.append("orderid", result.transaction.id);
      apiUrl.searchParams.append("format", "json");

      const response = await fetch(apiUrl.toString(), { method: "GET" });
      const textResponse = await response.text();
      let apiResponse;
      try {
        apiResponse = JSON.parse(textResponse);
      } catch (e) {
        apiResponse = { status: "error", message: textResponse };
      }
      
      const statusStr = apiResponse.status ? apiResponse.status.toLowerCase() : "failed";
      
      if (statusStr === "success") {
        isSuccess = true;
        apiMessage = apiResponse.message || "Recharge successful";
        const opidPart = apiResponse.opid ? ` [OPID: ${apiResponse.opid}]` : "";
        apiReferenceId = (apiResponse.transaction_id || apiResponse.txid || `API-${Date.now()}`) + opidPart;
      } else if (statusStr === "pending") {
        isSuccess = false;
        isPending = true;
        apiMessage = apiResponse.message || "Recharge is pending with operator";
        const opidPart = apiResponse.opid ? ` [OPID: ${apiResponse.opid}]` : "";
        apiReferenceId = (apiResponse.transaction_id || apiResponse.txid || "") + opidPart;
      } else {
        isSuccess = false;
        apiMessage = apiResponse.message || "Recharge failed at provider";
        apiReferenceId = apiResponse.transaction_id || apiResponse.txid || "";
      }
    } catch (apiError) {
       console.error("A1Topup API Error:", apiError);
       isSuccess = false;
       isPending = true; 
       apiMessage = "Provider API timeout. Status unknown.";
    }

    const rule = await prisma.commissionRule.findUnique({ where: { operator } });
    const rMargin = rule ? rule.retailerMargin : 0;
    const dMargin = rule ? rule.distributorMargin : 0;
    const aMargin = rule ? rule.adminMargin : 0;

    const rCommission = (amount * rMargin) / 100;
    const dCommission = (amount * dMargin) / 100;
    const aCommission = (amount * aMargin) / 100;

    if (isPending) {
      const updatedTransaction = await prisma.transaction.update({
        where: { id: result.transaction.id },
        data: {
          status: "PENDING",
          apiMessage: apiMessage,
          ...(apiReferenceId ? { apiReferenceId } : {})
        }
      });
      return NextResponse.json({ 
        success: true, 
        message: "Recharge submitted and is currently pending",
        transaction: updatedTransaction 
      });
    }

    if (!isSuccess) {
      const updatedTransaction = await prisma.$transaction(async (tx) => {
        const t = await tx.transaction.update({
          where: { id: result.transaction.id },
          data: {
            status: "REFUNDED",
            apiMessage: apiMessage,
            ...(apiReferenceId ? { apiReferenceId } : {})
          }
        });
        await tx.user.update({
           where: { id: session.user.id },
           data: { balance: { increment: amount } }
        });
        return t;
      });
      
      return NextResponse.json({ 
        error: apiMessage,
        transaction: updatedTransaction 
      }, { status: 400 });
    }

    const adminUser = aCommission > 0 ? await prisma.user.findFirst({ where: { role: "ADMIN" } }) : null;

    const updatedTransaction = await prisma.$transaction(async (tx) => {
      const t = await tx.transaction.update({
        where: { id: result.transaction.id },
        data: {
          status: "SUCCESS",
          apiMessage: apiMessage,
          apiReferenceId: apiReferenceId,
          retailerCommission: rCommission,
          distributorCommission: dCommission,
          adminCommission: aCommission
        }
      });

      if (rCommission > 0) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { earnings: { increment: rCommission } }
        });
      }

      if (dCommission > 0 && result.distributorId) {
        await tx.user.update({
          where: { id: result.distributorId },
          data: { earnings: { increment: dCommission } }
        });
      }

      if (aCommission > 0 && adminUser) {
        await tx.user.update({
          where: { id: adminUser.id },
          data: { earnings: { increment: aCommission } }
        });
      }

      return t;
    });

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
