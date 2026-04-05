# Privacy Policy

Last updated: April 5, 2026

## Overview

Followup is an email follow-up assistant for freelancers and small businesses.

This policy explains what data the product may process and how that data should be handled as the product moves from development to production.

## Data We Process

Depending on the connected features, Followup may process:

- account information such as name and email address
- connected Gmail account metadata
- email thread metadata such as subject, sender, and timestamps
- short message excerpts used for follow-up detection and drafting
- reminders, tasks, notes, and analytics derived from those conversations

## Why The Data Is Used

The product uses this data to:

- identify stalled or unanswered conversations
- generate follow-up draft suggestions
- show reminders and lightweight pipeline status
- measure product value such as reply timing and completed follow-ups

## What Should Not Be Collected Unnecessarily

The product should avoid collecting more information than required for the workflow.

The intended operating principle is:

- store only the data needed to power follow-up detection and drafting
- avoid storing full mailbox contents when excerpts or metadata are enough
- avoid using customer email content for unrelated marketing or profiling

## Data Handling Expectations

As the hosted product is deployed, the service should:

- protect credentials and tokens with secure secret storage
- limit production access to stored email-related data
- use HTTPS in hosted environments
- use a managed database with backups and access controls
- log operational events without dumping sensitive message bodies into logs

## Third-Party Services

Depending on deployment choices, Followup may rely on third-party providers such as:

- Google for Gmail OAuth and API access
- a hosting provider for the frontend or backend
- a managed database provider
- a payment provider once billing is added

## User Rights

When the hosted product is live, users should be able to:

- disconnect their Gmail account
- request deletion of their account data
- understand what information is stored and why

## Development Status

This repo is currently evolving from MVP to hosted staging.

Before public beta, this policy should be reviewed and finalized with the actual production data flows, providers, and retention rules in place.
