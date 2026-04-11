import { prisma } from "../database/prisma.js";
import { trackLaunchEvent } from "../launch/metrics.js";
import { hashPassword, verifyPassword } from "./password.js";
import { createAuthToken, verifyAuthToken } from "./token.js";

type AuthInput = {
  email: string;
  password: string;
  fullName?: string;
};

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string) {
  return password.length >= 8;
}

function sanitizeUser(user: { id: string; email: string; fullName: string }) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
  };
}

export async function registerUser(input: AuthInput) {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const fullName = input.fullName?.trim() ?? "";

  if (!fullName) {
    throw new AuthError("Full name is required.");
  }

  if (!validateEmail(email)) {
    throw new AuthError("A valid email is required.");
  }

  if (!validatePassword(password)) {
    throw new AuthError("Password must be at least 8 characters long.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AuthError("An account with that email already exists.", 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
    },
  });

  await trackLaunchEvent({
    eventType: "signup_completed",
    email: user.email,
    userId: user.id,
    source: "auth-register",
  });

  return {
    token: createAuthToken(user.id, user.email),
    user: sanitizeUser(user),
  };
}

export async function loginUser(input: AuthInput) {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  if (!validateEmail(email)) {
    throw new AuthError("A valid email is required.");
  }

  if (!password) {
    throw new AuthError("Password is required.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AuthError("Invalid email or password.", 401);
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AuthError("Invalid email or password.", 401);
  }

  return {
    token: createAuthToken(user.id, user.email),
    user: sanitizeUser(user),
  };
}

export async function getUserFromBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AuthError("Authorization header is missing.", 401);
  }

  const token = authorizationHeader.slice("Bearer ".length);
  const payload = verifyAuthToken(token);

  if (!payload) {
    throw new AuthError("Token is invalid or expired.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new AuthError("User not found.", 404);
  }

  return sanitizeUser(user);
}
