import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "./startup-validation"; // This will run environment validation at startup

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    trustedOrigins: [
        "http://localhost:3000",
        process.env.BETTER_AUTH_URL,
        // Flutter / Expo clients (flutter_better_auth)
        "flutter://",
        "exp://",
    ].filter((origin): origin is string => Boolean(origin)),
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "RETAILER",
            },
            balance: {
                type: "number",
                defaultValue: 0,
            },
            isSuspended: {
                type: "boolean",
                defaultValue: false,
            },
            isApproved: {
                type: "boolean",
                defaultValue: false,
            },
            isRejected: {
                type: "boolean",
                defaultValue: false,
            },
            whatsappNumber: { type: "string", required: false },
            address: { type: "string", required: false },
            pincode: { type: "string", required: false },
            state: { type: "string", required: false },
            aadharNumber: { type: "string", required: false },
            panNumber: { type: "string", required: false },
            gstNumber: { type: "string", required: false },
            businessType: { type: "string", required: false },
            distributorId: {
                type: "string",
                required: false,
            }
        }
    },
    emailAndPassword: {
        enabled: true,
    },
});