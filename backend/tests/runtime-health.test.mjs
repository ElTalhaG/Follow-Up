import test from "node:test";
import assert from "node:assert/strict";
import { getDatabaseHealth } from "../dist/database/prisma.js";

test("database health check reports ok for the active local database", async () => {
  const health = await getDatabaseHealth();

  assert.equal(health.ok, true);
  assert.ok(["sqlite", "postgresql"].includes(health.provider));
});
