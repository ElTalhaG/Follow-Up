# Product Spec

## Product

Followup is an AI follow-up copilot for freelancers and small agencies.

## Target User

Primary user:

- solo freelancers
- small client-service agencies with lightweight sales workflows

Why this segment first:

- they feel the cost of missed replies immediately
- buying decisions are fast
- they often live in email instead of a formal CRM

## Core Problem

Warm leads, client replies, and next steps get buried in email. Users lose revenue because they forget to respond, forget to follow up, or lose track of which conversations matter now.

## V1 Promise

Help users never miss a warm lead in Gmail.

## V1 Scope

Included:

- account signup and login
- Gmail read-only connection
- inbox scan for recent conversations
- detection of unanswered or stalled conversations
- follow-up reminders
- AI-generated draft replies
- a lightweight dashboard with lead status

Explicitly excluded:

- multi-channel messaging
- auto-send
- team collaboration
- full CRM workflows
- advanced analytics

## Primary User Flow

1. User signs up and logs in.
2. User connects Gmail with read-only access.
3. Backend syncs a limited set of recent conversations.
4. Message analysis flags conversations that need attention.
5. Dashboard shows urgent follow-ups with a reason.
6. User opens a conversation and generates a draft.
7. User edits the draft and sends manually.
8. App updates the conversation state and reminder status.

## MVP Success Metric

Primary:

- user finds at least one legitimate missed follow-up in the first session

Supporting:

- time to first flagged conversation
- number of drafts generated
- number of reminders completed
- percent of flagged items marked useful

## Product Principles

- stay narrow
- explain why an item was flagged
- never auto-send in v1
- optimize for calm clarity over CRM complexity
