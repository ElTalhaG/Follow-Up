import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date("2026-03-27T10:00:00.000Z");

  await prisma.waitlistEntry.deleteMany();
  await prisma.draft.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.task.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      id: "user_1",
      email: "freelancer@example.com",
      passwordHash: "seed_password_hash",
      fullName: "Alex Mercer",
      createdAt: now,
      updatedAt: now,
      accounts: {
        create: {
          id: "account_1",
          provider: "gmail",
          providerAccountId: "gmail_alex_001",
          emailAddress: "freelancer@example.com",
          accessScope: "read-only",
          accessToken: "mock_access_token",
          refreshToken: "mock_refresh_token",
          tokenExpiresAt: new Date("2026-04-01T10:00:00.000Z"),
          connectedAt: now,
          lastSyncedAt: new Date("2026-03-27T09:00:00.000Z"),
          conversations: {
            create: [
              {
                id: "conv_1",
                externalThreadId: "thread_website_redesign",
                subject: "Website redesign inquiry",
                contactName: "Maya Jensen",
                contactEmail: "maya@example.com",
                notes: "Warm portfolio lead. Interested in a redesign next week.",
                status: "OVERDUE",
                lastMessageAt: new Date("2026-03-26T02:00:00.000Z"),
                lastInboundAt: new Date("2026-03-26T02:00:00.000Z"),
                lastOutboundAt: null,
                needsFollowUp: true,
                followUpReason: "Inbound lead has not received a reply in 31 hours.",
                createdAt: now,
                updatedAt: now,
                messages: {
                  create: [
                    {
                      id: "msg_1",
                      externalMessageId: "msg_maya_1",
                      direction: "INBOUND",
                      senderEmail: "maya@example.com",
                      bodyExcerpt:
                        "Hi Alex, I am looking for help redesigning my portfolio site. Do you have availability next week?",
                      sentAt: new Date("2026-03-26T02:00:00.000Z"),
                      createdAt: now,
                    },
                  ],
                },
                followUps: {
                  create: [
                    {
                      id: "followup_1",
                      status: "OPEN",
                      reason: "Lead is warm and waiting on a first response.",
                      priority: "high",
                      suggestedAt: now,
                      drafts: {
                        create: [
                          {
                            id: "draft_1",
                            tone: "professional",
                            content:
                              "Hi Maya, just following up in case my earlier note got buried. I'd be happy to help with the website redesign and can send a simple next-step plan today if useful.",
                            createdAt: now,
                          },
                        ],
                      },
                    },
                  ],
                },
                tasks: {
                  create: [
                    {
                      id: "task_1",
                      title: "Reply to Maya with next-step options",
                      status: "OPEN",
                      dueAt: new Date("2026-03-27T10:00:00.000Z"),
                      createdAt: now,
                    },
                  ],
                },
                reminders: {
                  create: [
                    {
                      id: "reminder_1",
                      remindAt: new Date("2026-03-27T10:00:00.000Z"),
                      status: "ACTIVE",
                      createdAt: now,
                      updatedAt: now,
                    },
                  ],
                },
              },
              {
                id: "conv_2",
                externalThreadId: "thread_retainer",
                subject: "Monthly retainer follow-up",
                contactName: "North Studio",
                contactEmail: "team@northstudio.example",
                notes: "Agency prospect asking about ongoing ad creative support.",
                status: "WAITING",
                lastMessageAt: new Date("2026-03-22T10:00:00.000Z"),
                lastInboundAt: new Date("2026-03-20T14:00:00.000Z"),
                lastOutboundAt: new Date("2026-03-22T10:00:00.000Z"),
                needsFollowUp: true,
                followUpReason:
                  "Warm conversation has been inactive for 5 days after pricing was shared.",
                createdAt: now,
                updatedAt: now,
                messages: {
                  create: [
                    {
                      id: "msg_2",
                      externalMessageId: "msg_north_1",
                      direction: "INBOUND",
                      senderEmail: "team@northstudio.example",
                      bodyExcerpt:
                        "Can you send over monthly pricing for ongoing design support?",
                      sentAt: new Date("2026-03-20T14:00:00.000Z"),
                      createdAt: now,
                    },
                    {
                      id: "msg_3",
                      externalMessageId: "msg_north_2",
                      direction: "OUTBOUND",
                      senderEmail: "freelancer@example.com",
                      bodyExcerpt:
                        "Absolutely. I have attached two retainer options depending on how hands-on you want the partnership to be.",
                      sentAt: new Date("2026-03-22T10:00:00.000Z"),
                      createdAt: now,
                    },
                  ],
                },
                followUps: {
                  create: [
                    {
                      id: "followup_2",
                      status: "SNOOZED",
                      reason: "Conversation is still warm but needs a nudge.",
                      priority: "medium",
                      suggestedAt: now,
                    },
                  ],
                },
                reminders: {
                  create: [
                    {
                      id: "reminder_2",
                      remindAt: new Date("2026-03-29T08:00:00.000Z"),
                      status: "ACTIVE",
                      createdAt: now,
                      updatedAt: now,
                    },
                  ],
                },
              },
              {
                id: "conv_3",
                externalThreadId: "thread_closed",
                subject: "Coaching package confirmed",
                contactName: "Lina Boyd",
                contactEmail: "lina@example.com",
                notes: "Closed-won coaching customer.",
                status: "CLOSED",
                lastMessageAt: new Date("2026-03-25T15:30:00.000Z"),
                lastInboundAt: new Date("2026-03-25T15:30:00.000Z"),
                lastOutboundAt: new Date("2026-03-25T11:00:00.000Z"),
                needsFollowUp: false,
                followUpReason: null,
                createdAt: now,
                updatedAt: now,
                messages: {
                  create: [
                    {
                      id: "msg_4",
                      externalMessageId: "msg_lina_1",
                      direction: "OUTBOUND",
                      senderEmail: "freelancer@example.com",
                      bodyExcerpt: "Here is the coaching package outline and a link to book.",
                      sentAt: new Date("2026-03-25T11:00:00.000Z"),
                      createdAt: now,
                    },
                    {
                      id: "msg_5",
                      externalMessageId: "msg_lina_2",
                      direction: "INBOUND",
                      senderEmail: "lina@example.com",
                      bodyExcerpt: "Perfect, I have booked it. Looking forward to it.",
                      sentAt: new Date("2026-03-25T15:30:00.000Z"),
                      createdAt: now,
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  });

  await prisma.waitlistEntry.create({
    data: {
      id: "waitlist_1",
      email: "prospect@example.com",
      fullName: "Jamie Rivera",
      segment: "freelancer",
      notes: "Interested in a founding-user trial as soon as Gmail staging is live.",
      source: "landing-page",
      createdAt: now,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
