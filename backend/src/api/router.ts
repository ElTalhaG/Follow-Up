import { Router } from "express";
import { getDemoFlaggedConversations } from "../follow-up/demo-data.js";

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

  return router;
}
