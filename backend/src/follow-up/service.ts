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

type AnalyticsSummary = {
  metrics: {
    followUpsSuggested: number;
    followUpsSent: number;
    remindersCompleted: number;
    averageReplyHours: number | null;
    responseTimeChange: "faster" | "slower" | "steady" | "new";
    responseTimeDeltaHours: number | null;
  };
  weeklySummary: string;
  activeLeads: Array<{
    conversationId: string;
    subject: string;
    contactName: string | null;
    contactEmail: string;
    status: "new" | "waiting" | "overdue" | "closed";
    messageCount: number;
    lastMessageAt: string;
  }>;
};

type ConversationListItem = {
  id: string;
  subject: string;
  contactName: string | null;
  contactEmail: string;
  notes: string | null;
  status: "new" | "waiting" | "overdue" | "closed";
  needsFollowUp: boolean;
  followUpReason: string | null;
  lastMessageAt: string;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  originalMessage: string;
  latestMessage: string;
  latestDirection: "inbound" | "outbound" | "unknown";
};

type FollowUpAction = "OPEN" | "DONE" | "IGNORED" | "SNOOZED";

type ConversationRecord = {
  id: string;
  subject: string;
  contactName: string | null;
  contactEmail: string;
  notes: string | null;
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
    createdAt: Date;
    updatedAt: Date;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    status: "OPEN" | "DONE" | "CANCELED";
    dueAt: Date | null;
    createdAt: Date;
  }>;
};

type DetectionResult = {
  needsFollowUp: boolean;
  reason: string | null;
  priority: "high" | "medium" | "low";
};

type DashboardSnapshot = {
  conversations: ConversationRecord[];
  followUps: FollowUpListItem[];
  analytics: AnalyticsSummary;
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

function toLatestDirection(
  direction: ConversationRecord["messages"][number]["direction"] | undefined,
) {
  if (direction === "INBOUND") {
    return "inbound" as const;
  }

  if (direction === "OUTBOUND") {
    return "outbound" as const;
  }

  return "unknown" as const;
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

function getLatestFollowUp(conversation: ConversationRecord) {
  return conversation.followUps[0];
}

function getActiveReminder(conversation: ConversationRecord) {
  return conversation.reminders.find((item) => item.status === "ACTIVE");
}

function serializeConversation(conversation: ConversationRecord) {
  const latestMessage = conversation.messages[conversation.messages.length - 1];

  return {
    id: conversation.id,
    subject: conversation.subject,
    contactName: conversation.contactName,
    contactEmail: conversation.contactEmail,
    notes: conversation.notes,
    status: normalizeStatus(conversation.status),
    needsFollowUp: conversation.needsFollowUp,
    followUpReason: conversation.followUpReason,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    lastInboundAt: conversation.lastInboundAt?.toISOString() ?? null,
    lastOutboundAt: conversation.lastOutboundAt?.toISOString() ?? null,
    originalMessage: conversation.messages[0]?.bodyExcerpt ?? "",
    latestMessage: latestMessage?.bodyExcerpt ?? "",
    latestDirection: toLatestDirection(latestMessage?.direction),
  } satisfies ConversationListItem;
}

function serializeFollowUp(conversation: ConversationRecord) {
  const latestFollowUp = getLatestFollowUp(conversation);

  if (!latestFollowUp) {
    return null;
  }

  const activeReminder = getActiveReminder(conversation);

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
}

function roundHours(value: number | null) {
  if (value === null) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

function getWeekWindow() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 7);

  return { start, end };
}

function getPreviousWeekWindow(currentStart: Date) {
  const end = new Date(currentStart);
  const start = new Date(currentStart);
  start.setDate(start.getDate() - 7);

  return { start, end };
}

function isWithinWindow(value: Date | null | undefined, start: Date, end: Date) {
  if (!value) {
    return false;
  }

  return value >= start && value <= end;
}

function getResponseDurationsForWindow(
  messages: ConversationRecord["messages"],
  start: Date,
  end: Date,
) {
  const durations: number[] = [];
  let pendingInboundAt: Date | null = null;

  for (const message of messages) {
    if (message.direction === "INBOUND") {
      pendingInboundAt = message.sentAt;
      continue;
    }

    if (message.direction === "OUTBOUND" && pendingInboundAt && isWithinWindow(message.sentAt, start, end)) {
      durations.push(hoursBetween(pendingInboundAt, message.sentAt));
      pendingInboundAt = null;
    }
  }

  return durations;
}

function average(numbers: number[]) {
  if (numbers.length === 0) {
    return null;
  }

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function buildWeeklySummary(metrics: AnalyticsSummary["metrics"]) {
  const replyTime =
    metrics.averageReplyHours === null
      ? "No reply-time data yet."
      : `Average reply time is ${metrics.averageReplyHours} hours.`;

  const trend =
    metrics.responseTimeChange === "new"
      ? "This is your first week with reply-time data."
      : metrics.responseTimeChange === "steady"
        ? "Reply speed is steady week over week."
        : `Reply speed is ${metrics.responseTimeChange} by ${metrics.responseTimeDeltaHours} hours week over week.`;

  return `This week you surfaced ${metrics.followUpsSuggested} follow-ups, marked ${metrics.followUpsSent} as sent, and completed ${metrics.remindersCompleted} reminders. ${replyTime} ${trend}`;
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
        orderBy: {
          remindAt: "asc",
        },
      },
      tasks: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      },
    },
    orderBy: {
      lastMessageAt: "desc",
    },
  })) as ConversationRecord[];
}

