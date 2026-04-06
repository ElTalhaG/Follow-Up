# Followup

An AI-powered follow-up copilot for freelancers and small businesses.

## V1 Focus

The first version solves one painful workflow:

- connect Gmail
- find unanswered lead conversations
- suggest a follow-up
- let the user edit and send
- track the conversation state

This repo starts with a simple split between `frontend` and `backend` so we can iterate quickly without turning v1 into a full CRM.

## Product Docs

- [docs/product-spec.md](/Users/talha/Developer/Followup/docs/product-spec.md)
- [docs/execution-plan.md](/Users/talha/Developer/Followup/docs/execution-plan.md)
- [docs/data-model.md](/Users/talha/Developer/Followup/docs/data-model.md)
- [docs/progress-tracker.md](/Users/talha/Developer/Followup/docs/progress-tracker.md)
- [docs/road-to-revenue.md](/Users/talha/Developer/Followup/docs/road-to-revenue.md)
- [docs/revenue-progress-tracker.md](/Users/talha/Developer/Followup/docs/revenue-progress-tracker.md)
- [docs/pricing-strategy.md](/Users/talha/Developer/Followup/docs/pricing-strategy.md)
- [docs/stripe-payment-links.md](/Users/talha/Developer/Followup/docs/stripe-payment-links.md)
- [docs/staging-deployment-guide.md](/Users/talha/Developer/Followup/docs/staging-deployment-guide.md)
- [docs/production-env-checklist.md](/Users/talha/Developer/Followup/docs/production-env-checklist.md)
- [docs/privacy-policy.md](/Users/talha/Developer/Followup/docs/privacy-policy.md)
- [docs/terms-of-service.md](/Users/talha/Developer/Followup/docs/terms-of-service.md)
- [docs/data-handling.md](/Users/talha/Developer/Followup/docs/data-handling.md)

## Repo Structure

```text
.
├── backend
│   ├── src
│   │   ├── api
│   │   ├── auth
│   │   ├── database
│   │   ├── follow-up
│   │   ├── integrations
│   │   ├── message-analysis
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── docs
├── frontend
│   ├── src
│   │   ├── app
│   │   ├── components
│   │   ├── features
│   │   ├── lib
│   │   └── styles
│   ├── package.json
│   └── tsconfig.json
└── package.json
```

## Local Development

Install dependencies:

```bash
npm install
```

Then initialize the local database:

```bash
npm --workspace backend run db:generate
npm --workspace backend run db:init
```

Then we can wire up:

```bash
npm run dev:backend
npm run dev:frontend
```

Run tests from the repo root:

```bash
npm test
```

## Gmail Integration

The backend supports a Gmail-first Phase 6 flow with two modes:

- `GMAIL_MOCK_MODE=true` for local development without live Google credentials
- `GMAIL_MOCK_MODE=false` for real Google OAuth + Gmail read-only sync

Required env vars:

```bash
AUTH_SECRET=...
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
PORT=4000
CORS_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=http://localhost:4000/api
VITE_GMAIL_REDIRECT_URI=http://localhost:5173/oauth/google/callback
```

Frontend example env:

```bash
cp frontend/.env.example frontend/.env
```

Backend example env:

```bash
cp backend/.env.example backend/.env
```

## Production Readiness

The repo now includes starter deployment-oriented config:

- [backend/prisma/schema.postgres.prisma](/Users/talha/Developer/Followup/backend/prisma/schema.postgres.prisma) for production Postgres builds
- [backend/prisma/seed.mjs](/Users/talha/Developer/Followup/backend/prisma/seed.mjs) for portable Prisma-based staging seed data
- [backend/Dockerfile](/Users/talha/Developer/Followup/backend/Dockerfile) for containerized backend deploys
- [frontend/vercel.json](/Users/talha/Developer/Followup/frontend/vercel.json) so SPA routes like `/oauth/google/callback` resolve correctly on Vercel
- [render.yaml](/Users/talha/Developer/Followup/render.yaml) as a starter Render deployment template
- [railway.json](/Users/talha/Developer/Followup/railway.json) as a starter Railway deployment template

Useful production commands:

```bash
npm --workspace backend run db:generate:prod
npm --workspace backend run db:push:prod
npm --workspace backend run db:seed:prod
npm --workspace backend run build:prod
```

Current backend Gmail endpoints:

```bash
GET /api/integrations/gmail/connect-url
POST /api/integrations/gmail/callback
GET /api/integrations/gmail/accounts
POST /api/integrations/gmail/sync
```

## Current Product Status

The core MVP build is complete through Phase 16 in [docs/progress-tracker.md](/Users/talha/Developer/Followup/docs/progress-tracker.md).

The next roadmap is now tracked in [docs/road-to-revenue.md](/Users/talha/Developer/Followup/docs/road-to-revenue.md), which covers:

1. production readiness
2. real Gmail OAuth
3. hosted staging
4. trust and operations
5. private beta
6. monetization
7. first revenue

© 2026 Followup. All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the copyright owner, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.
Contact me on Instagram for enqueries = eltalhag
