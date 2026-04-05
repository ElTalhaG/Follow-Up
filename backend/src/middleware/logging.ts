import type { NextFunction, Request, Response } from "express";

function buildLogEntry(
  level: "info" | "error",
  message: string,
  extra: Record<string, unknown> = {},
) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...extra,
  });
}

export function logInfo(message: string, extra: Record<string, unknown> = {}) {
  console.log(buildLogEntry("info", message, extra));
}

export function logError(message: string, extra: Record<string, unknown> = {}) {
  console.error(buildLogEntry("error", message, extra));
}

export function requestLogger(request: Request, response: Response, next: NextFunction) {
  const startedAt = Date.now();

  response.on("finish", () => {
    logInfo("request_completed", {
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
    });
  });

  next();
}
