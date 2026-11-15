import { Router } from 'express';
import {
  endAllSessions,
  endSession,
  isAdmin,
  requireAdmin,
  startSession,
  verifyPassword,
} from '../auth.js';
import { loginLimiter } from '../limits.js';

const router = Router();

router.post('/login', loginLimiter, async (req, res) => {
  const { password } = req.body ?? {};
  if (typeof password !== 'string' || !password || password.length > 200) {
    return res.status(400).json({ error: 'Password wajib diisi.' });
  }
  if (!(await verifyPassword(password))) {
    console.warn(`[keamanan] login gagal ${new Date().toISOString()} ip=${req.ip}`);
    return res.status(401).json({ error: 'Password salah.' });
  }
  console.info(`[keamanan] login berhasil ${new Date().toISOString()} ip=${req.ip}`);
  await startSession(req, res);
  res.json({ ok: true });
});

router.post('/logout', async (req, res) => {
  await endSession(req, res);
  res.json({ ok: true });
});

// Keluarkan semua perangkat (misalnya kalau curiga ada yang login selain kamu).
router.post('/logout-all', requireAdmin, async (req, res) => {
  await endAllSessions(req, res);
  console.info(`[keamanan] semua sesi dicabut ${new Date().toISOString()} ip=${req.ip}`);
  res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  res.json({ admin: await isAdmin(req) });
});

export default router;
