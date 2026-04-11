# Launch Metrics

## Goal

Track the first signals that show whether Followup is turning interest into momentum.

## Current Events

The app now records lightweight launch events for:

- `signup_completed`
- `waitlist_joined`
- `checkout_clicked`

## Current API

- `GET /api/launch/metrics`

This returns:

- signup totals
- waitlist totals
- checkout-click totals
- recent launch events

## Why This Matters

This is the minimum useful layer before a bigger analytics stack:

- you can see whether the landing page is generating demand
- you can see whether pricing is getting clicks
- you can see whether visitors are turning into actual accounts

## Next Step

Once staging is live, compare:

1. landing visitors
2. waitlist joins
3. signup completions
4. checkout clicks
5. paid conversions
