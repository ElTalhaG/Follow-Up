import { mkdirSync, existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(scriptDir, "..");
const dbPath = resolve(backendDir, "dev.db");
const shouldReset = process.argv.includes("--reset");

mkdirSync(dirname(dbPath), { recursive: true });

if (shouldReset && existsSync(dbPath)) {
  rmSync(dbPath);
}

const db = new DatabaseSync(dbPath);

db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  DROP TABLE IF EXISTS "Reminder";
  DROP TABLE IF EXISTS "Task";
  DROP TABLE IF EXISTS "FollowUp";
  DROP TABLE IF EXISTS "Message";
  DROP TABLE IF EXISTS "Conversation";
  DROP TABLE IF EXISTS "Account";
  DROP TABLE IF EXISTS "User";
  DROP TABLE IF EXISTS "Draft";

  CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "emailAddress" TEXT,
    "accessScope" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" DATETIME,
    "connectedAt" DATETIME NOT NULL,
    "lastSyncedAt" DATETIME,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key"
  ON "Account"("provider", "providerAccountId");

  CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "externalThreadId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastMessageAt" DATETIME NOT NULL,
    "lastInboundAt" DATETIME,
    "lastOutboundAt" DATETIME,
    "needsFollowUp" INTEGER NOT NULL DEFAULT 0,
    "followUpReason" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_accountId_externalThreadId_key"
  ON "Conversation"("accountId", "externalThreadId");

  CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "externalMessageId" TEXT NOT NULL UNIQUE,
    "direction" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "bodyExcerpt" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL,
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "FollowUp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "suggestedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "Draft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "followUpId" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    FOREIGN KEY ("followUpId") REFERENCES "FollowUp"("id") ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dueAt" DATETIME,
    "createdAt" DATETIME NOT NULL,
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "remindAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE
  );
