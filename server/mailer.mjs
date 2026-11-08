/**
 * MYRQVIA transactional email.
 *
 * Providers:
 *   EMAIL_PROVIDER=resend   RESEND_API_KEY + EMAIL_FROM
 *   EMAIL_PROVIDER=gmail    GMAIL_USER + GMAIL_APP_PASSWORD (SMTP 587/465)
 *   EMAIL_PROVIDER=webhook  EMAIL_WEBHOOK_URL (+ optional EMAIL_WEBHOOK_TOKEN)
 *   EMAIL_PROVIDER=console  development only; prints the code to the server log
 *
 * No provider is configured by default. In production the server refuses to
 * start a code request without a real provider instead of pretending to send.
 */
import { sendGmail } from './smtp.mjs';

const PROVIDER = String(process.env.EMAIL_PROVIDER || '').toLowerCase();
const FROM = String(process.env.EMAIL_FROM || 'MYRQVIA <login@example.com>');
const RESEND_KEY = String(process.env.RESEND_API_KEY || '');
const WEBHOOK_URL = String(process.env.EMAIL_WEBHOOK_URL || '');
const WEBHOOK_TOKEN = String(process.env.EMAIL_WEBHOOK_TOKEN || '');
const GMAIL_USER = String(process.env.GMAIL_USER || '').trim();
const GMAIL_APP_PASSWORD = String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const GMAIL_HOST = String(process.env.GMAIL_SMTP_HOST || 'smtp.gmail.com');
const GMAIL_PORT = Number(process.env.GMAIL_SMTP_PORT || 587);
const IS_PROD = process.env.NODE_ENV === 'production';

function gmailFrom() {
  if (FROM && !FROM.includes('example.com')) return FROM;
  return GMAIL_USER ? `MYRQVIA <${GMAIL_USER}>` : FROM;
}

export function emailIsConfigured() {
  if (PROVIDER === 'console') return !IS_PROD;
  if (PROVIDER === 'resend') return !!(RESEND_KEY && FROM && !FROM.includes('example.com'));
  if (PROVIDER === 'webhook') return !!WEBHOOK_URL;
  if (PROVIDER === 'gmail') {
    return !!(
      GMAIL_USER &&
      GMAIL_APP_PASSWORD &&
      !GMAIL_USER.includes('your-account') &&
      !/x{4}/i.test(GMAIL_APP_PASSWORD)
    );
  }
  return false;
}

export function providerName() {
  return PROVIDER || 'none';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildMessage(to, code, purpose) {
  const prettyPurpose =
    purpose === 'recovery' ? 'reset your MYRQVIA password' :
    purpose === 'register' ? 'finish creating your MYRQVIA account' :
    'sign in to MYRQVIA';
  const subject = `Your MYRQVIA verification code: ${code}`;
  const text = [
    `Your MYRQVIA verification code is ${code}.`,
    '',
    `Use it to ${prettyPurpose}. The code expires in 10 minutes.`,
    'If you did not request this, you can ignore this email.',
    '',
    'MYRQVIA Chat · Connect Beyond Distance'
  ].join('\n');

  const html = `<!doctype html>
<html><body style="margin:0;background:#f7f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#17212b">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px">
    <div style="background:#fff;border:1px solid #e5eaf0;border-radius:18px;padding:32px">
      <div style="font-size:12px;letter-spacing:.16em;color:#229ed9;font-weight:600">MYRQVIA CHAT</div>
      <h1 style="font-size:24px;letter-spacing:-.03em;margin:18px 0 8px">Your verification code</h1>
      <p style="font-size:14px;line-height:1.7;color:#5f6d7c;margin:0 0 22px">Use the code below to ${escapeHtml(prettyPurpose)}.</p>
      <div style="font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:34px;letter-spacing:.24em;font-weight:700;background:#f2f8fc;border-radius:12px;padding:18px 12px;text-align:center;color:#0b1f2a">${escapeHtml(code)}</div>
      <p style="font-size:12px;line-height:1.7;color:#8493a3;margin:20px 0 0">This code expires in 10 minutes. If you did not request it, ignore this email.</p>
      <hr style="border:0;border-top:1px solid #e5eaf0;margin:24px 0 16px">
      <p style="font-size:11px;color:#8493a3;margin:0">MYRQVIA Chat · Connect Beyond Distance</p>
    </div>
  </div>
</body></html>`;

  return { to, subject, text, html };
}

async function sendResend(message) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html
    })
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`resend_${response.status}: ${body.slice(0, 300)}`);
  }
}

async function sendWebhook(message) {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(WEBHOOK_TOKEN ? { Authorization: `Bearer ${WEBHOOK_TOKEN}` } : {})
    },
    body: JSON.stringify(message)
  });
  if (!response.ok) {
    throw new Error(`webhook_${response.status}`);
  }
}

export async function sendVerificationEmail({ to, code, purpose }) {
  const message = buildMessage(to, code, purpose);

  if (PROVIDER === 'console') {
    if (IS_PROD) throw new Error('console_email_forbidden_in_production');
    console.log(`\n[MYRQVIA email] to=${to} purpose=${purpose} code=${code}\n`);
    return { provider: 'console' };
  }

  if (PROVIDER === 'resend') {
    if (!RESEND_KEY) throw new Error('resend_key_missing');
    await sendResend(message);
    return { provider: 'resend' };
  }

  if (PROVIDER === 'gmail') {
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) throw new Error('gmail_credentials_missing');
    await sendGmail({
      user: GMAIL_USER,
      appPassword: GMAIL_APP_PASSWORD,
      host: GMAIL_HOST,
      port: GMAIL_PORT,
      from: gmailFrom(),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html
    });
    return { provider: 'gmail' };
  }

  if (PROVIDER === 'webhook') {
    if (!WEBHOOK_URL) throw new Error('webhook_url_missing');
    await sendWebhook(message);
    return { provider: 'webhook' };
  }

  throw new Error('email_provider_not_configured');
}
