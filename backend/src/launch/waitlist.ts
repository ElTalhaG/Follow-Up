import { prisma } from "../database/prisma.js";
import { AuthError } from "../auth/service.js";

type CreateWaitlistEntryInput = {
  email: string;
  fullName?: string;
  segment?: string;
  notes?: string;
  source?: string;
};

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
      entry: {
        id: existing.id,
        email: existing.email,
        fullName: existing.fullName,
        segment: existing.segment,
        notes: existing.notes,
        source: existing.source,
        createdAt: existing.createdAt.toISOString(),
      },
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

  return {
    entry: {
      id: entry.id,
      email: entry.email,
      fullName: entry.fullName,
      segment: entry.segment,
      notes: entry.notes,
      source: entry.source,
      createdAt: entry.createdAt.toISOString(),
    },
    alreadyJoined: false,
  };
}
