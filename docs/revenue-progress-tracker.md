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
- `in progress` connect hosted database
- `in progress` set staging env vars
- `not started` test sign up, login, connect Gmail, sync, detect, draft, reminder
- `not started` add basic error logging and uptime checks

## Phase R4: Trust And Operations

- `done` add privacy policy
- `done` add terms of service
- `done` clearly explain what email data is stored
- `done` add basic rate limiting
- `done` add structured backend logging
- `not started` add error monitoring
- `in progress` review token storage and secret handling

## Phase R5: Beta Launch

- `not started` onboard 5 to 10 real users manually
- `not started` use one niche first
- `in progress` watch real usage closely
- `in progress` collect every friction point in setup and activation
- `in progress` improve onboarding based on actual user confusion
- `done` surface the founder queue by urgency so daily outreach work is obvious
- `done` show the latest outreach touch on each founder lead
- `done` show a short recent outreach timeline on each founder lead
- `done` show conversion-speed context like days in queue and time to first touch
- `done` flag founder leads that are stuck without a first touch
- `done` provide a ready-to-send nudge for founder leads that are stuck
- `done` show action-log summary counts like touched today and untouched this week
- `done` turn founder queue signals into a short suggested task list for today
- `done` add one-click actions to process suggested founder tasks
- `done` show a compact founder progress feed for actions completed today

## Phase R6: Monetization

- `in progress` integrate Stripe
- `in progress` create a simple pricing page
- `done` decide on one plan for solo users and one for tiny teams
- `in progress` add trial or founding-user pricing
- `not started` gate premium usage lightly if needed

## Phase R7: First Revenue Engine

- `in progress` write a simple landing page
- `done` show the core promise clearly
- `done` create outreach scripts for freelancers and agencies
- `not started` run direct outreach manually
- `in progress` add simple email capture or waitlist if needed
- `in progress` track activation and paid conversion

## Phase R8: Expand The Wedge

- `not started` industry-specific templates
- `not started` Zapier or webhook integrations
- `not started` mobile notifications
- `not started` team inbox features

## Overall Status

- `in progress` Phase R1
- `in progress` Phase R2
- `not started` Phase R3
- `in progress` Phase R4
- `not started` Phase R5
- `in progress` Phase R6
- `in progress` Phase R7
- `not started` Phase R8

## Next Best Move

1. Provision a hosted Postgres database and run the production schema against it.
2. Deploy staging frontend and backend with the new callback routing, rate limiting, and runtime config.
3. Connect a real Google OAuth app and test the hosted Gmail flow end to end.
4. Add Stripe checkout so the new pricing layer can become a real paid flow.
