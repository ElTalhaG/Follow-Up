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
