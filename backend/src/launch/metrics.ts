import { prisma } from "../database/prisma.js";

type TrackLaunchEventInput = {
  eventType: string;
  email?: string | null;
  userId?: string | null;
  planId?: string | null;
  source?: string | null;
};

function normalizeEmail(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

export async function trackLaunchEvent(input: TrackLaunchEventInput) {
  const eventType = input.eventType.trim();

  if (!eventType) {
    return null;
  }

  const launchEvent = (prisma as unknown as { launchEvent: any }).launchEvent;

  return launchEvent.create({
    data: {
      eventType,
      email: normalizeEmail(input.email),
      userId: input.userId?.trim() || null,
      planId: input.planId?.trim() || null,
      source: input.source?.trim() || "app",
    },
  });
}

export async function getLaunchMetrics() {
  const launchEvent = (prisma as unknown as { launchEvent: any }).launchEvent;
  const [signups, waitlistJoins, checkoutClicks, invitesSent, callsBooked, recentEvents] =
    await Promise.all([
      launchEvent.count({ where: { eventType: "signup_completed" } }),
      launchEvent.count({ where: { eventType: "waitlist_joined" } }),
      launchEvent.count({ where: { eventType: "checkout_clicked" } }),
      launchEvent.count({ where: { eventType: "waitlist_invite_sent" } }),
      launchEvent.count({ where: { eventType: "waitlist_call_booked" } }),
      launchEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  return {
    totals: {
      signups,
      waitlistJoins,
      checkoutClicks,
      invitesSent,
      callsBooked,
    },
    recentEvents: (recentEvents as Array<any>).map((event) => ({
      id: event.id,
      eventType: event.eventType,
      email: event.email,
      userId: event.userId,
      planId: event.planId,
      source: event.source,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}
