const baseUrl = process.env.STAGING_API_BASE_URL?.trim();

if (!baseUrl) {
  console.error("Set STAGING_API_BASE_URL before running the staging smoke test.");
  process.exit(1);
}

const backendOrigin = baseUrl.endsWith("/api")
  ? baseUrl.slice(0, -4)
  : baseUrl.replace(/\/api\/?$/, "");

const checks = [
  {
    name: "Backend liveness",
    url: `${backendOrigin}/health`,
  },
  {
    name: "Database readiness",
    url: `${backendOrigin}/ready`,
  },
  {
    name: "API status",
    url: `${baseUrl}/status`,
  },
  {
    name: "Billing plans",
    url: `${baseUrl}/billing/plans`,
  },
  {
    name: "Launch metrics",
    url: `${baseUrl}/launch/metrics`,
  },
];

for (const check of checks) {
  const response = await fetch(check.url);

  if (!response.ok) {
    console.error(`${check.name} failed with status ${response.status}.`);
    process.exit(1);
  }

  const body = await response.json().catch(() => null);
  console.log(`PASS ${check.name}`);
  console.log(JSON.stringify(body, null, 2));
}

console.log("Staging smoke test passed.");
