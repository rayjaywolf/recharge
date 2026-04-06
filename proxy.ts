import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // We only want to protect dashboard routes
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/retailer")) {
    return NextResponse.next();
  }

  // Fetch the session using betterFetch to avoid Prisma client edge issues
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }
  );

  // If no session is found, redirect unauthenticated users to login
  if (!session || !session.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = session.user.role as string;

  // Check roles
  if (role === "RETAILER" && pathname.startsWith("/admin")) {
    // Retailer shouldn't access admin
    return NextResponse.redirect(new URL("/retailer", request.url));
  }

  if (role === "ADMIN" && pathname.startsWith("/retailer")) {
    // Optional: Admin shouldn't access retailer 
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/retailer/:path*"],
};
