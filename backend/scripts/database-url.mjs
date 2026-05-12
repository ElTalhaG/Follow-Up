export function normalizeDatabaseUrl(value) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return trimmed;
  }

  if (!trimmed.startsWith("postgres://") && !trimmed.startsWith("postgresql://")) {
    return trimmed;
  }

  const parsed = new URL(trimmed);
  const hostname = parsed.hostname.toLowerCase();

  if (hostname.endsWith(".render.com") && !parsed.searchParams.has("sslmode")) {
    parsed.searchParams.set("sslmode", "require");
  }

  return parsed.toString();
}