async function getDashboardSnapshot(userId: string) {
  const conversations = await getUserConversations(userId);

  return {
    conversations,
    followUps: conversations
      .map(serializeFollowUp)
      .filter((item): item is FollowUpListItem => Boolean(item))
      .sort((left, right) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (
          priorityOrder[left.priority] - priorityOrder[right.priority] ||
          right.lastMessageAt.localeCompare(left.lastMessageAt)
        );
      }),
    analytics: buildAnalyticsSummary(conversations),
  } satisfies DashboardSnapshot;
}

export async function refreshFollowUps(userId: string) {
  const conversations = await getUserConversations(userId);
  const followUpDelegate = prisma.followUp as any;
  const conversationDelegate = prisma.conversation as any;
  const reminderDelegate = prisma.reminder as any;
  const taskDelegate = prisma.task as any;

  for (const conversation of conversations) {
    const detection = detectFollowUpNeed(conversation);
    const latestFollowUp = getLatestFollowUp(conversation);

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

      const openTask = conversation.tasks?.find((task) => task.status === "OPEN");

      if (openTask) {
        await taskDelegate.update({
          where: { id: openTask.id },
          data: {
            status: "DONE",
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

    const activeReminder = getActiveReminder(conversation);
    const openTask = conversation.tasks?.find((task) => task.status === "OPEN");

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

    if (!openTask) {
      await taskDelegate.create({
        data: {
          conversationId: conversation.id,
          title: `Follow up on ${conversation.subject}`,
          status: "OPEN",
          dueAt: activeReminder?.remindAt ?? new Date(Date.now() + 4 * 60 * 60 * 1000),
        },
      });
    } else {
      await taskDelegate.update({
        where: { id: openTask.id },
        data: {
          title: `Follow up on ${conversation.subject}`,
          dueAt: activeReminder?.remindAt ?? openTask.dueAt,
        },
      });
    }
  }

  return listFollowUps(userId);
}

export async function listFollowUps(userId: string) {
  const snapshot = await getDashboardSnapshot(userId);
  return snapshot.followUps;
}

export async function listConversations(userId: string) {
  const snapshot = await getDashboardSnapshot(userId);
  return snapshot.conversations.map(serializeConversation);
}

export async function updateConversationNotes(
  userId: string,
  conversationId: string,
  notes: string,
) {
  const conversationDelegate = prisma.conversation as any;
  const conversation = await conversationDelegate.findUnique({
    where: { id: conversationId },
    include: {
      account: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!conversation || conversation.account.userId !== userId) {
    throw new AuthError("Conversation not found.", 404);
  }

  await conversationDelegate.update({
    where: { id: conversationId },
    data: {
      notes: notes.trim() || null,
    },
  });

  return listConversations(userId);
}

function buildAnalyticsSummary(conversations: ConversationRecord[]) {
  const { start: currentStart, end: currentEnd } = getWeekWindow();
  const { start: previousStart, end: previousEnd } = getPreviousWeekWindow(currentStart);

  const followUps = conversations.flatMap((conversation) => conversation.followUps);
  const reminders = conversations.flatMap((conversation) => conversation.reminders);
  const currentResponseDurations = conversations.flatMap((conversation) =>
    getResponseDurationsForWindow(conversation.messages, currentStart, currentEnd),
  );
  const previousResponseDurations = conversations.flatMap((conversation) =>
    getResponseDurationsForWindow(conversation.messages, previousStart, previousEnd),
  );

  const currentAverage = average(currentResponseDurations);
  const previousAverage = average(previousResponseDurations);
  const responseTimeDeltaHours =
    currentAverage !== null && previousAverage !== null
      ? roundHours(Math.abs(previousAverage - currentAverage))
      : null;

  const metrics = {
    followUpsSuggested: followUps.filter((item) => isWithinWindow(item.suggestedAt, currentStart, currentEnd)).length,
    followUpsSent: followUps.filter((item) => isWithinWindow(item.completedAt, currentStart, currentEnd)).length,
    remindersCompleted: reminders.filter(
      (item) =>
        item.status !== "ACTIVE" && isWithinWindow(item.updatedAt, currentStart, currentEnd),
    ).length,
    averageReplyHours: roundHours(currentAverage),
    responseTimeChange:
      currentAverage === null
        ? "new"
        : previousAverage === null
          ? "new"
          : currentAverage < previousAverage
            ? "faster"
            : currentAverage > previousAverage
              ? "slower"
              : "steady",
    responseTimeDeltaHours,
  } satisfies AnalyticsSummary["metrics"];

  const activeLeads = conversations
    .filter((conversation) => conversation.status !== "CLOSED")
    .sort((left, right) => {
      return (
        right.messages.length - left.messages.length ||
        right.lastMessageAt.getTime() - left.lastMessageAt.getTime()
      );
    })
    .slice(0, 5)
    .map((conversation) => ({
      conversationId: conversation.id,
      subject: conversation.subject,
      contactName: conversation.contactName,
      contactEmail: conversation.contactEmail,
      status: normalizeStatus(conversation.status),
      messageCount: conversation.messages.length,
      lastMessageAt: conversation.lastMessageAt.toISOString(),
    }));

  return {
    metrics,
    weeklySummary: buildWeeklySummary(metrics),
    activeLeads,
  } satisfies AnalyticsSummary;
}

export async function getAnalyticsSummary(userId: string) {
  const snapshot = await getDashboardSnapshot(userId);
  return snapshot.analytics;
}

export async function updateFollowUpStatus(
  userId: string,
  followUpId: string,
  status: FollowUpAction,
  remindAt?: string,
) {
  const followUpDelegate = prisma.followUp as any;
  const reminderDelegate = prisma.reminder as any;
  const taskDelegate = prisma.task as any;

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

  const openTask = await taskDelegate.findFirst({
    where: {
      conversationId: followUp.conversationId,
      status: "OPEN",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (openTask && (status === "DONE" || status === "IGNORED")) {
    await taskDelegate.update({
      where: { id: openTask.id },
      data: {
        status: status === "DONE" ? "DONE" : "CANCELED",
      },
    });
  }

  return listFollowUps(userId);
}
