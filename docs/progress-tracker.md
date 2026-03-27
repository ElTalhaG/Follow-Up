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

- `not started` Create registration logic
- `not started` Create login logic
- `not started` Use secure password hashing
- `not started` Add session handling or token-based auth
- `not started` Validate duplicate emails and weak passwords
- `not started` Test signup and login before building anything else

## Phase 6: Build The Inbox Connection

- `not started` Connect the app to Gmail or Outlook first
- `not started` Start with read-only access
- `not started` Sync recent emails and store only what you need
- `not started` Pull sender, subject, timestamp, and reply status
- `not started` Keep the first integration simple and reliable
- `not started` Confirm the app can detect unanswered messages

## Phase 7: Build Follow-Up Detection

- `not started` Create logic to flag conversations that need attention
- `not started` Define rules like:
- `not started` no reply after 24 hours
- `not started` lead has gone silent
- `not started` message has a question with no answer
- `not started` deal is warm but inactive
- `in progress` Show a list of conversations needing follow-up
- `in progress` Add a “why this was flagged” explanation
- `not started` Let the user manually mark items as done, ignored, or snoozed

## Phase 8: Build AI Drafting

- `not started` Create a follow-up draft generator
- `in progress` Make the draft short, polite, and context-aware
- `not started` Add tone options like:
- `not started` friendly
- `not started` professional
- `not started` direct
- `not started` Let the user edit before sending
- `not started` Keep a history of generated drafts
- `done` Do not auto-send messages in v1

## Phase 9: Build The Main Dashboard

- `in progress` Create a clean dashboard after login
- `in progress` Add sections for:
- `in progress` urgent follow-ups
- `not started` active conversations
- `not started` snoozed items
- `not started` completed items
- `in progress` Show priority levels so the user knows what matters now
- `done` Keep the interface simple and fast
- `done` Make the product feel like a focused assistant, not a complicated CRM

## Phase 10: Add Reminder And Task Logic

- `not started` Let the user set reminders on conversations
- `not started` Add snooze options like:
- `not started` later today
- `not started` tomorrow
- `not started` next week
- `not started` Track task status in the database
- `not started` Notify the user when a follow-up is due
- `not started` Keep the reminder system lightweight and useful

## Phase 11: Improve Message Context

- `not started` Show the original message and the latest activity together
- `not started` Display conversation status:
- `not started` new
- `not started` waiting
- `not started` overdue
- `not started` closed
- `not started` Show basic customer or lead notes
- `not started` Let the user add manual notes to a conversation
- `done` Make it easy to understand why something needs action

## Phase 12: Add Basic Analytics

- `not started` Track simple product metrics:
- `not started` follow-ups suggested
- `not started` follow-ups sent
- `not started` reminders completed
- `not started` response time changes
- `not started` Show a small weekly summary
- `not started` Show which leads are most active
- `done` Keep the analytics basic in v1
- `done` Use the data to prove the product is valuable

## Phase 13: Handle Errors And Edge Cases

- `not started` Handle failed inbox connections gracefully
- `not started` Handle missing permissions
- `not started` Handle duplicate conversations
- `not started` Prevent empty or broken drafts
- `not started` Handle AI failures by falling back to a manual draft
- `not started` Validate all external data before storing it

## Phase 14: Test Everything

- `not started` Test registration and login
- `not started` Test inbox sync
- `not started` Test stalled conversation detection
- `not started` Test follow-up draft generation
- `not started` Test reminder creation and dismissal
- `not started` Test editing and sending a draft
- `not started` Test multiple accounts if supported

## Phase 15: Refactor The Code

- `not started` Separate UI, business logic, and data access
- `not started` Extract integration code into reusable services
- `not started` Keep AI prompting logic isolated
- `not started` Clean up duplicated message-processing code
- `not started` Rename unclear methods and tables

## Phase 16: Final Polish

- `not started` Improve loading states
- `not started` Add better error messages
- `in progress` Make the dashboard feel polished and calm
- `not started` Add onboarding that explains the first connection step
- `not started` Prepare a demo flow that shows the product solving a real pain fast

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
- `not started` Phase 5 onward

## Next Best Move

1. Start Phase 5 authentication.
2. Move into Phase 6 Gmail connection.
3. Replace demo follow-up reads with database-backed queries.