`);

const now = "2026-03-27T10:00:00.000Z";

const insertUser = db.prepare(`
  INSERT INTO "User" ("id", "email", "passwordHash", "fullName", "createdAt", "updatedAt")
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertAccount = db.prepare(`
  INSERT INTO "Account" (
    "id", "userId", "provider", "providerAccountId", "emailAddress", "accessScope",
    "accessToken", "refreshToken", "tokenExpiresAt", "connectedAt", "lastSyncedAt"
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertConversation = db.prepare(`
  INSERT INTO "Conversation" (
    "id", "accountId", "externalThreadId", "subject", "contactName", "contactEmail", "status",
    "lastMessageAt", "lastInboundAt", "lastOutboundAt", "needsFollowUp", "followUpReason", "createdAt", "updatedAt"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMessage = db.prepare(`
  INSERT INTO "Message" (
    "id", "conversationId", "externalMessageId", "direction", "senderEmail", "bodyExcerpt", "sentAt", "createdAt"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertFollowUp = db.prepare(`
  INSERT INTO "FollowUp" (
    "id", "conversationId", "status", "reason", "priority", "suggestedAt", "completedAt"
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertTask = db.prepare(`
  INSERT INTO "Task" ("id", "conversationId", "title", "status", "dueAt", "createdAt")
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertDraft = db.prepare(`
  INSERT INTO "Draft" ("id", "followUpId", "tone", "content", "createdAt")
  VALUES (?, ?, ?, ?, ?)
`);

const insertReminder = db.prepare(`
  INSERT INTO "Reminder" ("id", "conversationId", "remindAt", "status", "createdAt")
  VALUES (?, ?, ?, ?, ?)
`);

insertUser.run(
  "user_1",
  "freelancer@example.com",
  "seed_password_hash",
  "Alex Mercer",
  now,
  now,
);

insertAccount.run(
  "account_1",
  "user_1",
  "gmail",
  "gmail_alex_001",
  "freelancer@example.com",
  "read-only",
  "mock_access_token",
  "mock_refresh_token",
  "2026-04-01T10:00:00.000Z",
  now,
  "2026-03-27T09:00:00.000Z",
);

insertConversation.run(
  "conv_1",
  "account_1",
  "thread_website_redesign",
  "Website redesign inquiry",
  "Maya Jensen",
  "maya@example.com",
  "OVERDUE",
  "2026-03-26T02:00:00.000Z",
  "2026-03-26T02:00:00.000Z",
  null,
  1,
  "Inbound lead has not received a reply in 31 hours.",
  now,
  now,
);

insertConversation.run(
  "conv_2",
  "account_1",
  "thread_retainer",
  "Monthly retainer follow-up",
  "North Studio",
  "team@northstudio.example",
  "WAITING",
  "2026-03-22T10:00:00.000Z",
  "2026-03-20T14:00:00.000Z",
  "2026-03-22T10:00:00.000Z",
  1,
  "Warm conversation has been inactive for 5 days after pricing was shared.",
  now,
  now,
);

insertConversation.run(
  "conv_3",
  "account_1",
  "thread_closed",
  "Coaching package confirmed",
  "Lina Boyd",
  "lina@example.com",
  "CLOSED",
  "2026-03-25T15:30:00.000Z",
  "2026-03-25T15:30:00.000Z",
  "2026-03-25T11:00:00.000Z",
  0,
  null,
  now,
  now,
);

insertMessage.run(
  "msg_1",
  "conv_1",
  "msg_maya_1",
  "INBOUND",
  "maya@example.com",
  "Hi Alex, I am looking for help redesigning my portfolio site. Do you have availability next week?",
  "2026-03-26T02:00:00.000Z",
  now,
);

insertMessage.run(
  "msg_2",
  "conv_2",
  "msg_north_1",
  "INBOUND",
  "team@northstudio.example",
  "Can you send over monthly pricing for ongoing design support?",
  "2026-03-20T14:00:00.000Z",
  now,
);

insertMessage.run(
  "msg_3",
  "conv_2",
  "msg_north_2",
  "OUTBOUND",
  "freelancer@example.com",
  "Absolutely. I have attached two retainer options depending on how hands-on you want the partnership to be.",
  "2026-03-22T10:00:00.000Z",
  now,
);

insertMessage.run(
  "msg_4",
  "conv_3",
  "msg_lina_1",
  "OUTBOUND",
  "freelancer@example.com",
  "Here is the coaching package outline and a link to book.",
  "2026-03-25T11:00:00.000Z",
  now,
);

insertMessage.run(
  "msg_5",
  "conv_3",
  "msg_lina_2",
  "INBOUND",
  "lina@example.com",
  "Perfect, I have booked it. Looking forward to it.",
  "2026-03-25T15:30:00.000Z",
  now,
);

insertFollowUp.run(
  "followup_1",
  "conv_1",
  "OPEN",
  "Lead is warm and waiting on a first response.",
  "high",
  now,
  null,
);

insertFollowUp.run(
  "followup_2",
  "conv_2",
  "SNOOZED",
  "Conversation is still warm but needs a nudge.",
  "medium",
  now,
  null,
);

insertDraft.run(
  "draft_1",
  "followup_1",
  "professional",
  "Hi Maya, just following up in case my earlier note got buried. I'd be happy to help with the website redesign and can send a simple next-step plan today if useful.",
  now,
);

insertTask.run(
  "task_1",
  "conv_1",
  "Reply to Maya with next-step options",
  "OPEN",
  "2026-03-27T10:00:00.000Z",
  now,
);

insertReminder.run(
  "reminder_1",
  "conv_1",
  "2026-03-27T10:00:00.000Z",
  "ACTIVE",
  now,
);

insertReminder.run(
  "reminder_2",
  "conv_2",
  "2026-03-29T08:00:00.000Z",
  "ACTIVE",
  now,
);

const counts = {
  users: db.prepare(`SELECT COUNT(*) AS count FROM "User"`).get().count,
  accounts: db.prepare(`SELECT COUNT(*) AS count FROM "Account"`).get().count,
  conversations: db.prepare(`SELECT COUNT(*) AS count FROM "Conversation"`).get()
    .count,
  messages: db.prepare(`SELECT COUNT(*) AS count FROM "Message"`).get().count,
  followUps: db.prepare(`SELECT COUNT(*) AS count FROM "FollowUp"`).get().count,
};

db.close();

console.log("Initialized local SQLite database at backend/dev.db");
console.log(counts);
