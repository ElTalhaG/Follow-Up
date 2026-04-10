import test from "node:test";
import assert from "node:assert/strict";
import { createWaitlistEntry } from "../dist/launch/waitlist.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test("waitlist entries can be created and deduplicated by email", async () => {
  await prisma.waitlistEntry.deleteMany({
    where: { email: "launch@example.com" },
  });

  const first = await createWaitlistEntry({
    email: "launch@example.com",
    fullName: "Launch Prospect",
    segment: "agency",
    notes: "Wants the first beta invite.",
    source: "landing-page",
  });

  assert.equal(first.alreadyJoined, false);
  assert.equal(first.entry.email, "launch@example.com");

  const second = await createWaitlistEntry({
    email: "launch@example.com",
    fullName: "Launch Prospect",
  });

  assert.equal(second.alreadyJoined, true);
  assert.equal(second.entry.email, "launch@example.com");
});
