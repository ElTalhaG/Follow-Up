# Data Handling Notes

This document explains the intended data posture for Followup as it moves toward hosted staging and public beta.

## Current Product Data

The app currently stores:

- user identity data
- connected account metadata
- normalized conversations
- message excerpts
- generated follow-up drafts
- reminders and tasks
- conversation notes
- simple analytics

## Intended Storage Principle

Store the minimum useful data needed to:

- detect missed follow-ups
- explain why an item was flagged
- generate an editable draft
- let the user manage reminders and notes

## Sensitive Areas

The most sensitive parts of the system are:

- Gmail access tokens and refresh tokens
- email excerpts from user conversations
- manually added lead notes

## Logging Guidance

Operational logs should include:

- request timing
- route information
- status codes
- environment and runtime state

Operational logs should avoid:

- full email content
- draft bodies
- access tokens
- refresh tokens
- secret values

## Production Checklist

Before public beta:

1. confirm token storage approach
2. confirm database access controls
3. confirm deletion path for user data
4. confirm backup and restore plan
5. confirm logs do not leak message content

## Recommendation

As staging becomes production-like, treat Followup as a product handling private customer communications and tighten operations accordingly.
