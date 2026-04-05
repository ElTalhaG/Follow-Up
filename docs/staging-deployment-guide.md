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

## 1. Provision Postgres

Create a hosted Postgres database and copy the connection string.

Use that value for:

```bash
DATABASE_URL=postgresql://...
```

Then from the repo root, prepare the production client and push the schema:

```bash
npm install
npm --workspace backend run db:generate:prod
npm --workspace backend run db:push:prod
npm --workspace backend run db:seed:prod
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

## 3. Frontend Environment

Set these frontend env vars in Vercel:

```bash
VITE_API_BASE_URL=https://your-backend-domain.example.com/api
VITE_GMAIL_REDIRECT_URI=https://your-frontend-domain.vercel.app/oauth/google/callback
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
3. build with the backend production build command
4. start with:

```bash
npm --workspace backend run start
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
