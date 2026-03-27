# V1 Execution Plan

## Step A

This is the concrete first milestone for the repo:

1. Lock the initial niche to freelancers and very small agencies.
2. Focus the problem on missed warm leads in Gmail.
3. Stand up frontend and backend structure.
4. Build auth.
5. Connect Gmail in read-only mode.
6. Detect one unanswered conversation.
7. Suggest one follow-up draft.

## Build Order

### 1. Foundation

- define env vars
- choose database
- scaffold auth, API, and dashboard shells
- add sample data for conversations and follow-ups

### 2. Authentication

- registration
- login
- password hashing
- session or token auth
- validation for duplicates and weak passwords

### 3. Gmail Integration

- OAuth connection flow
- read-only inbox sync
- store only required metadata and message excerpts
- normalize conversations into internal models

### 4. Message Analysis

- identify unanswered inbound conversations
- identify threads with no reply after 24 hours
- attach a human-readable explanation to each flag

### 5. Follow-Up Workflow

- surface flagged items in the dashboard
- allow snooze, ignore, done
- generate short follow-up drafts with tone selection
- store draft history

### 6. Validation

- test auth
- test sync
- test detection logic
- test reminder state changes
- test draft generation fallbacks

## Recommended Technical Direction

Suggested stack for speed:

- frontend: React with Vite and TypeScript
- backend: Node.js with Express and TypeScript
- database: PostgreSQL with Prisma
- auth: session or JWT-based auth
- AI drafting: pluggable service layer

This keeps v1 fast to build and easy to refactor later.

## Definition Of Done For The First Demo

The product is demo-ready when:

- a user can sign up
- connect Gmail
- sync sample or real recent threads
- see at least one flagged unanswered conversation
- open it and generate a suggested follow-up
