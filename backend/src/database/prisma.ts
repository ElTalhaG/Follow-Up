import { PrismaClient } from "@prisma/client";

declare global {
  // Reuse the client during local hot reload.
  var __followupPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__followupPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__followupPrisma__ = prisma;
}

export async function getDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      ok: true,
      provider: process.env.DATABASE_URL?.startsWith("postgres") ? "postgresql" : "sqlite",
    };
  } catch (error) {
    return {
      ok: false,
      provider: process.env.DATABASE_URL?.startsWith("postgres") ? "postgresql" : "sqlite",
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}
