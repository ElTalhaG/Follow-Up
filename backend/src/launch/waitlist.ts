import { prisma } from "../database/prisma.js";
import { AuthError } from "../auth/service.js";
import { trackLaunchEvent } from "./metrics.js";

type CreateWaitlistEntryInput = {
  email: string;
  fullName?: string;
  segment?: string;
  notes?: string;
  source?: string;
};

function serializeWaitlistEntry(entry: {
  id: string;
  email: string;
  fullName: string | null;
  segment: string | null;
  notes: string | null;
  source: string;
  createdAt: Date;
}) {
  return {
    id: entry.id,
    email: entry.email,
    fullName: entry.fullName,
    segment: entry.segment,
    notes: entry.notes,
    source: entry.source,
    createdAt: entry.createdAt.toISOString(),
  };
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function createWaitlistEntry(input: CreateWaitlistEntryInput) {
  const email = normalizeEmail(input.email);
  const fullName = input.fullName?.trim() || null;
  const segment = input.segment?.trim() || null;
  const notes = input.notes?.trim() || null;
  const source = input.source?.trim() || "landing-page";

  if (!validateEmail(email)) {
    throw new AuthError("Enter a valid email address.", 400);
  }

  const existing = await prisma.waitlistEntry.findUnique({
    where: { email },
  });

  if (existing) {
    return {
      entry: serializeWaitlistEntry(existing),
      alreadyJoined: true,
    };
  }

  const entry = await prisma.waitlistEntry.create({
    data: {
      email,
      fullName,
      segment,
      notes,
      source,
    },
  });

  await trackLaunchEvent({
    eventType: "waitlist_joined",
    email: entry.email,
    source,
  });

  return {
    entry: serializeWaitlistEntry(entry),
    alreadyJoined: false,
  };
}

export async function listWaitlistEntries(limit = 10) {
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 10, 1), 50);
  const items = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: safeLimit,
  });

  return items.map(serializeWaitlistEntry);
}
