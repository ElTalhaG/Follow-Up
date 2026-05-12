# Staging Deployment Guide

This guide covers the next real milestone after the current repo state:

- hosted frontend
- hosted backend
- hosted Postgres
- real Gmail OAuth callback validation

## Suggested Stack

- frontend: Vercel
- backend: Railway or Render
- database: Neon Postgres or Supabase Postgres

## Zero-Cost Option

If you want the cheapest viable public demo path, use:

- frontend: `Vercel Hobby`
- backend: `Render Free Web Service`
- database: `Render Free Postgres`

See [docs/zero-cost-staging-guide.md](/Users/talha/Developer/Followup/docs/zero-cost-staging-guide.md).

## 1. Provision Postgres

Create a hosted Postgres database and copy the connection string.

Use that value for:

```bash
DATABASE_URL=postgresql://...
```

Then from the repo root, prepare the production client and push the schema:

```bash
npm install
DATABASE_URL=postgresql://... npm --workspace backend run release:prod
```

If you want staging seed data too:

```bash
DATABASE_URL=postgresql://... SEED_PROD_DATA=true npm --workspace backend run release:prod
```

## 2. Backend Environment

Set these backend env vars in your hosting provider:

```bash
DATABASE_URL=postgresql://...
AUTH_SECRET=replace-this-with-a-long-random-secret
GMAIL_CLIENT_ID=your-google-client-id
GMAIL_CLIENT_SECRET=your-google-client-secret
GMAIL_MOCK_MODE=false
PORT=4000
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

If you are using a Render external Postgres URL and it does not already include `sslmode=require`, the backend boot flow now adds that automatically.

You can start from:

```bash
backend/.env.staging.example
```

For staging, the repo now defaults to:

```bash
RUN_RELEASE_ON_BOOT=true
```

That lets the backend run the Postgres release flow on boot before starting the server.
The boot-time flow is intentionally lean and does not regenerate Prisma unless you explicitly set:

```bash
FORCE_PRISMA_GENERATE_ON_RELEASE=true
```

## 3. Frontend Environment

Set these frontend env vars in Vercel:

```bash
VITE_API_BASE_URL=https://your-backend-domain.example.com/api
VITE_GMAIL_REDIRECT_URI=https://your-frontend-domain.vercel.app/oauth/google/callback
```

You can start from:

```bash
frontend/.env.staging.example
```

## 4. Google OAuth Setup

In Google Cloud:

- create an OAuth client
- configure the consent screen
- add your staging callback URL

Authorized redirect URI:

```bash
https://your-frontend-domain.vercel.app/oauth/google/callback
```

## 5. Deploy Backend

The repo includes:

- [backend/Dockerfile](/Users/talha/Developer/Followup/backend/Dockerfile)
- [backend/prisma/schema.postgres.prisma](/Users/talha/Developer/Followup/backend/prisma/schema.postgres.prisma)
- [backend/prisma/seed.mjs](/Users/talha/Developer/Followup/backend/prisma/seed.mjs)
- [render.yaml](/Users/talha/Developer/Followup/render.yaml)
- [railway.json](/Users/talha/Developer/Followup/railway.json)

Recommended deploy sequence:

1. connect the repo to Railway or Render
2. set the backend env vars
3. run the production release flow against Postgres
4. build with the backend production build command
5. start with:

```bash
npm --workspace backend run start:prod
```

## 6. Deploy Frontend

The repo includes [frontend/vercel.json](/Users/talha/Developer/Followup/frontend/vercel.json) so SPA routes like `/oauth/google/callback` resolve to the app correctly.

Recommended deploy sequence:

1. connect the repo to Vercel
2. set the frontend env vars
3. build normally
4. open the deployed app and verify the callback route renders

## 7. Staging Validation Checklist

Run this exact flow against staging:

1. sign up
2. log in
3. connect Gmail
4. return from Google to `/oauth/google/callback`
5. confirm inbox account is attached
6. sync inbox
7. refresh follow-ups
8. generate draft
9. save draft edit
10. snooze or mark done
11. confirm analytics still render

## 8. Success Criteria

Staging is ready when:

- frontend is public
- backend is public
- Postgres is live
- Gmail OAuth works on the hosted domain
- the full workflow works without any local machine dependency
