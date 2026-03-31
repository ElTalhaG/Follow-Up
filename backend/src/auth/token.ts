import { createHmac } from "node:crypto";

type AuthTokenPayload = {
  userId: string;
  email: string;
  exp: number;
};

const HEADER = {
  alg: "HS256",
  typ: "JWT",
};

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url<T>(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return secret;
}

export function createAuthToken(userId: string, email: string) {
  const secret = getAuthSecret();
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const payload: AuthTokenPayload = {
    userId,
    email,
    exp: nowInSeconds + 60 * 60 * 24 * 7,
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(HEADER));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token: string) {
  const secret = getAuthSecret();
  const [encodedHeader, encodedPayload, signature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`, secret);

  if (signature !== expectedSignature) {
    return null;
  }

  const header = decodeBase64Url<{ alg: string; typ: string }>(encodedHeader);

  if (header.alg !== "HS256" || header.typ !== "JWT") {
    return null;
  }

  const payload = decodeBase64Url<AuthTokenPayload>(encodedPayload);

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}
