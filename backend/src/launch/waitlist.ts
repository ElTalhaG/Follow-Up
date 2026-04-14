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

type UpdateWaitlistEntryInput = {
  status?: string;
  notes?: string;
};

const ALLOWED_WAITLIST_STATUSES = [
  "NEW",
  "CONTACTED",
  "CALL_SCHEDULED",
  "ACTIVE_TRIAL",
  "PAID",
  "BAD_FIT",
] as const;

function serializeWaitlistEntry(entry: {
  id: string;
  email: string;
  fullName: string | null;
  segment: string | null;
  notes: string | null;
  source: string;
  status?: string;
  lastContactedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
}) {
  return {
    id: entry.id,
    email: entry.email,
    fullName: entry.fullName,
    segment: entry.segment,
    notes: entry.notes,
    source: entry.source,
    status: entry.status ?? "NEW",
    lastContactedAt: entry.lastContactedAt?.toISOString() ?? null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt?.toISOString() ?? entry.createdAt.toISOString(),
  };
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function createWaitlistEntry(input: CreateWaitlistEntryInput) {
  const waitlistEntry = (prisma as unknown as { waitlistEntry: any }).waitlistEntry;
  const email = normalizeEmail(input.email);
  const fullName = input.fullName?.trim() || null;
  const segment = input.segment?.trim() || null;
  const notes = input.notes?.trim() || null;
  const source = input.source?.trim() || "landing-page";

  if (!validateEmail(email)) {
    throw new AuthError("Enter a valid email address.", 400);
  }

  const existing = await waitlistEntry.findUnique({
    where: { email },
  });

  if (existing) {
    return {
      entry: serializeWaitlistEntry(existing),
      alreadyJoined: true,
    };
  }

  const entry = await waitlistEntry.create({
    data: {
      email,
      fullName,
      segment,
      notes,
      source,
      status: "NEW",
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
  const waitlistEntry = (prisma as unknown as { waitlistEntry: any }).waitlistEntry;
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 10, 1), 50);
  const items = await waitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: safeLimit,
  });

  return (items as Array<any>).map(serializeWaitlistEntry);
}

export async function updateWaitlistEntry(entryId: string, input: UpdateWaitlistEntryInput) {
  const waitlistEntry = (prisma as unknown as { waitlistEntry: any }).waitlistEntry;
  const status = input.status?.trim().toUpperCase();
  const notes = input.notes?.trim();

  if (!status && notes === undefined) {
    throw new AuthError("Provide a status or notes update.", 400);
  }

  if (status && !ALLOWED_WAITLIST_STATUSES.includes(status as (typeof ALLOWED_WAITLIST_STATUSES)[number])) {
    throw new AuthError(
      "status must be NEW, CONTACTED, CALL_SCHEDULED, ACTIVE_TRIAL, PAID, or BAD_FIT.",
      400,
    );
  }

  const entry = await waitlistEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    throw new AuthError("Waitlist entry not found.", 404);
  }

  const updated = await waitlistEntry.update({
    where: { id: entryId },
    data: {
      status: status ?? entry.status,
      notes: notes === undefined ? entry.notes : notes || null,
      lastContactedAt:
        status && status !== "NEW" && status !== "BAD_FIT" ? new Date() : entry.lastContactedAt,
    },
  });

  if (status && status !== entry.status) {
    await trackLaunchEvent({
      eventType: "waitlist_status_updated",
      email: updated.email,
      source: `founder-queue:${status.toLowerCase()}`,
    });
  }

  return serializeWaitlistEntry(updated);
}
