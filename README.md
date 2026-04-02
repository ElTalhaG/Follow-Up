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

Dependencies are not installed yet. After we agree on the stack, the next step is:

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

## Gmail Integration

The backend supports a Gmail-first Phase 6 flow with two modes:

- `GMAIL_MOCK_MODE=true` for local development without live Google credentials
- `GMAIL_MOCK_MODE=false` for real Google OAuth + Gmail read-only sync

Required env vars:

```bash
AUTH_SECRET=...
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
VITE_API_BASE_URL=http://localhost:4000/api
```

Current backend Gmail endpoints:

```bash
GET /api/integrations/gmail/connect-url
POST /api/integrations/gmail/callback
GET /api/integrations/gmail/accounts
POST /api/integrations/gmail/sync
```

## Recommended Next Build Steps

1. Lock the target user to freelancers and small agencies.
2. Implement auth in the backend.
3. Add Gmail read-only integration.
4. Detect conversations with no reply after 24 hours.
5. Show flagged conversations in the dashboard.
6. Generate one editable follow-up draft per flagged conversation.

© 2026 Followup. All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the copyright owner, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.
Contact me on Instagram for enqueries = eltalhag
