import { execFileSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error("Set DATABASE_URL before running the production release flow.");
  process.exit(1);
}

if (!databaseUrl.startsWith("postgres://") && !databaseUrl.startsWith("postgresql://")) {
  console.error("DATABASE_URL must point to a PostgreSQL database for the production release flow.");
  process.exit(1);
}

function run(command, args) {
  execFileSync(command, args, {
    stdio: "inherit",
    cwd: new URL("..", import.meta.url),
    env: process.env,
  });
}

if (process.env.FORCE_PRISMA_GENERATE_ON_RELEASE === "true") {
  console.log("Generating Prisma client for production release...");
  run("npx", ["prisma", "generate", "--schema", "prisma/schema.postgres.prisma"]);
}

console.log("Pushing PostgreSQL schema...");
run("npx", ["prisma", "db", "push", "--schema", "prisma/schema.postgres.prisma"]);

if (process.env.SEED_PROD_DATA === "true") {
  console.log("Seeding production data...");
  run("node", ["prisma/seed.mjs"]);
}

console.log("Production release flow completed.");
