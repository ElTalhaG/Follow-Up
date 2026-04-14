import { Router } from "express";
import { prisma } from "../database/prisma.js";
import {
  AuthError,
  getUserFromBearerToken,
  loginUser,
  registerUser,
} from "../auth/service.js";
import {
  connectGmailAccount,
  getGmailConnectUrl,
  listGmailAccounts,
  syncGmailAccount,
} from "../integrations/gmail.js";
import {
  getAnalyticsSummary,
  listConversations,
  listFollowUps,
  refreshFollowUps,
  updateConversationNotes,
  updateFollowUpStatus,
} from "../follow-up/service.js";
import { generateDraft, listDraftHistory, updateDraftContent } from "../follow-up/drafts.js";
import {
  createConversationReminder,
  dismissReminder,
  listReminders,
  listTaskSummary,
} from "../follow-up/reminders.js";
import { createCheckoutLink, listBillingPlans } from "../billing/service.js";
import { getLaunchMetrics } from "../launch/metrics.js";
import {
  createWaitlistEntry,
  listWaitlistEntries,
  updateWaitlistEntry,
} from "../launch/waitlist.js";

export function buildRouter() {
  const router = Router();

  router.get("/status", (_request, response) => {
    response.json({
      name: "followup-api",
      version: "0.1.0",
      focus: "Detect unanswered Gmail leads and suggest follow-ups.",
    });
  });

  router.get("/billing/plans", (_request, response) => {
    response.json(listBillingPlans());
  });

  router.post("/billing/checkout-link", async (request, response, next) => {
    try {
      const planId = String(request.body.planId ?? "");
      const checkout = await createCheckoutLink(planId);

      response.status(201).json(checkout);
    } catch (error) {
      next(error);
    }
  });

  router.post("/launch/waitlist", async (request, response, next) => {
    try {
      const result = await createWaitlistEntry({
        email: String(request.body.email ?? ""),
        fullName: request.body.fullName === undefined ? undefined : String(request.body.fullName),
        segment: request.body.segment === undefined ? undefined : String(request.body.segment),
        notes: request.body.notes === undefined ? undefined : String(request.body.notes),
        source: request.body.source === undefined ? undefined : String(request.body.source),
      });

      response.status(result.alreadyJoined ? 200 : 201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/launch/waitlist", async (request, response, next) => {
    try {
      const limit = Number(request.query.limit ?? 8);
      const items = await listWaitlistEntries(limit);
      response.json({ items });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/launch/waitlist/:entryId", async (request, response, next) => {
    try {
      const entryId = String(request.params.entryId ?? "");
      const entry = await updateWaitlistEntry(entryId, {
        status: request.body.status === undefined ? undefined : String(request.body.status),
        notes: request.body.notes === undefined ? undefined : String(request.body.notes),
      });

      response.json({ entry });
    } catch (error) {
      next(error);
    }
  });

  router.get("/launch/metrics", async (_request, response, next) => {
    try {
      response.json(await getLaunchMetrics());
    } catch (error) {
      next(error);
    }
  });

  router.get("/follow-ups", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const items = await listFollowUps(user.id);

      response.json({ items });
    } catch (error) {
      next(error);
    }
  });

  router.post("/follow-ups/refresh", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const items = await refreshFollowUps(user.id);

      response.json({ items });
    } catch (error) {
      next(error);
    }
  });

  router.post("/follow-ups/:followUpId/status", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const followUpId = String(request.params.followUpId ?? "");
      const status = String(request.body.status ?? "").toUpperCase() as
        | "OPEN"
        | "DONE"
        | "IGNORED"
        | "SNOOZED";
      const remindAt =
        request.body.remindAt === undefined ? undefined : String(request.body.remindAt);

      if (!["OPEN", "DONE", "IGNORED", "SNOOZED"].includes(status)) {
        throw new AuthError("status must be OPEN, DONE, IGNORED, or SNOOZED.", 400);
      }

      const items = await updateFollowUpStatus(user.id, followUpId, status, remindAt);
      response.json({ items });
    } catch (error) {
      next(error);
    }
  });

  router.get("/conversations", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const items = await listConversations(user.id);

      response.json({ items });
    } catch (error) {
      next(error);
    }
  });

  router.get("/analytics", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const analytics = await getAnalyticsSummary(user.id);

      response.json(analytics);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/conversations/:conversationId/notes", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const conversationId = String(request.params.conversationId ?? "");
      const notes = String(request.body.notes ?? "");
      const items = await updateConversationNotes(user.id, conversationId, notes);

      response.json({ items });
    } catch (error) {
      next(error);
    }
  });

  router.get("/reminders", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const [items, tasks] = await Promise.all([
        listReminders(user.id),
        listTaskSummary(user.id),
      ]);

      response.json({ items, tasks });
    } catch (error) {
      next(error);
    }
  });

  router.post("/conversations/:conversationId/reminders", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const conversationId = String(request.params.conversationId ?? "");
      const remindAt =
        request.body.remindAt === undefined ? undefined : String(request.body.remindAt);
      const preset =
        request.body.preset === undefined ? undefined : String(request.body.preset);

      const reminder = await createConversationReminder(user.id, conversationId, {
        remindAt,
        preset: preset as "later_today" | "tomorrow" | "next_week" | undefined,
      });

      response.status(201).json({
        reminder: {
          id: reminder.id,
          conversationId: reminder.conversationId,
          remindAt: reminder.remindAt.toISOString(),
          status: reminder.status.toLowerCase(),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/reminders/:reminderId/dismiss", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const reminderId = String(request.params.reminderId ?? "");
      await dismissReminder(user.id, reminderId);
      const [items, tasks] = await Promise.all([
        listReminders(user.id),
        listTaskSummary(user.id),
      ]);

      response.json({ items, tasks });
    } catch (error) {
      next(error);
    }
  });

  router.post("/follow-ups/:followUpId/drafts", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const followUpId = String(request.params.followUpId ?? "");
      const tone = String(request.body.tone ?? "professional").toLowerCase();
      const draft = await generateDraft(user.id, followUpId, tone);

      response.status(201).json({ draft });
    } catch (error) {
      next(error);
    }
  });

  router.get("/follow-ups/:followUpId/drafts", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const followUpId = String(request.params.followUpId ?? "");
      const drafts = await listDraftHistory(user.id, followUpId);

      response.json({ items: drafts });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/drafts/:draftId", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const draftId = String(request.params.draftId ?? "");
      const content = String(request.body.content ?? "");
      const draft = await updateDraftContent(user.id, draftId, content);

      response.json({ draft });
    } catch (error) {
      next(error);
    }
  });

  router.get("/database/summary", async (_request, response, next) => {
    try {
      const [users, accounts, conversations, messages, followUps] =
        await Promise.all([
          prisma.user.count(),
          prisma.account.count(),
          prisma.conversation.count(),
          prisma.message.count(),
          prisma.followUp.count(),
        ]);

      response.json({
        users,
        accounts,
        conversations,
        messages,
        followUps,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/auth/register", async (request, response, next) => {
    try {
      const result = await registerUser({
        email: String(request.body.email ?? ""),
        password: String(request.body.password ?? ""),
        fullName: String(request.body.fullName ?? ""),
      });

      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/auth/login", async (request, response, next) => {
    try {
      const result = await loginUser({
        email: String(request.body.email ?? ""),
        password: String(request.body.password ?? ""),
      });

      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/auth/me", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);

      response.json({ user });
    } catch (error) {
      next(error);
    }
  });

  router.get("/integrations/gmail/connect-url", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const redirectUri = String(request.query.redirectUri ?? "");

      if (!redirectUri) {
        throw new AuthError("redirectUri is required.", 400);
      }

      response.json(getGmailConnectUrl(user.id, redirectUri));
    } catch (error) {
      next(error);
    }
  });

  router.post("/integrations/gmail/callback", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const code = String(request.body.code ?? "");
      const state = String(request.body.state ?? "");
      const redirectUri = String(request.body.redirectUri ?? "");

      if (!code || !state || !redirectUri) {
        throw new AuthError("code, state, and redirectUri are required.", 400);
      }

      const result = await connectGmailAccount(user.id, code, state, redirectUri);
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/integrations/gmail/accounts", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const accounts = await listGmailAccounts(user.id);

      response.json({ items: accounts });
    } catch (error) {
      next(error);
    }
  });

  router.post("/integrations/gmail/sync", async (request, response, next) => {
    try {
      const user = await getUserFromBearerToken(request.headers.authorization);
      const accountId = String(request.body.accountId ?? "");
      const maxResults = Number(request.body.maxResults ?? 10);

      if (!accountId) {
        throw new AuthError("accountId is required.", 400);
      }

      const result = await syncGmailAccount(user.id, accountId, maxResults);

      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function getErrorStatusCode(error: unknown) {
  if (error instanceof AuthError) {
    return error.statusCode;
  }

  return 500;
}
