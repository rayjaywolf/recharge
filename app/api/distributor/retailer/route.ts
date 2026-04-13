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

    const distributorUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (distributorUser?.role !== "DISTRIBUTOR") {
      return NextResponse.json({ error: "Forbidden. Distributor access required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields (name, email, password) are required." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
       return NextResponse.json({ error: "Email is already in use by another user." }, { status: 400 });
    }

    // Call better-auth signUpEmail. By doing it server-side, it computes the hash and inserts the user.
    // We intentionally don't forward the resulting Set-Cookie headers back to the browser
    // to preserve the distributor's active session.
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        role: "RETAILER",
        distributorId: session.user.id,
      } as any // Use 'as any' to allow passing custom fields injected to additionalFields
    });

    return NextResponse.json({
      success: true,
      message: "Retailer created and assigned successfully."
    });

  } catch (error: any) {
    console.error("Create Retailer Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
