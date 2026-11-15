import { Router } from 'express';
import { LIMITS } from '../config.js';
import { db, toPublicMessage } from '../db.js';
import { globalSendLimiter, searchLimiter, sendLimiter } from '../limits.js';
import { getSong, searchSongs } from '../services/songs.js';
import { notifyNewWhisper } from '../services/telegram.js';

const router = Router();

const INSERT_MESSAGE = 'INSERT INTO messages (name, body, song_json, created_at) VALUES (?, ?, ?, ?)';
const SELECT_BOARD = `
  SELECT * FROM messages
  WHERE is_public = 1
  ORDER BY COALESCE(replied_at, created_at) DESC
  LIMIT 50
`;

const bad = (res, error, status = 400) => res.status(status).json({ error });

// Kirim bisikan baru
router.post('/messages', sendLimiter, globalSendLimiter, async (req, res) => {
  const { body, name, songId, website } = req.body ?? {};

  // Honeypot: field tersembunyi yang hanya diisi bot. Pura-pura sukses.
  if (website) return res.status(201).json({ ok: true });

  const text = typeof body === 'string' ? body.trim() : '';
  if (!text) return bad(res, 'Bisikannya masih kosong.');
  if (text.length > LIMITS.body) return bad(res, `Bisikan maksimal ${LIMITS.body} karakter.`);

  let sender = null;
  if (name !== undefined && name !== null) {
    if (typeof name !== 'string') return bad(res, 'Nama tidak valid.');
    sender = name.trim() || null;
    if (sender && sender.length > LIMITS.name) return bad(res, `Nama maksimal ${LIMITS.name} karakter.`);
  }

  let song = null;
  if (songId !== undefined && songId !== null && songId !== '') {
    if (!/^\d{1,15}$/.test(String(songId))) return bad(res, 'Lagu tidak valid.');
    try {
      song = await getSong(String(songId));
    } catch {
      return bad(res, 'Gagal mengambil data lagu. Coba lagi, atau kirim tanpa lagu.', 502);
    }
    if (!song) return bad(res, 'Lagunya tidak ditemukan.');
  }

  await db.run(INSERT_MESSAGE, [sender, text, song ? JSON.stringify(song) : null, new Date().toISOString()]);
  notifyNewWhisper({ name: sender, body: text, song });
  res.status(201).json({ ok: true });
});

// Papan bisikan publik (yang dipilih admin)
router.get('/board', async (req, res) => {
  const rows = await db.all(SELECT_BOARD);
  res.json({ messages: rows.map(toPublicMessage) });
});

// Cari lagu
router.get('/songs/search', searchLimiter, async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 2) return res.json({ songs: [] });
  if (q.length > 100) return bad(res, 'Kata kunci terlalu panjang.');

  try {
    res.json({ songs: await searchSongs(q) });
  } catch {
    bad(res, 'Pencarian lagu sedang bermasalah. Coba lagi nanti.', 502);
  }
});

export default router;
