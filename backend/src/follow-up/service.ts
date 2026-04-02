import { prisma } from "../database/prisma.js";
import { AuthError } from "../auth/service.js";

type FollowUpListItem = {
  id: string;
  conversationId: string;
  subject: string;
  contactName: string | null;
  contactEmail: string;
  status: "new" | "waiting" | "overdue" | "closed";
  priority: "high" | "medium" | "low";
  followUpReason: string;
  suggestedDraft: string;
  actionStatus: "open" | "done" | "ignored" | "snoozed";
  remindAt: string | null;
  lastMessageAt: string;
};

type FollowUpAction = "OPEN" | "DONE" | "IGNORED" | "SNOOZED";

type ConversationRecord = {
  id: string;
  subject: string;
  contactName: string | null;
  contactEmail: string;
  status: "NEW" | "WAITING" | "OVERDUE" | "CLOSED";
  lastMessageAt: Date;
  lastInboundAt: Date | null;
  lastOutboundAt: Date | null;
  needsFollowUp: boolean;
  followUpReason: string | null;
  account: {
    userId: string;
    emailAddress: string | null;
  };
  messages: Array<{
    id: string;
    bodyExcerpt: string;
    senderEmail: string;
    sentAt: Date;
    direction: "INBOUND" | "OUTBOUND";
  }>;
  followUps: Array<{
    id: string;
    status: FollowUpAction;
    reason: string;
    priority: string;
    suggestedAt: Date;
    completedAt: Date | null;
    drafts?: Array<{
      id: string;
      tone: string;
      content: string;
      createdAt: Date;
    }>;
  }>;
  reminders: Array<{
    id: string;
    remindAt: Date;
    status: "ACTIVE" | "DISMISSED" | "SENT";
  }>;
};

type DetectionResult = {
  needsFollowUp: boolean;
  reason: string | null;
  priority: "high" | "medium" | "low";
};

function hoursBetween(earlier: Date, later = new Date()) {
  return (later.getTime() - earlier.getTime()) / (1000 * 60 * 60);
}

function normalizeStatus(status: ConversationRecord["status"]) {
  return status.toLowerCase() as FollowUpListItem["status"];
}

function toActionStatus(status: FollowUpAction) {
  return status.toLowerCase() as FollowUpListItem["actionStatus"];
}

function buildSuggestedDraft(conversation: ConversationRecord) {
  const greeting = conversation.contactName
    ? `Hi ${conversation.contactName.split(" ")[0]},`
    : "Hi there,";

  if (conversation.lastInboundAt && (!conversation.lastOutboundAt || conversation.lastInboundAt > conversation.lastOutboundAt)) {
    return `${greeting} just following up in case my reply slipped through. I'd be happy to help with "${conversation.subject}" and can send a clear next step today.`;
  }

  return `${greeting} checking back in on "${conversation.subject}". If the timing still works on your side, I can keep things moving with a simple next step.`;
}

function detectFollowUpNeed(conversation: ConversationRecord): DetectionResult {
  if (conversation.status === "CLOSED") {
    return {
      needsFollowUp: false,
      reason: null,
      priority: "low",
    };
  }

  const latestMessage = conversation.messages[conversation.messages.length - 1];
  const latestSnippet = latestMessage?.bodyExcerpt ?? "";
  const hasQuestion = latestSnippet.includes("?");

  if (
    conversation.lastInboundAt &&
    (!conversation.lastOutboundAt || conversation.lastInboundAt > conversation.lastOutboundAt)
  ) {
    const hoursSinceInbound = hoursBetween(conversation.lastInboundAt);

    if (hoursSinceInbound >= 24) {
      return {
        needsFollowUp: true,
        reason: `Inbound lead has not received a reply in ${Math.floor(hoursSinceInbound)} hours.`,
        priority: hoursSinceInbound >= 72 ? "high" : "medium",
      };
    }

    if (hasQuestion) {
      return {
        needsFollowUp: true,
        reason: "Latest inbound message contains a question that has not been answered yet.",
        priority: "high",
      };
    }
  }

  if (conversation.lastOutboundAt) {
    const daysSinceOutbound = hoursBetween(conversation.lastOutboundAt) / 24;

    if (daysSinceOutbound >= 5) {
      return {
        needsFollowUp: true,
        reason: `Warm conversation has been inactive for ${Math.floor(daysSinceOutbound)} days after your last reply.`,
        priority: daysSinceOutbound >= 10 ? "high" : "medium",
      };
    }
  }

  return {
    needsFollowUp: false,
    reason: null,
    priority: "low",
  };
}

