import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { db } from './db.js';

const COOKIE = 'wfy_session';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

// Sidik jari password saat ini. Begitu password diganti lewat `npm run setup`,
// semua sesi lama otomatis tidak berlaku lagi.
const PW_FINGERPRINT = crypto
  .createHash('sha256')
  .update(config.adminPasswordHash)
  .digest('hex')
  .slice(0, 16);

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const nowIso = () => new Date().toISOString();

const insertSession = db.prepare(`
  INSERT INTO sessions (token_hash, pw_fingerprint, created_at, expires_at, user_agent)
  VALUES (?, ?, ?, ?, ?)
`);
const findSession = db.prepare('SELECT * FROM sessions WHERE token_hash = ?');
const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?');
const deleteStale = db.prepare('DELETE FROM sessions WHERE expires_at <= ? OR pw_fingerprint != ?');
const deleteAll = db.prepare('DELETE FROM sessions');

// `secure` mengikuti koneksi asli: aktif otomatis saat diakses lewat HTTPS
// (di hosting, pastikan TRUST_PROXY diset supaya Express tahu koneksinya HTTPS).
const cookieOptions = (req) => ({
  httpOnly: true,
  sameSite: 'strict',
  secure: req.secure,
  path: '/',
});

export function verifyPassword(password) {
  return bcrypt.compare(password, config.adminPasswordHash);
}

export function startSession(req, res) {
  deleteStale.run(nowIso(), PW_FINGERPRINT);

  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  insertSession.run(
    sha256(token),
    PW_FINGERPRINT,
    new Date(now).toISOString(),
    new Date(now + MAX_AGE_MS).toISOString(),
    String(req.get('user-agent') ?? '').slice(0, 200),
  );
  res.cookie(COOKIE, token, { ...cookieOptions(req), maxAge: MAX_AGE_MS });
}

export function endSession(req, res) {
  const token = req.cookies?.[COOKIE];
  if (typeof token === 'string') deleteSession.run(sha256(token));
  res.clearCookie(COOKIE, cookieOptions(req));
}

export function endAllSessions(req, res) {
  deleteAll.run();
  res.clearCookie(COOKIE, cookieOptions(req));
}

export function isAdmin(req) {
  const token = req.cookies?.[COOKIE];
  if (typeof token !== 'string' || token.length > 100) return false;

  const session = findSession.get(sha256(token));
  return Boolean(
    session && session.pw_fingerprint === PW_FINGERPRINT && session.expires_at > nowIso(),
  );
}

export function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.status(401).json({ error: 'Kamu perlu login dulu.' });
}
