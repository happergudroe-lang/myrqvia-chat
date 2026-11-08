/**
 * MYRQVIA Chat — zero-dependency email-code authentication server.
 *
 *   node server/server.mjs
 *
 * Same-origin API:
 *   POST /api/auth/email/start
 *   POST /api/auth/email/verify
 *   GET  /api/auth/username?value=...
 *   POST /api/auth/register
 *   POST /api/auth/recovery/start
 *   POST /api/auth/recovery/verify
 *   POST /api/auth/recovery/password
 *   GET  /api/auth/session
 *   POST /api/auth/logout
 *
 * The server also serves the static frontend, so /login and /api share an
 * origin. See server/README.md for email-provider setup.
 */
import './env.mjs';
import http from 'node:http';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { AuthStore } from './store.mjs';

// Load after env.mjs has populated process.env.
const { sendVerificationEmail, emailIsConfigured, providerName } = await import('./mailer.mjs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const IS_PROD = process.env.NODE_ENV === 'production';
const DATA_FILE = process.env.DATA_FILE
  ? path.resolve(__dirname, process.env.DATA_FILE)
  : path.join(__dirname, 'data', 'myrqvia-auth.json');
const AUTH_SECRET = String(process.env.AUTH_SECRET || '');
const SESSION_DAYS = Math.max(1, Math.min(90, Number(process.env.SESSION_DAYS || 30)));
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (IS_PROD && (!AUTH_SECRET || AUTH_SECRET.length < 32)) {
  console.error('AUTH_SECRET must be set to at least 32 characters in production.');
  process.exit(1);
}
const secret = AUTH_SECRET || crypto.randomBytes(32).toString('hex');
if (!AUTH_SECRET) console.warn('[MYRQVIA] AUTH_SECRET not set; using an ephemeral secret (development only).');

const store = await new AuthStore(DATA_FILE).init();
const sessions = new Map();
await store.read((db) => {
  const now = Date.now();
  for (const [value, entry] of Object.entries(db.sessions)) {
    if (entry && entry.expiresAt > now) sessions.set(value, entry);
    else delete db.sessions[value];
  }
});
const ipWindows = new Map();
const onlineCounts = new Map();      // username -> active SSE tabs
const presenceClients = new Set();   // active /api/presence/stream clients
const RESERVED = new Set(['admin', 'root', 'myrqvia', 'support', 'telegram', 'system', 'help', 'security', 'mail', 'login', 'register']);

class HttpError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message || code);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

function json(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders
  });
  res.end(payload);
}

function normaliseEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;
}

function normalisePurpose(value) {
  return value === 'recovery' || value === 'register' ? value : 'login';
}

function codeKey(email, purpose) {
  return `${purpose}:${email}`;
}

function hashCode(email, purpose, code) {
  return crypto.createHmac('sha256', secret).update(`${email}:${purpose}:${code}`).digest('hex');
}

function randomCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function token(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function publicUser(user) {
  if (!user) return null;
  return {
    email: user.email,
    displayName: user.displayName || '',
    username: user.username || '',
    createdAt: user.createdAt || null
  };
}

function usernameRegex(value) {
  return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(value);
}

function scryptHash(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const key = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt}$${key.toString('base64url')}`;
}

function clientIp(req) {
  if (TRUST_PROXY) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (forwarded) return forwarded;
  }
  return req.socket.remoteAddress || 'unknown';
}

function rateIp(ip, limit = 30, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const recent = (ipWindows.get(ip) || []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000));
    throw new HttpError(429, 'rate_limited', 'Too many requests. Please try again later.', { retryAfter });
  }
  recent.push(now);
  ipWindows.set(ip, recent);
}

function isSecure(req) {
  if (TRUST_PROXY && String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https') return true;
  return !!req.socket.encrypted;
}

function sessionCookie(req, value, maxAge) {
  const parts = [
    `myrqvia_session=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`
  ];
  if (isSecure(req)) parts.push('Secure');
  return parts.join('; ');
}

function clearSessionCookie(req) {
  const parts = ['myrqvia_session=', 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isSecure(req)) parts.push('Secure');
  return parts.join('; ');
}

function readCookie(req, name) {
  const raw = String(req.headers.cookie || '');
  for (const part of raw.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim());
  }
  return '';
}

function applyCors(req, res) {
  const origin = String(req.headers.origin || '');
  const allowed = origin && (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*'));
  if (!allowed) return false;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return true;
}

async function readJson(req, limit = 32 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, 'payload_too_large', 'Request body is too large.');
    chunks.push(chunk);
  }
  if (!size) return {};
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid');
    return value;
  } catch (error) {
    throw new HttpError(400, 'invalid_json', 'Request body must be valid JSON.');
  }
}

function createSession(email) {
  const value = token();
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  sessions.set(value, { email, expiresAt });
  return { value, expiresAt };
}

async function persistSession(value, email, expiresAt) {
  await store.mutate((db) => {
    db.sessions[value] = { email, expiresAt };
  });
}

function findUser(db, email) {
  return db.users[email] || null;
}

function codeRecord(db, email, purpose) {
  return db.codes[codeKey(email, purpose)] || null;
}

async function createCode(email, purpose) {
  const code = randomCode();
  const now = Date.now();
  const record = await store.mutate((db) => {
    const key = codeKey(email, purpose);
    const previous = db.codes[key] || {};
    const hourAgo = now - 60 * 60 * 1000;
    const recent = Array.isArray(previous.sentAtHistory) ? previous.sentAtHistory.filter((stamp) => stamp > hourAgo) : [];
    if (recent.length >= 5) {
      throw new HttpError(429, 'rate_limited', 'Too many codes for this email. Please try again later.', { retryAfter: 3600 });
    }
    const next = {
      hash: hashCode(email, purpose, code),
      expiresAt: now + 10 * 60 * 1000,
      sentAt: now,
      attempts: 0,
      verifiedAt: 0,
      sentAtHistory: [...recent, now]
    };
    db.codes[key] = next;
    return next;
  });
  return { code, record };
}

async function issueSession(req, res, email) {
  const session = createSession(email);
  await persistSession(session.value, email, session.expiresAt);
  res.setHeader('Set-Cookie', sessionCookie(req, session.value, Math.floor((session.expiresAt - Date.now()) / 1000)));
  return session.value;
}

async function startCode(req, res, fallbackPurpose) {
  rateIp(clientIp(req), 30, 60 * 60 * 1000);
  const body = await readJson(req);
  const email = normaliseEmail(body.email);
  const purpose = normalisePurpose(body.purpose || fallbackPurpose);
  if (!validEmail(email)) throw new HttpError(400, 'invalid_email', 'Enter a valid email address.');

  if (!emailIsConfigured()) {
    throw new HttpError(503, 'email_not_configured', 'Email delivery is not configured on this server.');
  }

  const state = await store.read((db) => ({
    user: findUser(db, email),
    record: codeRecord(db, email, purpose)
  }));

  if (purpose === 'register' && state.user) {
    throw new HttpError(409, 'email_exists', 'This email already has a MYRQVIA account.');
  }

  // Recovery must not reveal whether an account exists. Return the same shape
  // and timing, but only send a code when the account is real.
  if (purpose === 'recovery' && !state.user) {
    return json(res, 200, { ok: true, retryAfter: 60 });
  }

  const now = Date.now();
  if (state.record && now - state.record.sentAt < 60 * 1000) {
    const retryAfter = Math.max(1, Math.ceil((60 * 1000 - (now - state.record.sentAt)) / 1000));
    throw new HttpError(429, 'rate_limited', 'Please wait before requesting another code.', { retryAfter });
  }

  const { code } = await createCode(email, purpose);

  try {
    await sendVerificationEmail({ to: email, code, purpose });
  } catch (error) {
    await store.mutate((db) => { delete db.codes[codeKey(email, purpose)]; });
    console.error('[MYRQVIA] email send failed:', error.message);
    throw new HttpError(502, 'email_send_failed', 'The verification email could not be sent. Try again shortly.');
  }

  return json(res, 200, { ok: true, retryAfter: 60 });
}

function verifyCodeRecord(email, purpose, code, db) {
  const record = codeRecord(db, email, purpose);
  if (!record) throw new HttpError(400, 'invalid_code', 'The verification code is incorrect.');
  if (record.expiresAt < Date.now()) {
    delete db.codes[codeKey(email, purpose)];
    throw new HttpError(400, 'code_expired', 'The verification code has expired. Request a new one.');
  }
  if (record.attempts >= 5) {
    delete db.codes[codeKey(email, purpose)];
    throw new HttpError(429, 'too_many_attempts', 'Too many incorrect attempts. Request a new code.');
  }
  if (!timingSafeEqual(record.hash, hashCode(email, purpose, code))) {
    record.attempts += 1;
    if (record.attempts >= 5) delete db.codes[codeKey(email, purpose)];
    throw new HttpError(400, 'invalid_code', 'The verification code is incorrect.');
  }
  record.verifiedAt = Date.now();
  return record;
}

/**
 * Auth codes can legitimately be requested as either "login" or "register"
 * depending on which button the user pressed. Verify against both records so a
 * valid code is never rejected just because the UI changed its intent.
 */
function consumeAuthCode(email, code, db) {
  let expired = false;
  let tooMany = false;
  for (const purpose of ['register', 'login']) {
    const record = codeRecord(db, email, purpose);
    if (!record) continue;
    if (record.expiresAt < Date.now()) {
      delete db.codes[codeKey(email, purpose)];
      expired = true;
      continue;
    }
    if (record.attempts >= 5) {
      delete db.codes[codeKey(email, purpose)];
      tooMany = true;
      continue;
    }
    if (timingSafeEqual(record.hash, hashCode(email, purpose, code))) {
      record.verifiedAt = Date.now();
      return { record, purpose };
    }
  }

  for (const purpose of ['register', 'login']) {
    const record = codeRecord(db, email, purpose);
    if (!record || record.expiresAt < Date.now()) continue;
    record.attempts += 1;
    if (record.attempts >= 5) delete db.codes[codeKey(email, purpose)];
  }

  if (tooMany) throw new HttpError(429, 'too_many_attempts', 'Too many incorrect attempts. Request a new code.');
  if (expired) throw new HttpError(400, 'code_expired', 'The verification code has expired. Request a new one.');
  throw new HttpError(400, 'invalid_code', 'The verification code is incorrect. Use the newest email and try again.');
}

async function verifyEmail(req, res) {
  const body = await readJson(req);
  const email = normaliseEmail(body.email);
  const code = String(body.code || '').replace(/\D/g, '').slice(0, 6);
  const purpose = normalisePurpose(body.purpose);
  if (!validEmail(email) || code.length !== 6) {
    throw new HttpError(400, 'invalid_code', 'Enter the 6-digit verification code.');
  }

  const result = await store.mutate((db) => {
    const user = findUser(db, email);

    if (purpose === 'recovery') {
      verifyCodeRecord(email, purpose, code, db);
      if (!user) throw new HttpError(404, 'account_not_found', 'No MYRQVIA account uses this email.');
      const resetToken = token();
      db.resetTokens[resetToken] = { email, expiresAt: Date.now() + 10 * 60 * 1000 };
      return { recovery: true, resetToken };
    }

    // Accept the code from either auth purpose. This prevents a valid code
    // from being rejected when the user switched between Log in and Create.
    const matched = consumeAuthCode(email, code, db);
    if (matched.purpose === 'register' && user) {
      throw new HttpError(409, 'email_exists', 'This email already has a MYRQVIA account.');
    }

    return { user: publicUser(user), isNewUser: !user, record: matched.record };
  });

  if (result.recovery) {
    return json(res, 200, { ok: true, resetToken: result.resetToken });
  }

  if (result.isNewUser) {
    return json(res, 200, { ok: true, isNewUser: true, user: null });
  }

  const sessionToken = await issueSession(req, res, email);
  return json(res, 200, {
    ok: true,
    isNewUser: false,
    user: result.user,
    token: sessionToken
  });
}

async function checkUsername(req, res, url) {
  const value = String(url.searchParams.get('value') || '').trim();
  if (!usernameRegex(value)) {
    return json(res, 200, { ok: true, available: false, error: 'invalid_username' });
  }
  if (RESERVED.has(value.toLowerCase())) {
    return json(res, 200, { ok: true, available: false, error: 'reserved_username' });
  }
  const taken = await store.read((db) => !!db.usernames[value.toLowerCase()]);
  return json(res, 200, { ok: true, available: !taken, error: taken ? 'username_taken' : null });
}

async function register(req, res) {
  const body = await readJson(req);
  const email = normaliseEmail(body.email);
  const code = String(body.code || '').replace(/\D/g, '').slice(0, 6);
  const displayName = String(body.displayName || '').trim().slice(0, 32);
  const username = String(body.username || '').trim();
  if (!validEmail(email)) throw new HttpError(400, 'invalid_email', 'Enter a valid email address.');
  if (code.length !== 6) throw new HttpError(400, 'invalid_code', 'Enter the 6-digit verification code.');
  if (!displayName) throw new HttpError(400, 'invalid_name', 'Enter a display name.');
  if (!usernameRegex(username)) throw new HttpError(400, 'invalid_username', 'Choose a valid MYRQVIA username.');
  if (RESERVED.has(username.toLowerCase())) throw new HttpError(409, 'reserved_username', 'This username is reserved.');

  const result = await store.mutate((db) => {
    if (findUser(db, email)) throw new HttpError(409, 'email_exists', 'This email already has a MYRQVIA account.');
    if (db.usernames[username.toLowerCase()]) throw new HttpError(409, 'username_taken', 'This username is taken.');

    let record = null;
    let recordPurpose = 'login';
    for (const candidate of ['register', 'login']) {
      const entry = codeRecord(db, email, candidate);
      if (!entry) continue;
      if (entry.expiresAt < Date.now()) continue;
      if (timingSafeEqual(entry.hash, hashCode(email, candidate, code))) {
        record = entry;
        recordPurpose = candidate;
        break;
      }
    }
    if (!record) {
      delete db.codes[codeKey(email, 'register')];
      delete db.codes[codeKey(email, 'login')];
      throw new HttpError(400, 'invalid_code', 'Verify your email again.');
    }

    const user = {
      email,
      displayName,
      username,
      createdAt: new Date().toISOString(),
      passwordHash: null
    };
    db.users[email] = user;
    db.usernames[username.toLowerCase()] = email;
    delete db.codes[codeKey(email, 'register')];
    delete db.codes[codeKey(email, 'login')];
    return publicUser(user);
  });

  const sessionToken = await issueSession(req, res, email);
  return json(res, 201, { ok: true, user: result, token: sessionToken });
}

async function recoveryPassword(req, res) {
  const body = await readJson(req);
  const resetToken = String(body.resetToken || '');
  const password = String(body.password || '');
  if (password.length < 8) throw new HttpError(400, 'weak_password', 'Use at least 8 characters.');

  await store.mutate((db) => {
    const entry = db.resetTokens[resetToken];
    if (!entry || entry.expiresAt < Date.now()) {
      delete db.resetTokens[resetToken];
      throw new HttpError(400, 'invalid_reset_token', 'The reset link has expired. Start again.');
    }
    const user = findUser(db, entry.email);
    if (!user) throw new HttpError(404, 'account_not_found', 'No MYRQVIA account uses this email.');
    user.passwordHash = scryptHash(password);
    user.passwordUpdatedAt = new Date().toISOString();
    delete db.resetTokens[resetToken];
  });

  return json(res, 200, { ok: true });
}

async function sessionInfo(req, res) {
  const value = readCookie(req, 'myrqvia_session');
  const entry = value ? sessions.get(value) : null;
  if (!entry || entry.expiresAt < Date.now()) {
    if (value) sessions.delete(value);
    return json(res, 401, { ok: false, error: 'unauthenticated' });
  }
  const user = await store.read((db) => publicUser(findUser(db, entry.email)));
  return json(res, 200, { ok: true, user });
}

async function sessionUser(req) {
  const value = readCookie(req, 'myrqvia_session');
  const entry = value ? sessions.get(value) : null;
  if (!entry || entry.expiresAt < Date.now()) {
    if (value) sessions.delete(value);
    throw new HttpError(401, 'unauthenticated', 'Sign in to continue.');
  }
  const user = await store.read((db) => findUser(db, entry.email));
  if (!user) throw new HttpError(401, 'unauthenticated', 'Sign in to continue.');
  return user;
}

function contactProfile(user) {
  return {
    username: user.username,
    displayName: user.displayName || user.username,
    createdAt: user.createdAt || null
  };
}

function usernameFromBody(value) {
  return String(value || '').trim().replace(/^@+/, '').toLowerCase();
}

async function listContacts(req, res) {
  const me = await sessionUser(req);
  const rows = await store.read((db) => {
    const entries = Array.isArray(db.contacts[me.email]) ? db.contacts[me.email] : [];
    return entries.map((entry) => {
      const user = db.users[db.usernames[entry.username]];
      return user ? contactProfile(user) : null;
    }).filter(Boolean);
  });
  return json(res, 200, { ok: true, contacts: rows });
}

async function lookupUser(req, res, url) {
  await sessionUser(req);
  const username = usernameFromBody(url.searchParams.get('username'));
  if (!usernameRegex(username)) return json(res, 200, { ok: true, found: false });
  const user = await store.read((db) => {
    const email = db.usernames[username];
    return email ? db.users[email] || null : null;
  });
  return json(res, 200, { ok: true, found: !!user, user: user ? contactProfile(user) : null });
}

async function addContact(req, res) {
  const me = await sessionUser(req);
  const body = await readJson(req);
  const username = usernameFromBody(body.username);
  if (!usernameRegex(username)) throw new HttpError(400, 'invalid_username', 'Enter a complete @username.');
  if (username === String(me.username || '').toLowerCase()) {
    throw new HttpError(400, 'cannot_add_self', 'You cannot add yourself.');
  }
  const result = await store.mutate((db) => {
    const email = db.usernames[username];
    const user = email ? db.users[email] : null;
    if (!user) throw new HttpError(404, 'user_not_found', 'That username does not exist.');
    if (!Array.isArray(db.contacts[me.email])) db.contacts[me.email] = [];
    if (db.contacts[me.email].some((entry) => entry.username === username)) {
      throw new HttpError(409, 'contact_exists', 'This person is already in your contacts.');
    }
    db.contacts[me.email].push({ username, addedAt: Date.now() });
    return contactProfile(user);
  });
  return json(res, 201, { ok: true, contact: result });
}

async function removeContact(req, res, url) {
  const me = await sessionUser(req);
  const username = usernameFromBody(url.searchParams.get('username'));
  await store.mutate((db) => {
    if (!Array.isArray(db.contacts[me.email])) return;
    db.contacts[me.email] = db.contacts[me.email].filter((entry) => entry.username !== username);
  });
  return json(res, 200, { ok: true });
}

async function logout(req, res) {
  const value = readCookie(req, 'myrqvia_session');
  if (value) {
    sessions.delete(value);
    await store.mutate((db) => { delete db.sessions[value]; });
  }
  res.setHeader('Set-Cookie', clearSessionCookie(req));
  return json(res, 200, { ok: true });
}

/* --------------------------------------------------------------------------
   Real presence (SSE)
   Online means: this username has at least one authenticated SSE stream open
   right now. Last seen is written only when the last stream closes. Nothing
   is simulated or pre-seeded.
   -------------------------------------------------------------------------- */

function presenceKeys(raw) {
  return String(raw || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value && /^[a-z0-9_]{1,32}$/.test(value))
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 100);
}

async function presenceSnapshot(keys) {
  return store.read((db) => {
    const byUsername = Object.create(null);
    for (const user of Object.values(db.users)) {
      if (user && user.username) byUsername[String(user.username).toLowerCase()] = user;
    }
    const out = {};
    for (const key of keys) {
      const user = byUsername[key];
      if (!user) {
        out[key] = { online: false, lastSeenAt: null };
        continue;
      }
      const online = (onlineCounts.get(key) || 0) > 0;
      const saved = db.presence[key] && db.presence[key].lastSeenAt;
      out[key] = {
        online,
        lastSeenAt: online ? null : (Number.isFinite(saved) ? saved : null)
      };
    }
    return out;
  });
}

async function writePresence(client) {
  if (client.res.writableEnded) return;
  const presence = await presenceSnapshot(client.keys);
  try {
    client.res.write(`event: presence\ndata: ${JSON.stringify({
      ok: true,
      serverTime: Date.now(),
      presence
    })}\n\n`);
  } catch (error) {
    client.res.destroy();
  }
}

async function broadcastPresence() {
  await Promise.all(Array.from(presenceClients).map((client) => writePresence(client)));
}

async function presenceStream(req, res, url) {
  const value = readCookie(req, 'myrqvia_session');
  const entry = value ? sessions.get(value) : null;
  if (!entry || entry.expiresAt < Date.now()) {
    return json(res, 401, { ok: false, error: 'unauthenticated' });
  }

  const user = await store.read((db) => {
    return Object.values(db.users).find((candidate) => candidate.email === entry.email) || null;
  });
  if (!user || !user.username) {
    return json(res, 403, { ok: false, error: 'no_username' });
  }

  const username = String(user.username).toLowerCase();
  const keys = presenceKeys(url.searchParams.get('keys'));

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'X-Content-Type-Options': 'nosniff'
  });
  res.write('retry: 5000\n\n');

  const client = { res, keys, username };
  presenceClients.add(client);
  onlineCounts.set(username, (onlineCounts.get(username) || 0) + 1);

  let closed = false;
  let heartbeat = null;
  const cleanup = () => {
    if (closed) return;
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    presenceClients.delete(client);
    const remaining = Math.max(0, (onlineCounts.get(username) || 1) - 1);
    if (remaining === 0) {
      onlineCounts.delete(username);
      store.mutate((db) => {
        db.presence[username] = { lastSeenAt: Date.now() };
      }).catch((error) => console.error('[MYRQVIA] presence write failed:', error.message));
    } else {
      onlineCounts.set(username, remaining);
    }
    broadcastPresence().catch(() => {});
  };

  req.on('close', cleanup);
  res.on('close', cleanup);
  res.on('error', cleanup);

  heartbeat = setInterval(() => {
    if (res.writableEnded) return cleanup();
    try { res.write(': presence ping\n\n'); } catch (error) { cleanup(); }
  }, 20000);

  await broadcastPresence();
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon'
};

async function serveStatic(req, res, url) {
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch (error) {
    return json(res, 400, { ok: false, error: 'bad_path' });
  }

  if (pathname === '/login/') {
    res.writeHead(301, { Location: '/login' });
    return res.end();
  }
  if (pathname === '/login') pathname = '/login.html';
  if (pathname === '/' || pathname === '') pathname = '/index.html';

  if (pathname.startsWith('/server/') || pathname.startsWith('/.git') || pathname.endsWith('.env') || pathname.includes('/data/')) {
    res.writeHead(404);
    return res.end('Not found');
  }

  let file = path.resolve(ROOT, `.${pathname}`);
  if (!file.startsWith(ROOT + path.sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  try {
    let stat = await fs.stat(file);
    if (stat.isDirectory()) {
      file = path.join(file, 'index.html');
      stat = await fs.stat(file);
    }
    if (!stat.isFile()) throw new Error('not_file');
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY'
    });
    fssync.createReadStream(file).pipe(res);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  try {
    applyCors(req, res);
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    if (pathname === '/api/health') {
      return json(res, 200, {
        ok: true,
        service: 'myrqvia-auth',
        emailProvider: providerName(),
        emailConfigured: emailIsConfigured()
      });
    }

    if (pathname === '/api/presence/stream' && req.method === 'GET') return await presenceStream(req, res, url);
    if (pathname === '/api/auth/email/start' && req.method === 'POST') return await startCode(req, res, 'login');
    if (pathname === '/api/auth/recovery/start' && req.method === 'POST') return await startCode(req, res, 'recovery');
    if (pathname === '/api/auth/email/verify' && req.method === 'POST') return await verifyEmail(req, res);
    if (pathname === '/api/auth/recovery/verify' && req.method === 'POST') return await verifyEmail(req, res);
    if (pathname === '/api/auth/username' && req.method === 'GET') return await checkUsername(req, res, url);
    if (pathname === '/api/auth/register' && req.method === 'POST') return await register(req, res);
    if (pathname === '/api/auth/recovery/password' && req.method === 'POST') return await recoveryPassword(req, res);
    if (pathname === '/api/auth/session' && req.method === 'GET') return await sessionInfo(req, res);
    if (pathname === '/api/auth/logout' && req.method === 'POST') return await logout(req, res);
    if (pathname === '/api/contacts' && req.method === 'GET') return await listContacts(req, res);
    if (pathname === '/api/contacts' && req.method === 'POST') return await addContact(req, res);
    if (pathname === '/api/contacts' && req.method === 'DELETE') return await removeContact(req, res, url);
    if (pathname === '/api/users/lookup' && req.method === 'GET') return await lookupUser(req, res, url);

    if (pathname.startsWith('/api/')) return json(res, 404, { ok: false, error: 'not_found' });
    return await serveStatic(req, res, url);
  } catch (error) {
    if (error instanceof HttpError) {
      return json(res, error.status, {
        ok: false,
        error: error.code,
        message: error.message,
        ...error.extra
      });
    }
    console.error('[MYRQVIA] unhandled error:', error);
    return json(res, 500, { ok: false, error: 'internal_error', message: 'Internal server error.' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`MYRQVIA server listening on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`[MYRQVIA] email provider: ${providerName()} (${emailIsConfigured() ? 'configured' : 'NOT configured'})`);
  console.log(`[MYRQVIA] data file: ${DATA_FILE}`);
  if (!emailIsConfigured()) {
    console.warn('[MYRQVIA] Set EMAIL_PROVIDER=console for local testing, or a real provider for delivery.');
  }
});
