// Penyimpanan hitungan rate limit di database (bukan di memori).
// Wajib untuk serverless: setiap request bisa ditangani instance berbeda,
// jadi hitungan di memori tidak bisa diandalkan untuk menahan brute force.
import { db } from './db.js';

const UPSERT = `
  INSERT INTO rate_limits (key, hits, reset_at) VALUES (?, 1, ?)
  ON CONFLICT(key) DO UPDATE SET
    hits     = CASE WHEN rate_limits.reset_at <= ? THEN 1 ELSE rate_limits.hits + 1 END,
    reset_at = CASE WHEN rate_limits.reset_at <= ? THEN excluded.reset_at ELSE rate_limits.reset_at END
  RETURNING hits, reset_at
`;

export class DbRateStore {
  // Memberi tahu express-rate-limit bahwa hitungan dibagi antar instance.
  localKeys = false;

  constructor(prefix) {
    this.prefix = `${prefix}:`;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const now = Date.now();
    const row = await db.get(UPSERT, [this.prefix + key, now + this.windowMs, now, now]);

    // Sesekali bersihkan baris yang sudah kedaluwarsa.
    if (Math.random() < 0.02) {
      db.run('DELETE FROM rate_limits WHERE reset_at <= ?', [now]).catch(() => {});
    }
    return { totalHits: Number(row.hits), resetTime: new Date(Number(row.reset_at)) };
  }

  async decrement(key) {
    await db.run('UPDATE rate_limits SET hits = MAX(hits - 1, 0) WHERE key = ?', [this.prefix + key]);
  }

  async resetKey(key) {
    await db.run('DELETE FROM rate_limits WHERE key = ?', [this.prefix + key]);
  }
}
