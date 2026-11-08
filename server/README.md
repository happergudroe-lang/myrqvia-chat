# MYRQVIA email auth server

Zero-dependency Node.js server for **real email verification codes**.

It implements the contract already used by `js/auth-service.js`:

- `POST /api/auth/email/start`
- `POST /api/auth/email/verify`
- `GET  /api/auth/username?value=...`
- `POST /api/auth/register`
- `POST /api/auth/recovery/start`
- `POST /api/auth/recovery/verify`
- `POST /api/auth/recovery/password`
- `GET  /api/auth/session`
- `POST /api/auth/logout`
- `GET  /api/presence/stream?keys=username1,username2` — authenticated SSE
- `GET  /api/health`

Presence is **not** seeded. A username is online only while it has at least one
authenticated SSE stream open. When the last stream closes, the server writes a
real `lastSeenAt` and broadcasts it. No fake timestamps are generated.

It also serves the frontend, so `/login` and `/api` are same-origin.

---

## 1. Quick start

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
AUTH_SECRET=<openssl rand -hex 32>
EMAIL_PROVIDER=console
```

Run:

```bash
node server.mjs
```

Open:

```text
http://localhost:8787/login
```

With `EMAIL_PROVIDER=console`, the 6-digit code is printed in the server terminal:

```text
[MYRQVIA email] to=you@example.com purpose=login code=482913
```

That is **development only**. The frontend no longer shows `246810` in remote mode.

---

## 2. Real email with Gmail

Gmail works from networks where port 587 is open. This project does **not**
require a VPN for Gmail SMTP on 587.

### 2.1 Create a Google App Password

1. Turn on **2-Step Verification** for the Google account.
2. Open <https://myaccount.google.com/apppasswords>.
3. Create an app password named `MYRQVIA`.
4. Copy the 16-character password. **Do not use the normal Google password.**

### 2.2 Configure

```env
EMAIL_PROVIDER=gmail
GMAIL_USER=your-account@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
GMAIL_SMTP_HOST=smtp.gmail.com
GMAIL_SMTP_PORT=587
```

`EMAIL_FROM` defaults to `MYRQVIA <GMAIL_USER>`. Restart after editing `.env`.

The code is sent as a multipart text/HTML email through Gmail SMTP with
STARTTLS and AUTH LOGIN. The server never logs the app password.

If port 465 is blocked on your network, keep `GMAIL_SMTP_PORT=587`. If 587 is
also blocked, use Resend or a webhook instead.

---

## 3. Real email with Resend

1. Create a Resend account and verify a sending domain.
2. Create an API key.
3. Put this in `server/.env`:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=MYRQVIA <login@your-verified-domain.com>
```

Restart the server.

The server sends the code through `https://api.resend.com/emails`. No SDK, no npm install.

---

## 4. Real email through your own mail service

If you already have an SMTP worker or transactional email service:

```env
EMAIL_PROVIDER=webhook
EMAIL_WEBHOOK_URL=https://mail.example.com/send
EMAIL_WEBHOOK_TOKEN=optional-bearer-token
```

The server POSTs:

```json
{
  "to": "user@example.com",
  "subject": "Your MYRQVIA verification code: 123456",
  "text": "…",
  "html": "…"
}
```

Your webhook must send the message and return HTTP 2xx.

---

## 5. Production notes

- Set `NODE_ENV=production` and a long `AUTH_SECRET`.
- Put the service behind HTTPS.
- Set `TRUST_PROXY=true` **only** behind a trusted reverse proxy.
- Use `ALLOWED_ORIGINS=https://your-frontend.example.com` if the frontend is hosted separately.
- Persist `server/data` on a volume. The included store is a single-process JSON store — move to PostgreSQL/Redis for multi-instance.
- Set a real `EMAIL_FROM` on a verified domain.
- The API never returns the code in production.

### Data

`server/data/myrqvia-auth.json` stores:

- users (`email`, `displayName`, `username`, `passwordHash` for recovery only)
- unique lowercase usernames
- hashed email codes
- sessions
- reset tokens

Codes are stored as HMAC-SHA256 hashes, never plain text. Codes expire in 10 minutes, resend is limited to 60 seconds, and there are 5 attempts and 5 sends per hour.

---

## 6. Frontend modes

`js/config.js`:

- Served over HTTP → `authMode: 'remote'` (real API, same origin).
- Opened as `file://` → local demo automatically.
- Add `?demo=1` to force local demo.

For separate hosting:

```js
authApiBase: 'https://auth.example.com',
authMode: 'remote'
```

and set `ALLOWED_ORIGINS` on the server.

---

## 7. What is still not included

This server only handles **email-code auth and account profile creation**.

It does **not** implement:

- real-time chat WebSocket
- message persistence
- media uploads
- MYRQVIA CORE 1.0 agent calls
- password login (recovery password is stored hashed; login remains email-code)

Those need the rest of the backend described in `docs/backend-handoff.md`.
