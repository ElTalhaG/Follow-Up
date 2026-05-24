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
  const provider = process.env.DATABASE_URL?.startsWith("postgres") ? "postgresql" : "sqlite";

  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.user.count();

    return {
      ok: true,
      provider,
      connection: true,
      schema: true,
    };
  } catch (error) {
    return {
      ok: false,
      provider,
      connection: true,
      schema: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}
