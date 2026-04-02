# Road To Revenue

This document picks up after the current MVP build.

As of this repo state, Followup has:

- auth
- Gmail integration with mock mode
- follow-up detection
- AI draft generation
- reminders and task tracking
- analytics
- onboarding and demo flow
- backend workflow tests

What it does not have yet is the full path from local product to paid startup.

That path is below.

## Core Goal

Move from:

- a polished local MVP

To:

- a hosted product
- with real Gmail connections
- used by real freelancers or small agencies
- with at least a few paying customers

## Phase R1: Production Readiness

The first revenue roadmap phase is production readiness.

### Objectives

- replace local-only assumptions
- prepare the app for real hosting
- make the system reliable enough for external users

### Work

- switch the production database to PostgreSQL
- keep SQLite only for local development if helpful
- define production env vars cleanly
- confirm Prisma works against Postgres
- prepare deployment configuration for frontend and backend
- verify secrets handling and environment separation
- update README with real setup instructions

### Definition Of Done

- app can run locally and in a hosted staging environment
- database is no longer tied to local SQLite for production
- one deployable configuration exists for frontend and backend

## Phase R2: Real Gmail OAuth

This is the most important product gap before real users.

### Objectives

- make Gmail connection work end to end in production
- remove the dependency on mock mode for actual users

### Work

- create and configure the Google Cloud project
- set up OAuth consent screen
- configure staging and production redirect URIs
- implement real browser callback handling in the frontend
- validate permission-denied and expired-token flows
- test Gmail sync using a real account

### Definition Of Done

- a user can connect Gmail from the hosted app
- the app can sync recent threads from a real inbox
- reconnect and permission errors are understandable

## Phase R3: Hosted Staging

Before charging money, the app should work from a public URL.

### Objectives

- create a real staging environment
- prove the full product flow outside your laptop

### Suggested Stack

- frontend: Vercel
- backend: Railway or Render
- database: Neon Postgres or Supabase Postgres

### Work

- deploy frontend
- deploy backend
- connect hosted database
- set staging env vars
- test sign up, login, connect Gmail, sync, detect, draft, reminder
- add basic error logging and uptime checks

### Definition Of Done

- staging URL works end to end
- a user can use the product without your terminal being involved

## Phase R4: Trust And Operations

Once real inboxes are involved, trust matters.

### Objectives

- reduce risk for early users
- make the product safer to adopt

### Work

- add privacy policy
- add terms of service
- clearly explain what email data is stored
- add basic rate limiting
- add structured backend logging
- add error monitoring
- review token storage and secret handling

### Definition Of Done

- the product is not just functional, but credible
- you can explain data handling clearly to beta users

## Phase R5: Beta Launch

Do not try to launch broadly. Start narrow.

### Target User

- freelancers
- very small agencies

### Objectives

- get real usage
- confirm the product creates obvious value

### Work

- onboard 5 to 10 real users manually
- use one niche first
- watch real usage closely
- collect every friction point in setup and activation
- improve onboarding based on actual user confusion

### Activation Metric

A user is activated if they:

- sign up
- connect Gmail
- sync inbox
- see at least one useful flagged follow-up

### Definition Of Done

- at least 5 real users complete the activation flow
- at least 3 of them say the product surfaced something genuinely useful

## Phase R6: Monetization

Only charge after users can reliably get value.

### Objectives

- prove willingness to pay
- start collecting revenue early

### Work

- integrate Stripe
- create a simple pricing page
- decide on one plan for solo users and one for tiny teams
- add trial or founding-user pricing
- gate premium usage lightly if needed

### Suggested Starting Pricing

- solo: $19 to $29 per month
- agency: $49 to $79 per month

### Definition Of Done

- users can subscribe without manual invoicing
- first paying customer is acquired

## Phase R7: First Revenue Engine

This is where the product starts behaving like a startup.

### Objectives

- create repeatable early customer acquisition
- improve conversion from trial to paid

### Work

- write a simple landing page
- show the core promise clearly
- create outreach scripts for freelancers and agencies
- run direct outreach manually
- add simple email capture or waitlist if needed
- track activation and paid conversion

### Metrics To Watch

- signups
- Gmail connects
- first sync completion
- first useful follow-up detected
- draft generation usage
- weekly retention
- paid conversion

### Definition Of Done

- you can explain where the first 20 customers will come from
- at least 2 to 5 customers are paying

## Phase R8: Expand The Wedge

Only after the core workflow is trusted and monetized.

### Best Expansion Candidates

- industry-specific templates
- Zapier or webhook integrations
- mobile notifications
- team inbox features

### Recommendation

The strongest next wedge is probably:

1. industry templates
2. Zapier or webhooks
3. mobile notifications

Industry templates are the easiest way to sharpen value for a niche.

## What Not To Do Yet

- do not build a full CRM
- do not support too many channels at once
- do not add team collaboration before solo value is strong
- do not chase broad “AI assistant” positioning
- do not postpone charging until everything feels perfect

## Practical Order

If we want the fastest path from here to money, this is the order to follow:

1. production database and deployment setup
2. real Gmail OAuth in the frontend
3. hosted staging environment
4. trust, logging, and legal basics
5. private beta with 5 to 10 users
6. Stripe and pricing
7. first paid users
8. wedge expansion based on real feedback

## Near-Term Mission

The immediate mission is simple:

- get the app off the local machine
- let a real user connect Gmail
- help them find one missed lead
- convert that value into the first payment
