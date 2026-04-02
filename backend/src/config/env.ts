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
