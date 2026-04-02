# Progress Tracker

## Legend

- `done`: completed
- `in progress`: partly completed
- `not started`: not implemented yet

## Phase 1: Define The Core Problem

- `done` Decide the first version only focuses on:
- `done` Unanswered leads
- `done` Follow-up reminders
- `done` Drafting replies
- `done` Simple lead tracking
- `done` Basic inbox organization
- `done` Write the main user flow:
- `done` User connects email
- `done` App scans recent conversations
- `done` App detects stalled or unanswered messages
- `done` App suggests follow-up actions
- `done` User sends or edits the draft
- `done` App tracks what happened next
- `done` Freeze the scope for v1 so you do not try to build a full CRM too early

## Phase 2: Choose The First User

- `done` Pick one target user group only
- `done` Freelancers
- `done` Small agencies
- `done` Pick the one group with the clearest pain and fastest buying decision
- `in progress` Write down their top 3 daily problems
- `done` Make sure your product solves one painful workflow, not ten small ones

## Phase 3: Prepare The Project Structure

- `done` Create two main parts:
- `done` `backend`
- `done` `frontend`
- `done` Organize the backend clearly:
- `done` `auth`
- `done` `integrations`
- `done` `message-analysis`
- `done` `follow-up`
- `done` `database`
- `done` `api`
- `done` Choose a stack that supports fast iteration:
- `done` Backend API
- `done` Database direction chosen
- `done` Email integration direction chosen
- `done` Web frontend chosen
- `done` Set up the database and confirm the app can run locally

## Phase 4: Design The Database

- `done` Create the database for the product
- `done` Create the main tables:
- `done` `users`
- `done` `accounts`
- `done` `conversations`
- `done` `messages`
- `done` `follow_ups`
- `done` `tasks`
- `done` `reminders`
- `done` Define relationships carefully
- `done` One user can have many connected accounts
- `done` One account can have many conversations
- `done` One conversation can have many messages
- `done` One message can generate many follow-up suggestions
- `done` Add a few sample records so you can test without waiting for real user data

## Phase 5: Build Authentication

- `done` Create registration logic
- `done` Create login logic
- `done` Use secure password hashing
- `done` Add session handling or token-based auth
- `done` Validate duplicate emails and weak passwords
- `done` Test signup and login before building anything else

## Phase 6: Build The Inbox Connection

- `done` Connect the app to Gmail or Outlook first
- `done` Start with read-only access
- `done` Sync recent emails and store only what you need
- `done` Pull sender, subject, timestamp, and reply status
- `done` Keep the first integration simple and reliable
- `done` Confirm the app can detect unanswered messages

## Phase 7: Build Follow-Up Detection

- `done` Create logic to flag conversations that need attention
- `done` Define rules like:
- `done` no reply after 24 hours
- `done` lead has gone silent
- `done` message has a question with no answer
- `done` deal is warm but inactive
- `done` Show a list of conversations needing follow-up
- `done` Add a “why this was flagged” explanation
- `done` Let the user manually mark items as done, ignored, or snoozed

## Phase 8: Build AI Drafting

- `done` Create a follow-up draft generator
- `done` Make the draft short, polite, and context-aware
- `done` Add tone options like:
- `done` friendly
- `done` professional
- `done` direct
- `done` Let the user edit before sending
- `done` Keep a history of generated drafts
- `done` Do not auto-send messages in v1

## Phase 9: Build The Main Dashboard

- `done` Create a clean dashboard after login
- `done` Add sections for:
- `done` urgent follow-ups
- `done` active conversations
- `done` snoozed items
- `done` completed items
- `done` Show priority levels so the user knows what matters now
- `done` Keep the interface simple and fast
- `done` Make the product feel like a focused assistant, not a complicated CRM

## Phase 10: Add Reminder And Task Logic

- `done` Let the user set reminders on conversations
- `done` Add snooze options like:
- `done` later today
- `done` tomorrow
- `done` next week
- `done` Track task status in the database
- `done` Notify the user when a follow-up is due
- `done` Keep the reminder system lightweight and useful

## Phase 11: Improve Message Context

- `done` Show the original message and the latest activity together
- `done` Display conversation status:
- `done` new
- `done` waiting
- `done` overdue
- `done` closed
- `done` Show basic customer or lead notes
- `done` Let the user add manual notes to a conversation
- `done` Make it easy to understand why something needs action

## Phase 12: Add Basic Analytics

- `done` Track simple product metrics:
- `done` follow-ups suggested
- `done` follow-ups sent
- `done` reminders completed
- `done` response time changes
- `done` Show a small weekly summary
- `done` Show which leads are most active
- `done` Keep the analytics basic in v1
- `done` Use the data to prove the product is valuable

## Phase 13: Handle Errors And Edge Cases

- `done` Handle failed inbox connections gracefully
- `done` Handle missing permissions
- `done` Handle duplicate conversations
- `done` Prevent empty or broken drafts
- `done` Handle AI failures by falling back to a manual draft
- `done` Validate all external data before storing it

## Phase 14: Test Everything

- `done` Test registration and login
- `done` Test inbox sync
- `done` Test stalled conversation detection
- `done` Test follow-up draft generation
- `done` Test reminder creation and dismissal
- `done` Test editing and sending a draft
- `done` Test multiple accounts if supported

## Phase 15: Refactor The Code

- `done` Separate UI, business logic, and data access
- `done` Extract integration code into reusable services
- `done` Keep AI prompting logic isolated
- `done` Clean up duplicated message-processing code
- `done` Rename unclear methods and tables

## Phase 16: Final Polish

- `done` Improve loading states
- `done` Add better error messages
- `done` Make the dashboard feel polished and calm
- `done` Add onboarding that explains the first connection step
- `done` Prepare a demo flow that shows the product solving a real pain fast

## Phase 17: Optional v2 Features

- `not started` Calendar integration
- `not started` CRM export
- `not started` Team inbox
- `not started` Multi-user collaboration
- `not started` Sentiment detection
- `not started` Auto-priority scoring
- `not started` Templates for different industries
- `not started` Mobile notifications
- `not started` Webhooks and Zapier support

## Overall Status

- `done` Phase 1
- `done` Phase 2
- `done` Phase 3
- `done` Phase 4
- `done` Phase 5
- `done` Phase 6
- `done` Phase 7
- `done` Phase 8
- `done` Phase 9
- `done` Phase 10
- `done` Phase 11
- `done` Phase 12
- `done` Phase 13
- `done` Phase 14
- `done` Phase 15
- `done` Phase 16
- `not started` Phase 17 onward

## Next Best Move

1. Stand up hosted staging with Postgres using the new production schema and deployment config.
2. Validate real Gmail OAuth against a live Google app and hosted callback URL.
3. Add Stripe and private beta onboarding once staging is stable.