async function getUserConversations(userId: string) {
  const conversationDelegate = prisma.conversation as any;

  return (await conversationDelegate.findMany({
    where: {
      account: {
        userId,
      },
    },
    include: {
      account: {
        select: {
          userId: true,
          emailAddress: true,
        },
      },
      messages: {
        orderBy: {
          sentAt: "asc",
        },
      },
      followUps: {
        orderBy: [{ suggestedAt: "desc" }, { id: "desc" }],
        include: {
          drafts: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          },
        },
      },
      reminders: {
        where: {
          status: "ACTIVE",
        },
        orderBy: {
          remindAt: "asc",
        },
      },
    },
    orderBy: {
      lastMessageAt: "desc",
    },
  })) as ConversationRecord[];
}

export async function refreshFollowUps(userId: string) {
  const conversations = await getUserConversations(userId);
  const followUpDelegate = prisma.followUp as any;
  const conversationDelegate = prisma.conversation as any;
  const reminderDelegate = prisma.reminder as any;

  for (const conversation of conversations) {
    const detection = detectFollowUpNeed(conversation);
    const latestFollowUp = conversation.followUps[0];

    await conversationDelegate.update({
      where: { id: conversation.id },
      data: {
        needsFollowUp: detection.needsFollowUp,
        followUpReason: detection.reason,
        status: detection.needsFollowUp
          ? detection.priority === "high"
            ? "OVERDUE"
            : "WAITING"
          : conversation.status,
      },
    });

    if (!detection.needsFollowUp) {
      if (latestFollowUp && latestFollowUp.status === "OPEN") {
        await followUpDelegate.update({
          where: { id: latestFollowUp.id },
          data: {
            status: "DONE",
            completedAt: new Date(),
          },
        });
      }

      continue;
    }

    const shouldCreateNewFollowUp =
      !latestFollowUp ||
      latestFollowUp.status === "DONE" ||
      latestFollowUp.status === "IGNORED";

    if (shouldCreateNewFollowUp) {
      await followUpDelegate.create({
        data: {
          conversationId: conversation.id,
          status: "OPEN",
          reason: detection.reason,
          priority: detection.priority,
        },
      });
    } else {
      await followUpDelegate.update({
        where: { id: latestFollowUp.id },
        data: {
          reason: detection.reason,
          priority: detection.priority,
        },
      });
    }

    const activeReminder = conversation.reminders[0];

    if (!activeReminder) {
      const remindAt = new Date();
      remindAt.setHours(remindAt.getHours() + 4);

      await reminderDelegate.create({
        data: {
          conversationId: conversation.id,
          remindAt,
          status: "ACTIVE",
        },
      });
    }
  }

  return listFollowUps(userId);
}

export async function listFollowUps(userId: string) {
  const conversations = await getUserConversations(userId);

  return conversations
    .filter((conversation) => conversation.followUps.length > 0)
    .map((conversation) => {
      const latestFollowUp = conversation.followUps[0];
      const activeReminder = conversation.reminders[0];

      return {
        id: latestFollowUp.id,
        conversationId: conversation.id,
        subject: conversation.subject,
        contactName: conversation.contactName,
        contactEmail: conversation.contactEmail,
        status: normalizeStatus(conversation.status),
        priority: latestFollowUp.priority as FollowUpListItem["priority"],
        followUpReason: latestFollowUp.reason,
        suggestedDraft:
          latestFollowUp.drafts?.[0]?.content ?? buildSuggestedDraft(conversation),
        actionStatus: toActionStatus(latestFollowUp.status),
        remindAt: activeReminder?.remindAt.toISOString() ?? null,
        lastMessageAt: conversation.lastMessageAt.toISOString(),
      } satisfies FollowUpListItem;
    })
    .sort((left, right) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (
        priorityOrder[left.priority] - priorityOrder[right.priority] ||
        right.lastMessageAt.localeCompare(left.lastMessageAt)
      );
    });
}

export async function updateFollowUpStatus(
  userId: string,
  followUpId: string,
  status: FollowUpAction,
  remindAt?: string,
) {
  const followUpDelegate = prisma.followUp as any;
  const reminderDelegate = prisma.reminder as any;

  const followUp = await followUpDelegate.findUnique({
    where: { id: followUpId },
    include: {
      conversation: {
        include: {
          account: true,
        },
      },
    },
  });

  if (!followUp || followUp.conversation.account.userId !== userId) {
    throw new AuthError("Follow-up not found.", 404);
  }

  await followUpDelegate.update({
    where: { id: followUpId },
    data: {
      status,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });

  if (status === "SNOOZED") {
    if (!remindAt) {
      throw new AuthError("remindAt is required when snoozing a follow-up.", 400);
    }

    await reminderDelegate.create({
      data: {
        conversationId: followUp.conversationId,
        remindAt: new Date(remindAt),
        status: "ACTIVE",
      },
    });
  }

  return listFollowUps(userId);
}
