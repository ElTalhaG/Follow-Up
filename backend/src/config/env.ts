import cors from "cors";

function parseList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getPort() {
  return Number(process.env.PORT ?? 4000);
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export function getDatabaseProvider() {
  const value = process.env.DATABASE_URL ?? "";

  if (value.startsWith("postgres://") || value.startsWith("postgresql://")) {
    return "postgresql";
  }

  if (value.startsWith("file:")) {
    return "sqlite";
  }

  return "unknown";
}

export function getGmailMode() {
  return process.env.GMAIL_MOCK_MODE === "true" ? "mock" : "live";
}

export function validateRuntimeEnv() {
  getRequiredEnv("DATABASE_URL");
  getRequiredEnv("AUTH_SECRET");

  if (getGmailMode() === "live") {
    getRequiredEnv("GMAIL_CLIENT_ID");
    getRequiredEnv("GMAIL_CLIENT_SECRET");
  }

  if (isProduction()) {
    getRequiredEnv("CORS_ORIGIN");
  }
}

export function getRuntimeSummary() {
  return {
    environment: isProduction() ? "production" : "development",
    databaseProvider: getDatabaseProvider(),
    gmailMode: getGmailMode(),
    hasCorsOrigin: Boolean(process.env.CORS_ORIGIN?.trim()),
  };
}

export function buildCorsOptions(): cors.CorsOptions {
  const configuredOrigins = parseList(process.env.CORS_ORIGIN);

  if (configuredOrigins.length === 0) {
    return {
      origin: true,
    };
  }

  return {
    origin: configuredOrigins,
  };
}
