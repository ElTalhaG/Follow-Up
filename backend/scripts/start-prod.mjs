import { execFileSync } from "node:child_process";
import { normalizeDatabaseUrl } from "./database-url.mjs";

const shouldRunRelease = process.env.RUN_RELEASE_ON_BOOT === "true";

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = normalizeDatabaseUrl(process.env.DATABASE_URL);
}

try {
  if (shouldRunRelease) {
    execFileSync("node", ["scripts/release-prod.mjs"], {
      stdio: "inherit",
      cwd: new URL("..", import.meta.url),
      env: process.env,
    });
  }

  execFileSync("node", ["dist/server.js"], {
    stdio: "inherit",
    cwd: new URL("..", import.meta.url),
    env: process.env,
  });
} catch (error) {
  console.error("Backend startup failed.");
  process.exit(error instanceof Error && "status" in error && typeof error.status === "number" ? error.status : 1);
}
