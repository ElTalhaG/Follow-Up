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
  listConversations,
  listFollowUps,
  refreshFollowUps,
  updateFollowUpStatus,
} from "../follow-up/service.js";
import { generateDraft, listDraftHistory, updateDraftContent } from "../follow-up/drafts.js";

export function buildRouter() {
  const router = Router();

  router.get("/status", (_request, response) => {
    response.json({
      name: "followup-api",
      version: "0.1.0",
      focus: "Detect unanswered Gmail leads and suggest follow-ups.",
    });
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
