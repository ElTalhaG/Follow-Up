import { prisma } from "../database/prisma.js";
import { AuthError } from "../auth/service.js";

type ReminderPreset = "later_today" | "tomorrow" | "next_week";

type ReminderRecord = {
  id: string;
  conversationId: string;
  subject: string;
  contactName: string | null;
  contactEmail: string;
  remindAt: string;
  isDue: boolean;
  status: "active" | "dismissed" | "sent";
};

function toReminderDate(preset: ReminderPreset) {
  const now = new Date();

  if (preset === "later_today") {
    const laterToday = new Date(now);
    laterToday.setHours(Math.min(now.getHours() + 4, 20), 0, 0, 0);
    return laterToday;
  }

  if (preset === "tomorrow") {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(9, 0, 0, 0);
  return nextWeek;
}

async function getConversationForUser(userId: string, conversationId: string) {
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

  return conversation;
}

export async function createConversationReminder(
  userId: string,
  conversationId: string,
  input: { remindAt?: string; preset?: ReminderPreset },
) {
  const reminderDelegate = prisma.reminder as any;
  await getConversationForUser(userId, conversationId);

  const remindAt = input.remindAt
    ? new Date(input.remindAt)
    : input.preset
      ? toReminderDate(input.preset)
      : null;

  if (!remindAt || Number.isNaN(remindAt.getTime())) {
    throw new AuthError("A valid remindAt or preset is required.", 400);
  }

  return reminderDelegate.create({
    data: {
      conversationId,
      remindAt,
      status: "ACTIVE",
    },
  });
}

export async function dismissReminder(userId: string, reminderId: string) {
  const reminderDelegate = prisma.reminder as any;
  const reminder = await reminderDelegate.findUnique({
    where: { id: reminderId },
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
  });

  if (!reminder || reminder.conversation.account.userId !== userId) {
    throw new AuthError("Reminder not found.", 404);
  }

  await reminderDelegate.update({
    where: { id: reminderId },
    data: {
      status: "DISMISSED",
    },
  });
}

export async function listReminders(userId: string) {
  const reminderDelegate = prisma.reminder as any;
  const reminders = await reminderDelegate.findMany({
    where: {
      status: "ACTIVE",
      conversation: {
        account: {
          userId,
        },
      },
    },
    include: {
      conversation: true,
    },
    orderBy: {
      remindAt: "asc",
    },
  });

  const now = Date.now();

  return reminders.map((reminder: any) => ({
    id: reminder.id,
    conversationId: reminder.conversationId,
    subject: reminder.conversation.subject,
    contactName: reminder.conversation.contactName,
    contactEmail: reminder.conversation.contactEmail,
    remindAt: reminder.remindAt.toISOString(),
    isDue: reminder.remindAt.getTime() <= now,
    status: reminder.status.toLowerCase(),
  })) as ReminderRecord[];
}

export async function listTaskSummary(userId: string) {
  const taskDelegate = prisma.task as any;
  const tasks = await taskDelegate.findMany({
    where: {
      conversation: {
        account: {
          userId,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    open: tasks.filter((task: any) => task.status === "OPEN").length,
    done: tasks.filter((task: any) => task.status === "DONE").length,
    canceled: tasks.filter((task: any) => task.status === "CANCELED").length,
  };
}
