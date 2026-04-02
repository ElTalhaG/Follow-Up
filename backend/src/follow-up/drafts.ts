import { prisma } from "../database/prisma.js";
import { AuthError } from "../auth/service.js";

type DraftTone = "friendly" | "professional" | "direct";

type FollowUpWithContext = {
  id: string;
  reason: string;
  conversation: {
    id: string;
    subject: string;
    contactName: string | null;
    contactEmail: string;
    account: {
      userId: string;
    };
    messages: Array<{
      bodyExcerpt: string;
      direction: "INBOUND" | "OUTBOUND";
      sentAt: Date;
    }>;
  };
  drafts: Array<{
    id: string;
    tone: string;
    content: string;
    createdAt: Date;
  }>;
};

function isDraftTone(value: string): value is DraftTone {
  return ["friendly", "professional", "direct"].includes(value);
}

function getGreeting(contactName: string | null) {
  return contactName ? `Hi ${contactName.split(" ")[0]},` : "Hi there,";
}

function getClosing(tone: DraftTone) {
  if (tone === "friendly") {
    return "Best,";
  }

  if (tone === "direct") {
    return "Thanks,";
  }

  return "Kind regards,";
}

function getToneSentence(tone: DraftTone, subject: string) {
  if (tone === "friendly") {
    return `just checking in on "${subject}" in case my last note got buried.`;
  }

  if (tone === "direct") {
    return `following up on "${subject}" so we can decide the next step.`;
  }

  return `following up regarding "${subject}" in case my previous message was missed.`;
}

function getContextSentence(tone: DraftTone, reason: string) {
  if (reason.toLowerCase().includes("question")) {
    return tone === "direct"
      ? "I wanted to make sure your question gets a clear answer quickly."
      : "I wanted to make sure your question gets answered clearly.";
  }

  if (reason.toLowerCase().includes("inactive")) {
    return tone === "friendly"
      ? "If the timing is still right on your side, I’d be happy to keep this moving."
      : "If the timing still works on your side, I can keep this moving with a simple next step.";
  }

  return tone === "direct"
    ? "If you’re still interested, I can send the next step today."
    : "If it’s still helpful, I can send over the clearest next step today.";
}

function buildDraftContent(
  tone: DraftTone,
  contactName: string | null,
  subject: string,
  reason: string,
) {
  const greeting = getGreeting(contactName);
  const intro = getToneSentence(tone, subject);
  const context = getContextSentence(tone, reason);
  const closing = getClosing(tone);

  return `${greeting}\n\n${intro} ${context}\n\n${closing}`;
}

async function getFollowUpForUser(userId: string, followUpId: string) {
  const followUpDelegate = prisma.followUp as any;

  const followUp = (await followUpDelegate.findUnique({
    where: { id: followUpId },
    include: {
      conversation: {
        include: {
          account: {
            select: {
              userId: true,
            },
          },
          messages: {
            orderBy: {
              sentAt: "asc",
            },
          },
        },
      },
      drafts: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      },
    },
  })) as FollowUpWithContext | null;

  if (!followUp || followUp.conversation.account.userId !== userId) {
    throw new AuthError("Follow-up not found.", 404);
  }

  return followUp;
}

export async function generateDraft(userId: string, followUpId: string, tone: string) {
  if (!isDraftTone(tone)) {
    throw new AuthError("tone must be friendly, professional, or direct.", 400);
  }

  const followUp = await getFollowUpForUser(userId, followUpId);
  const content = buildDraftContent(
    tone,
    followUp.conversation.contactName,
    followUp.conversation.subject,
    followUp.reason,
  );

  const draftDelegate = (prisma as any).draft;
  const draft = await draftDelegate.create({
    data: {
      followUpId: followUp.id,
      tone,
      content,
    },
  });

  return {
    id: draft.id,
    followUpId: followUp.id,
    tone,
    content,
    createdAt: draft.createdAt.toISOString(),
  };
}

export async function listDraftHistory(userId: string, followUpId: string) {
  const followUp = await getFollowUpForUser(userId, followUpId);

  return [...followUp.drafts]
    .sort(
      (left, right) =>
        right.createdAt.getTime() - left.createdAt.getTime() || right.id.localeCompare(left.id),
    )
    .map((draft) => ({
      id: draft.id,
      followUpId,
      tone: draft.tone,
      content: draft.content,
      createdAt: draft.createdAt.toISOString(),
    }));
}

export async function updateDraftContent(
  userId: string,
  draftId: string,
  content: string,
) {
  const draftDelegate = (prisma as any).draft;
  const draft = await draftDelegate.findUnique({
    where: { id: draftId },
    include: {
      followUp: {
        include: {
          conversation: {
            include: {
              account: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!draft || draft.followUp.conversation.account.userId !== userId) {
    throw new AuthError("Draft not found.", 404);
  }

  if (!content.trim()) {
    throw new AuthError("Draft content cannot be empty.", 400);
  }

  const updatedDraft = await draftDelegate.update({
    where: { id: draftId },
    data: {
      content: content.trim(),
    },
  });

  return {
    id: updatedDraft.id,
    followUpId: updatedDraft.followUpId,
    tone: updatedDraft.tone,
    content: updatedDraft.content,
    createdAt: updatedDraft.createdAt.toISOString(),
  };
}
