# Zero-Cost Staging Guide

This guide is the practical path if you want a public staging environment without paying upfront.

## Recommended Zero-Cost Stack

- frontend: `Render Static Site`
- backend: `Render Free Web Service`
- database: `Render Free Postgres`

This is not a forever-production setup, but it is enough to get:

- a live frontend URL
- a live backend URL
- a hosted Postgres database
- a full mock-mode demo flow

## Why This Stack

It matches the current repo well:

- the frontend is already Render Static Site friendly
- the backend already has a Dockerfile
- the repo already includes `render.yaml`
- Render offers free web services and free Postgres for testing and hobby use

## Zero-Cost Constraints

Expect these limitations on free services:

- cold starts or spin-down on idle
- lower performance
- temporary limits on bandwidth or monthly usage
- not suitable for real production traffic

That is acceptable for our current goal:

- public demo
- staging verification
- founder walkthroughs
- non-paid testing

## Deployment Order

1. Create a free Render Postgres database.
2. Create a free Render backend web service from this repo.
3. Set backend env vars from [backend/.env.staging.example](/Users/talha/Developer/Followup/backend/.env.staging.example).
4. Create a free Render Static Site from this repo.
5. Set frontend env vars from [frontend/.env.staging.example](/Users/talha/Developer/Followup/frontend/.env.staging.example).
6. Keep `GMAIL_MOCK_MODE=true` for the first hosted demo.
7. Run the smoke test against the hosted backend.

## First Hosted Goal

The first no-cost milestone is not real Gmail OAuth yet.

It is:

- frontend loads publicly
- backend responds publicly
- Postgres works
- mock onboarding works
- founder queue works
- follow-up demo flow works

## After That

Once the free staging version is stable, the next optional upgrade is:

1. real Gmail OAuth
2. real Stripe links
3. better uptime and less cold-start behavior
