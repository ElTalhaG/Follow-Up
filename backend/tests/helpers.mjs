import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testsDir = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(testsDir, "..");

process.env.AUTH_SECRET = "test-auth-secret";
process.env.GMAIL_MOCK_MODE = "true";
process.env.GMAIL_CLIENT_ID = "test-gmail-client";
process.env.GMAIL_CLIENT_SECRET = "test-gmail-secret";
process.env.DATABASE_URL = `file:${resolve(backendDir, "dev.db")}`;
process.env.NODE_ENV = "test";

export function resetDatabase() {
  execFileSync("node", ["scripts/init-db.mjs", "--reset"], {
    cwd: backendDir,
    env: process.env,
    stdio: "ignore",
  });
}

export async function loadBackendModules() {
  const load = async (relativePath) =>
    import(`${pathToFileURL(resolve(backendDir, "dist", relativePath)).href}?t=${Date.now()}`);

  const [{ prisma }, auth, gmail, followUps, drafts, reminders] = await Promise.all([
    load("database/prisma.js"),
    load("auth/service.js"),
    load("integrations/gmail.js"),
    load("follow-up/service.js"),
    load("follow-up/drafts.js"),
    load("follow-up/reminders.js"),
  ]);

  return {
    prisma,
    ...auth,
    ...gmail,
    ...followUps,
    ...drafts,
    ...reminders,
  };
}
