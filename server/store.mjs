/**
 * MYRQVIA auth storage.
 *
 * Zero-dependency JSON store for a single Node process. It is intentionally
 * small and easy to replace with PostgreSQL/SQLite later. All mutations are
 * serialised and written atomically (temp file + rename).
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const EMPTY = {
  users: {},
  usernames: {},
  codes: {},
  sessions: {},
  resetTokens: {},
  presence: {},
  contacts: {}
};

function normaliseDb(value) {
  const db = value && typeof value === 'object' ? value : {};
  return {
    users: db.users && typeof db.users === 'object' ? db.users : {},
    usernames: db.usernames && typeof db.usernames === 'object' ? db.usernames : {},
    codes: db.codes && typeof db.codes === 'object' ? db.codes : {},
    sessions: db.sessions && typeof db.sessions === 'object' ? db.sessions : {},
    resetTokens: db.resetTokens && typeof db.resetTokens === 'object' ? db.resetTokens : {},
    presence: db.presence && typeof db.presence === 'object' ? db.presence : {},
    contacts: db.contacts && typeof db.contacts === 'object' ? db.contacts : {}
  };
}

export class AuthStore {
  constructor(file) {
    this.file = file;
    this.db = structuredClone(EMPTY);
    this.queue = Promise.resolve();
    this.loaded = false;
  }

  async init() {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    try {
      const raw = await fs.readFile(this.file, 'utf8');
      this.db = normaliseDb(JSON.parse(raw));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      this.db = structuredClone(EMPTY);
      await this.flush();
    }
    this.loaded = true;
    return this;
  }

  async flush() {
    const tmp = `${this.file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(this.db, null, 2), { mode: 0o600 });
    await fs.rename(tmp, this.file);
  }

  /**
   * Run a mutation inside a serialised queue. The callback receives the live
   * database object and may return a value. It must not await.
   */
  async mutate(fn) {
    if (!this.loaded) await this.init();
    const run = this.queue.then(async () => {
      try {
        const result = fn(this.db);
        await this.flush();
        return result;
      } catch (error) {
        // Mutations may intentionally increment an attempt counter or remove
        // an expired code before throwing. Persist that before propagating.
        await this.flush();
        throw error;
      }
    });
    this.queue = run.catch(() => {});
    return run;
  }

  async read(fn) {
    if (!this.loaded) await this.init();
    await this.queue;
    return fn(this.db);
  }
}
