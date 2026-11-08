/**
 * Minimal SMTP client for Gmail App Passwords.
 *
 * No dependencies. Gmail requires 2-Step Verification and an App Password:
 * https://myaccount.google.com/apppasswords
 *
 * This file is intentionally small: it only sends one transactional message
 * per connection (HELO/EHLO → STARTTLS → AUTH LOGIN → MAIL/RCPT/DATA → QUIT).
 */
import net from 'node:net';
import tls from 'node:tls';
import crypto from 'node:crypto';

class SmtpChannel {
  constructor(socket) {
    this.socket = socket;
    this.buffer = '';
    this.pending = null;
    this.error = null;
    this.bind(socket);
  }

  bind(socket) {
    socket.setTimeout(20000, () => socket.destroy(new Error('smtp_timeout')));
    socket.on('data', (chunk) => {
      this.buffer += chunk.toString('utf8');
      this.pump();
    });
    socket.on('error', (error) => {
      this.error = error;
      if (this.pending) {
        const pending = this.pending;
        this.pending = null;
        pending.reject(error);
      }
    });
    socket.on('close', () => {
      if (this.pending) {
        const pending = this.pending;
        this.pending = null;
        pending.reject(new Error('smtp_connection_closed'));
      }
    });
  }

  pump() {
    if (!this.pending) return;
    const index = this.buffer.indexOf('\n');
    if (index < 0) return;
    const line = this.buffer.slice(0, index + 1).replace(/\r?\n$/, '');
    this.buffer = this.buffer.slice(index + 1);
    const pending = this.pending;
    this.pending = null;
    pending.resolve(line);
  }

  readLine() {
    if (this.buffer.includes('\n')) {
      const index = this.buffer.indexOf('\n');
      const line = this.buffer.slice(0, index + 1).replace(/\r?\n$/, '');
      this.buffer = this.buffer.slice(index + 1);
      return Promise.resolve(line);
    }
    if (this.error) return Promise.reject(this.error);
    return new Promise((resolve, reject) => {
      this.pending = { resolve, reject };
    });
  }

  async readResponse() {
    const lines = [];
    let code = 0;
    for (;;) {
      const line = await this.readLine();
      const match = /^(\d{3})([ -])(.*)$/.exec(line);
      if (!match) throw new Error(`smtp_bad_response: ${line.slice(0, 120)}`);
      code = Number(match[1]);
      lines.push(match[3]);
      if (match[2] === ' ') return { code, text: lines.join('\n') };
    }
  }

  async command(line, expected) {
    this.socket.write(`${line}\r\n`);
    const response = await this.readResponse();
    if (expected && response.code !== expected) {
      throw new Error(`smtp_${response.code}: ${response.text.slice(0, 200)}`);
    }
    return response;
  }

  async upgrade(host) {
    this.socket.removeAllListeners('data');
    this.socket.removeAllListeners('error');
    this.socket.removeAllListeners('close');
    const secure = tls.connect({ socket: this.socket, servername: host });
    await new Promise((resolve, reject) => {
      secure.once('secureConnect', resolve);
      secure.once('error', reject);
      secure.setTimeout(20000, () => secure.destroy(new Error('smtp_tls_timeout')));
    });
    this.socket = secure;
    this.buffer = '';
    this.pending = null;
    this.bind(secure);
  }

  close() {
    try { this.socket.end(); } catch (error) { /* noop */ }
    try { this.socket.destroy(); } catch (error) { /* noop */ }
  }
}

function openChannel(host, port, implicitTls) {
  return new Promise((resolve, reject) => {
    const socket = implicitTls
      ? tls.connect({ host, port, servername: host })
      : net.connect({ host, port });
    // Attach the data listener before the TCP/TLS handshake completes.
    // Gmail sends its 220 greeting immediately; without this, the first
    // greeting can arrive before SmtpChannel is constructed and be lost.
    const channel = new SmtpChannel(socket);
    const readyEvent = implicitTls ? 'secureConnect' : 'connect';
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('smtp_connect_timeout'));
    }, 20000);
    socket.once(readyEvent, () => {
      clearTimeout(timer);
      resolve(channel);
    });
    socket.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function base64Lines(value) {
  const encoded = Buffer.from(value, 'utf8').toString('base64');
  return encoded.match(/.{1,76}/g)?.join('\r\n') || '';
}

function encodeHeader(value) {
  return /^[\x20-\x7E]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function dotStuff(value) {
  return value.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
}

function buildMime({ from, to, subject, text, html }) {
  const boundary = `myrqvia_${crypto.randomBytes(12).toString('hex')}`;
  const messageId = `<${crypto.randomUUID()}@gmail.com>`;
  return [
    `From: ${encodeHeader(from)}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(text),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(html),
    `--${boundary}--`,
    ''
  ].join('\r\n');
}

export async function sendGmail({ user, appPassword, host, port, from, to, subject, text, html }) {
  const implicitTls = Number(port) === 465;
  const channel = await openChannel(host, Number(port), implicitTls);

  try {
    await channel.readResponse(); // 220
    await channel.command('EHLO myrqvia.local', 250);

    if (!implicitTls) {
      await channel.command('STARTTLS', 220);
      await channel.upgrade(host);
      await channel.command('EHLO myrqvia.local', 250);
    }

    await channel.command('AUTH LOGIN', 334);
    await channel.command(Buffer.from(user, 'utf8').toString('base64'), 334);
    await channel.command(Buffer.from(appPassword, 'utf8').toString('base64'), 235);

    await channel.command(`MAIL FROM:<${user}>`, 250);
    await channel.command(`RCPT TO:<${to}>`, 250);
    await channel.command('DATA', 354);

    const mime = buildMime({ from, to, subject, text, html });
    channel.socket.write(`${dotStuff(mime)}\r\n.\r\n`);
    const accepted = await channel.readResponse();
    if (accepted.code !== 250) throw new Error(`smtp_${accepted.code}: ${accepted.text}`);

    try { await channel.command('QUIT', 221); } catch (error) { /* message accepted */ }
  } finally {
    channel.close();
  }
}
