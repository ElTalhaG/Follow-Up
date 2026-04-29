const baseUrl = process.env.STAGING_API_BASE_URL?.trim();

if (!baseUrl) {
  console.error("Set STAGING_API_BASE_URL before running the staging smoke test.");
  process.exit(1);
}

const checks = [
  {
    name: "API status",
    path: "/status",
  },
  {
    name: "Billing plans",
    path: "/billing/plans",
  },
  {
    name: "Launch metrics",
    path: "/launch/metrics",
  },
];

for (const check of checks) {
  const response = await fetch(`${baseUrl}${check.path}`);

  if (!response.ok) {
    console.error(`${check.name} failed with status ${response.status}.`);
    process.exit(1);
  }

  const body = await response.json().catch(() => null);
  console.log(`PASS ${check.name}`);
  console.log(JSON.stringify(body, null, 2));
}

console.log("Staging smoke test passed.");
