# Staging Smoke Test

Once the app is deployed, run a fast API smoke test against the staging backend before deeper manual QA.

## What It Checks

- `GET /api/status`
- `GET /api/billing/plans`
- `GET /api/launch/metrics`

These checks confirm that:

- the backend is reachable
- JSON responses are working
- billing metadata loads
- launch metrics are available

## How To Run

From the repo root:

```bash
STAGING_API_BASE_URL=https://your-staging-backend.example.com/api npm run smoke:staging
```

If everything is healthy, the script prints a `PASS` line for each endpoint and finishes with:

```text
Staging smoke test passed.
```

## Suggested Follow-Up

After the smoke test passes, manually validate:

1. sign up
2. Gmail connect
3. inbox sync
4. follow-up refresh
5. draft generation
6. founder waitlist flow
