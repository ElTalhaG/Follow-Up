# Integrations Module

Current responsibilities:

- Gmail OAuth connect URL generation
- Gmail account connection callback handling
- read-only Gmail thread sync
- provider account normalization
- mock-mode local development without live Google credentials

Current API shape:

- `GET /api/integrations/gmail/connect-url`
- `POST /api/integrations/gmail/callback`
- `GET /api/integrations/gmail/accounts`
- `POST /api/integrations/gmail/sync`
