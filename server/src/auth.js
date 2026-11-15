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

const INSERT_SESSION = `
  INSERT INTO sessions (token_hash, pw_fingerprint, created_at, expires_at, user_agent)
  VALUES (?, ?, ?, ?, ?)
`;
const FIND_SESSION = 'SELECT * FROM sessions WHERE token_hash = ?';
const DELETE_SESSION = 'DELETE FROM sessions WHERE token_hash = ?';
const DELETE_STALE = 'DELETE FROM sessions WHERE expires_at <= ? OR pw_fingerprint != ?';
const DELETE_ALL = 'DELETE FROM sessions';

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

export async function startSession(req, res) {
  await db.run(DELETE_STALE, [nowIso(), PW_FINGERPRINT]);

  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  await db.run(INSERT_SESSION, [
    sha256(token),
    PW_FINGERPRINT,
    new Date(now).toISOString(),
    new Date(now + MAX_AGE_MS).toISOString(),
    String(req.get('user-agent') ?? '').slice(0, 200),
  ]);
  res.cookie(COOKIE, token, { ...cookieOptions(req), maxAge: MAX_AGE_MS });
}

export async function endSession(req, res) {
  const token = req.cookies?.[COOKIE];
  if (typeof token === 'string') await db.run(DELETE_SESSION, [sha256(token)]);
  res.clearCookie(COOKIE, cookieOptions(req));
}

export async function endAllSessions(req, res) {
  await db.run(DELETE_ALL);
  res.clearCookie(COOKIE, cookieOptions(req));
}

export async function isAdmin(req) {
  const token = req.cookies?.[COOKIE];
  if (typeof token !== 'string' || token.length > 100) return false;

  const session = await db.get(FIND_SESSION, [sha256(token)]);
  return Boolean(
    session && session.pw_fingerprint === PW_FINGERPRINT && session.expires_at > nowIso(),
  );
}

export async function requireAdmin(req, res, next) {
  if (await isAdmin(req)) return next();
  res.status(401).json({ error: 'Kamu perlu login dulu.' });
}
