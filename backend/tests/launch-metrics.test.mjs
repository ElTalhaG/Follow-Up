import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { getLaunchMetrics, trackLaunchEvent } from "../dist/launch/metrics.js";

const prisma = new PrismaClient();

test("launch metrics summarize signup, waitlist, and checkout activity", async () => {
  await prisma.launchEvent.deleteMany({
    where: {
      source: "launch-metrics-test",
    },
  });

  await trackLaunchEvent({
    eventType: "signup_completed",
    email: "metric-signup@example.com",
    source: "launch-metrics-test",
  });
  await trackLaunchEvent({
    eventType: "waitlist_joined",
    email: "metric-waitlist@example.com",
    source: "launch-metrics-test",
  });
  await trackLaunchEvent({
    eventType: "checkout_clicked",
    planId: "solo",
    source: "launch-metrics-test",
  });
  await trackLaunchEvent({
    eventType: "waitlist_invite_sent",
    email: "metric-invite@example.com",
    source: "launch-metrics-test",
  });
  await trackLaunchEvent({
    eventType: "waitlist_call_booked",
    email: "metric-call@example.com",
    source: "launch-metrics-test",
  });

  const metrics = await getLaunchMetrics();

  assert.ok(metrics.totals.signups >= 1);
  assert.ok(metrics.totals.waitlistJoins >= 1);
  assert.ok(metrics.totals.checkoutClicks >= 1);
  assert.ok(metrics.totals.invitesSent >= 1);
  assert.ok(metrics.totals.callsBooked >= 1);
  assert.ok(metrics.recentEvents.length >= 1);
});
