# Revenue Progress Tracker

## Legend

- `done`: completed
- `in progress`: partly completed
- `not started`: not implemented yet

## Phase R1: Production Readiness

- `in progress` switch the production database to PostgreSQL
- `done` keep SQLite only for local development if helpful
- `done` define production env vars cleanly
- `in progress` confirm Prisma works against Postgres
- `in progress` prepare deployment configuration for frontend and backend
- `in progress` verify secrets handling and environment separation
- `done` update README with real setup instructions

## Phase R2: Real Gmail OAuth

- `not started` create and configure the Google Cloud project
- `not started` set up OAuth consent screen
- `not started` configure staging and production redirect URIs
- `done` implement real browser callback handling in the frontend
- `in progress` validate permission-denied and expired-token flows
- `not started` test Gmail sync using a real account

## Phase R3: Hosted Staging

- `not started` deploy frontend
- `not started` deploy backend
- `not started` connect hosted database
- `not started` set staging env vars
- `not started` test sign up, login, connect Gmail, sync, detect, draft, reminder
- `not started` add basic error logging and uptime checks

## Phase R4: Trust And Operations

- `not started` add privacy policy
- `not started` add terms of service
- `not started` clearly explain what email data is stored
- `not started` add basic rate limiting
- `not started` add structured backend logging
- `not started` add error monitoring
- `not started` review token storage and secret handling

## Phase R5: Beta Launch

- `not started` onboard 5 to 10 real users manually
- `not started` use one niche first
- `not started` watch real usage closely
- `not started` collect every friction point in setup and activation
- `not started` improve onboarding based on actual user confusion

## Phase R6: Monetization

- `not started` integrate Stripe
- `not started` create a simple pricing page
- `not started` decide on one plan for solo users and one for tiny teams
- `not started` add trial or founding-user pricing
- `not started` gate premium usage lightly if needed

## Phase R7: First Revenue Engine

- `not started` write a simple landing page
- `not started` show the core promise clearly
- `not started` create outreach scripts for freelancers and agencies
- `not started` run direct outreach manually
- `not started` add simple email capture or waitlist if needed
- `not started` track activation and paid conversion

## Phase R8: Expand The Wedge

- `not started` industry-specific templates
- `not started` Zapier or webhook integrations
- `not started` mobile notifications
- `not started` team inbox features

## Overall Status

- `in progress` Phase R1
- `in progress` Phase R2
- `not started` Phase R3
- `not started` Phase R4
- `not started` Phase R5
- `not started` Phase R6
- `not started` Phase R7
- `not started` Phase R8

## Next Best Move

1. Provision a hosted Postgres database and run the production schema against it.
2. Deploy staging frontend and backend with the new callback routing and backend runtime config.
3. Connect a real Google OAuth app and test the hosted Gmail flow end to end.
