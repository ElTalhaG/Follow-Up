import type { NextFunction, Request, Response } from "express";
import { getRateLimitConfig } from "../config/env.js";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const requestCounts = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries(now: number) {
  for (const [key, value] of requestCounts.entries()) {
    if (value.resetAt <= now) {
      requestCounts.delete(key);
    }
  }
}

function getClientKey(request: Request) {
  return `${request.ip}:${request.method}:${request.path}`;
}

export function rateLimit(request: Request, response: Response, next: NextFunction) {
  const { enabled, maxRequests, windowMs } = getRateLimitConfig();

  if (!enabled) {
    next();
    return;
  }

  const now = Date.now();
  cleanupExpiredEntries(now);

  const key = getClientKey(request);
  const current = requestCounts.get(key);

  if (!current || current.resetAt <= now) {
    requestCounts.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    next();
    return;
  }

  if (current.count >= maxRequests) {
    response.status(429).json({
      ok: false,
      error: "Rate limit exceeded. Please try again shortly.",
    });
    return;
  }

  current.count += 1;
  requestCounts.set(key, current);
  next();
}
