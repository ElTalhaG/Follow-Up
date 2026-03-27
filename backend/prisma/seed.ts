import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.reminder.deleteMany();
  await prisma.task.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "freelancer@example.com",
      passwordHash: "seed_password_hash",
      fullName: "Alex Mercer",
      accounts: {
        create: {
          provider: "gmail",
          providerAccountId: "gmail_alex_001",
          accessScope: "read-only",
          lastSyncedAt: new Date("2026-03-27T09:00:00.000Z"),
          conversations: {
            create: [
              {
                externalThreadId: "thread_website_redesign",
                subject: "Website redesign inquiry",
                contactName: "Maya Jensen",
                contactEmail: "maya@example.com",
                status: "OVERDUE",
                lastMessageAt: new Date("2026-03-26T02:00:00.000Z"),
                lastInboundAt: new Date("2026-03-26T02:00:00.000Z"),
                needsFollowUp: true,
                followUpReason:
                  "Inbound lead has not received a reply in 31 hours.",
                messages: {
                  create: [
                    {
                      externalMessageId: "msg_maya_1",
                      direction: "INBOUND",
                      senderEmail: "maya@example.com",
                      bodyExcerpt:
                        "Hi Alex, I am looking for help redesigning my portfolio site. Do you have availability next week?",
                      sentAt: new Date("2026-03-26T02:00:00.000Z"),
                    },
                  ],
                },
                followUps: {
                  create: {
                    status: "OPEN",
                    reason: "Lead is warm and waiting on a first response.",
                    priority: "high",
                  },
                },
                reminders: {
                  create: {
                    remindAt: new Date("2026-03-27T10:00:00.000Z"),
                    status: "ACTIVE",
                  },
                },
                tasks: {
                  create: {
                    title: "Reply to Maya with next-step options",
                    status: "OPEN",
                    dueAt: new Date("2026-03-27T10:00:00.000Z"),
                  },
                },
              },
              {
                externalThreadId: "thread_retainer",
                subject: "Monthly retainer follow-up",
                contactName: "North Studio",
                contactEmail: "team@northstudio.example",
                status: "WAITING",
                lastMessageAt: new Date("2026-03-22T10:00:00.000Z"),
                lastInboundAt: new Date("2026-03-20T14:00:00.000Z"),
                lastOutboundAt: new Date("2026-03-22T10:00:00.000Z"),
                needsFollowUp: true,
                followUpReason:
                  "Warm conversation has been inactive for 5 days after pricing was shared.",
                messages: {
                  create: [
                    {
                      externalMessageId: "msg_north_1",
                      direction: "INBOUND",
                      senderEmail: "team@northstudio.example",
                      bodyExcerpt:
                        "Can you send over monthly pricing for ongoing design support?",
                      sentAt: new Date("2026-03-20T14:00:00.000Z"),
                    },
                    {
                      externalMessageId: "msg_north_2",
                      direction: "OUTBOUND",
                      senderEmail: "freelancer@example.com",
                      bodyExcerpt:
                        "Absolutely. I have attached two retainer options depending on how hands-on you want the partnership to be.",
                      sentAt: new Date("2026-03-22T10:00:00.000Z"),
                    },
                  ],
                },
                followUps: {
                  create: {
                    status: "SNOOZED",
                    reason: "Conversation is still warm but needs a nudge.",
                    priority: "medium",
                  },
                },
                reminders: {
                  create: {
                    remindAt: new Date("2026-03-29T08:00:00.000Z"),
                    status: "ACTIVE",
                  },
                },
              },
              {
                externalThreadId: "thread_closed",
                subject: "Coaching package confirmed",
                contactName: "Lina Boyd",
                contactEmail: "lina@example.com",
                status: "CLOSED",
                lastMessageAt: new Date("2026-03-25T15:30:00.000Z"),
                lastInboundAt: new Date("2026-03-25T15:30:00.000Z"),
                lastOutboundAt: new Date("2026-03-25T11:00:00.000Z"),
                needsFollowUp: false,
                messages: {
                  create: [
                    {
                      externalMessageId: "msg_lina_1",
                      direction: "OUTBOUND",
                      senderEmail: "freelancer@example.com",
                      bodyExcerpt:
                        "Here is the coaching package outline and a link to book.",
                      sentAt: new Date("2026-03-25T11:00:00.000Z"),
                    },
                    {
                      externalMessageId: "msg_lina_2",
                      direction: "INBOUND",
                      senderEmail: "lina@example.com",
                      bodyExcerpt: "Perfect, I have booked it. Looking forward to it.",
                      sentAt: new Date("2026-03-25T15:30:00.000Z"),
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
    include: {
      accounts: {
        include: {
          conversations: true,
        },
      },
    },
  });

  console.log(
    `Seeded ${user.accounts.length} account and ${user.accounts[0]?.conversations.length ?? 0} conversations.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
