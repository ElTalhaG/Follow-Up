import { execFileSync } from "node:child_process";

const shouldRunRelease = process.env.RUN_RELEASE_ON_BOOT === "true";

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
