# Sensitive Content Policy

## Never Push These

These should stay local or live only in your deployment provider:

- real `.env` files
- API keys and OAuth secrets
- real `DATABASE_URL` values
- `AUTH_SECRET`
- Gmail OAuth credentials
- Stripe secret values and private webhook secrets
- local database files like `*.db`, `*.sqlite`, `*.sqlite3`
- private keys and cert files like `*.pem`, `*.key`, `*.p12`, `*.crt`, `*.csr`
- logs, temp files, and local debug output

## Safe To Push

These are fine to keep public as long as they only contain placeholders:

- `.env.example` files
- setup docs with fake example values
- source code
- product docs

## Current Repo Rule

For this repo, anything that contains a real credential, local user data, or private infrastructure detail should be treated as `never push`.

Examples:

- `backend/.env`
- any future `frontend/.env`
- any production secret copied into docs by mistake
- any local database snapshot with real user or test lead data

## Before Every Push

Quick check:

1. no `.env` file is staged
2. no `.db` or sqlite file is staged
3. no secret-looking token or private key is staged
4. no logs or temp files are staged

## Current Audit Result

As of this audit, the public repo does **not** appear to contain:

- committed real `.env` files
- committed local databases
- committed build output
- committed node modules
- obvious live API keys or private keys

The public repo does contain code and architecture, so if you ever want the implementation itself to be private, the whole GitHub repo must be switched to private.
