# Production Env Checklist

Use this before deploying staging or production.

## Backend

Required in all environments:

```bash
DATABASE_URL=
AUTH_SECRET=
```

Required when Gmail is live:

```bash
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_MOCK_MODE=false
```

Required in production:

```bash
CORS_ORIGIN=https://your-frontend-domain.vercel.app
PORT=4000
```

## Frontend

Required:

```bash
VITE_API_BASE_URL=https://your-backend-domain.example.com/api
VITE_GMAIL_REDIRECT_URI=https://your-frontend-domain.vercel.app/oauth/google/callback
```

## Sanity Checks

Before deploy:

```bash
npm --workspace backend run db:validate:prod
npm --workspace backend run build
npm --workspace frontend run build
npm test
```

`db:validate:prod` is a schema preflight check. It uses your real `DATABASE_URL` when present, and otherwise falls back to a local Postgres-shaped placeholder URL so the schema can still be validated before staging is wired.

After deploy:

1. open `/health` on the backend
2. confirm `databaseProvider` is `postgresql`
3. confirm `gmailMode` is `live`
4. confirm `hasCorsOrigin` is `true`
5. run the Gmail connect flow from the hosted frontend
