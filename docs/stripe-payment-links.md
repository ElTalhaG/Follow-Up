# Stripe Payment Links Setup

## Why This Step First

Stripe Payment Links are the fastest path from pricing UI to real checkout.

They let Followup:

- launch paid checkout without a full subscription backend yet
- test whether people will actually click through and pay
- keep the implementation simple while staging and OAuth are still being finalized

## What To Create In Stripe

Create two payment links:

1. `Solo` at `$19/month`
2. `Studio` at `$49/month`

If you want to keep beta friction low, pair those with a `14-day free trial` inside Stripe.

## Env Vars

Add these in your backend environment:

```bash
STRIPE_PAYMENT_LINK_MODE="live"
STRIPE_SOLO_PAYMENT_LINK="https://buy.stripe.com/..."
STRIPE_STUDIO_PAYMENT_LINK="https://buy.stripe.com/..."
TRIAL_DAYS="14"
```

If the links are missing, Followup falls back to placeholder checkout URLs so local development still works.

## Current Product Behavior

The backend now exposes:

- `GET /api/billing/plans`
- `POST /api/billing/checkout-link`

The frontend pricing cards use those endpoints to open the correct checkout link for the chosen plan.

## What This Does Not Do Yet

This step does not yet:

- provision full Stripe customer records
- handle webhook-based subscription lifecycle events
- gate premium features based on billing state

Those can come after staging is live and real users are starting to test checkout.
