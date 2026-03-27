# Data Model

## Core Tables

### users

- `id`
- `email`
- `password_hash`
- `full_name`
- `created_at`
- `updated_at`

### accounts

- `id`
- `user_id`
- `provider`
- `provider_account_id`
- `access_scope`
- `connected_at`
- `last_synced_at`

### conversations

- `id`
- `account_id`
- `external_thread_id`
- `subject`
- `contact_name`
- `contact_email`
- `status`
- `last_message_at`
- `last_inbound_at`
- `last_outbound_at`
- `needs_follow_up`
- `follow_up_reason`
- `created_at`
- `updated_at`

### messages

- `id`
- `conversation_id`
- `external_message_id`
- `direction`
- `sender_email`
- `body_excerpt`
- `sent_at`
- `created_at`

### follow_ups

- `id`
- `conversation_id`
- `status`
- `reason`
- `priority`
- `suggested_at`
- `completed_at`

### tasks

- `id`
- `conversation_id`
- `title`
- `status`
- `due_at`
- `created_at`

### reminders

- `id`
- `conversation_id`
- `remind_at`
- `status`
- `created_at`

## Key Relationships

- one user has many accounts
- one account has many conversations
- one conversation has many messages
- one conversation can have many follow-ups
- one conversation can have many reminders

## Suggested Seed Scenario

Create a sample freelancer inbox with:

- one new inbound lead with no reply
- one active conversation waiting on the client
- one overdue follow-up
- one completed lead flow
