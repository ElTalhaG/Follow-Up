import test from "node:test";
import assert from "node:assert/strict";
import {
  createWaitlistEntry,
  listWaitlistEntries,
  updateWaitlistEntry,
} from "../dist/launch/waitlist.js";
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

  const waitlistEvents = await prisma.launchEvent.count({
    where: { eventType: "waitlist_joined", email: "launch@example.com" },
  });

  assert.equal(waitlistEvents, 1);
});

test("waitlist entries can be listed for founder queue review", async () => {
  await prisma.waitlistEntry.deleteMany({
    where: {
      email: {
        in: ["queue-a@example.com", "queue-b@example.com"],
      },
    },
  });

  await createWaitlistEntry({
    email: "queue-a@example.com",
    fullName: "Queue A",
    segment: "freelancer",
    source: "manual-outreach",
  });
  await createWaitlistEntry({
    email: "queue-b@example.com",
    fullName: "Queue B",
    segment: "agency",
    source: "manual-outreach",
  });

  const items = await listWaitlistEntries(5);

  assert.ok(items.some((item) => item.email === "queue-a@example.com"));
  assert.ok(items.some((item) => item.email === "queue-b@example.com"));
});

test("waitlist entries can move through founder queue statuses", async () => {
  await prisma.waitlistEntry.deleteMany({
    where: { email: "queue-status@example.com" },
  });

  const created = await createWaitlistEntry({
    email: "queue-status@example.com",
    fullName: "Queue Status",
    segment: "consultant",
    source: "manual-outreach",
  });

  const updated = await updateWaitlistEntry(created.entry.id, {
    status: "CONTACTED",
    notes: "Sent the first founder outreach message.",
  });

  assert.equal(updated.status, "CONTACTED");
  assert.equal(updated.notes, "Sent the first founder outreach message.");
  assert.ok(updated.lastContactedAt);
});
