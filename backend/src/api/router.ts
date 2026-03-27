import { Router } from "express";
import { getDemoFlaggedConversations } from "../follow-up/demo-data.js";
import { prisma } from "../database/prisma.js";

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

  return router;
}
