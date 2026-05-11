# Local Staging Rehearsal

Use this when you want to run the backend in a production-like shape with Postgres before deploying to a hosted staging URL.

## What This Uses

- [docker-compose.staging.yml](/Users/talha/Developer/Followup/docker-compose.staging.yml)
- [backend/Dockerfile](/Users/talha/Developer/Followup/backend/Dockerfile)
- Postgres 16
- backend production build
- Gmail mock mode

## Start The Stack

From the repo root:

```bash
docker compose -f docker-compose.staging.yml up --build
```

This starts:

- `postgres` on `localhost:5432`
- `backend` on `http://localhost:4000`

## Prepare The Database

In another terminal, run:

```bash
DATABASE_URL=postgresql://followup:followup@localhost:5432/followup npm --workspace backend run db:push:prod
DATABASE_URL=postgresql://followup:followup@localhost:5432/followup npm --workspace backend run db:seed:prod
```

## Smoke Test The Backend

Then run:

```bash
STAGING_API_BASE_URL=http://localhost:4000/api npm run smoke:staging
```

## Why This Helps

This catches production-shape issues earlier, especially around:

- Postgres connectivity
- backend Docker build assumptions
- runtime env validation
- core API availability

## Suggested Next Step

Once the local rehearsal passes, move to the hosted flow in [docs/staging-deployment-guide.md](/Users/talha/Developer/Followup/docs/staging-deployment-guide.md).
