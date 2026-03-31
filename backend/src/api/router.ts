import { Router } from "express";
import { getDemoFlaggedConversations } from "../follow-up/demo-data.js";
import { prisma } from "../database/prisma.js";
import {
  AuthError,
  getUserFromBearerToken,
  loginUser,
  registerUser,
} from "../auth/service.js";

export function buildRouter() {
  const router = Router();

  router.get("/status", (_request, response) => {
    response.json({
      name: "followup-api",
      version: "0.1.0",
      focus: "Detect unanswered Gmail leads and suggest follow-ups.",
    });
  });

  router.get("/follow-ups", (_request, response) => {
    response.json({
      items: getDemoFlaggedConversations(),
    });
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

  return router;
}

export function getErrorStatusCode(error: unknown) {
  if (error instanceof AuthError) {
    return error.statusCode;
  }

  return 500;
}
