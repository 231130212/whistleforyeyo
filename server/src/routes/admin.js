import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { LIMITS } from '../config.js';
import { db, toMessage } from '../db.js';

const router = Router();
router.use(requireAdmin);

// Nilai WHERE ini konstanta (bukan input pengguna), jadi aman disisipkan.
const FILTERS = {
  all: '1 = 1',
  unread: 'read_at IS NULL',
  public: 'is_public = 1',
};

const SELECT_STATS = `
  SELECT COUNT(*)                          AS total,
         COALESCE(SUM(read_at IS NULL), 0) AS unread,
         COALESCE(SUM(is_public = 1), 0)   AS public
  FROM messages
`;
const SELECT_BY_ID = 'SELECT * FROM messages WHERE id = ?';
const UPDATE_BY_ID = `
  UPDATE messages
  SET read_at = ?, reply = ?, replied_at = ?, is_public = ?
  WHERE id = ?
`;
const DELETE_BY_ID = 'DELETE FROM messages WHERE id = ?';

const bad = (res, error, status = 400) => res.status(status).json({ error });

async function findMessage(req, res) {
  const id = Number(req.params.id);
  const row = Number.isInteger(id) ? await db.get(SELECT_BY_ID, [id]) : undefined;
  if (!row) bad(res, 'Bisikan tidak ditemukan.', 404);
  return row;
}

router.get('/messages', async (req, res) => {
  const filter = FILTERS[req.query.filter] ? req.query.filter : 'all';
  const [rows, stats] = await Promise.all([
    db.all(`SELECT * FROM messages WHERE ${FILTERS[filter]} ORDER BY created_at DESC`),
    db.get(SELECT_STATS),
  ]);
  res.json({
    messages: rows.map(toMessage),
    stats: {
      total: Number(stats.total),
      unread: Number(stats.unread),
      public: Number(stats.public),
    },
  });
});

router.patch('/messages/:id', async (req, res) => {
  const row = await findMessage(req, res);
  if (!row) return;

  const { read, reply, isPublic } = req.body ?? {};
  const now = new Date().toISOString();
  let { read_at: readAt, reply: replyText, replied_at: repliedAt } = row;
  let pub = Number(row.is_public);

  if (read !== undefined) {
    if (typeof read !== 'boolean') return bad(res, '`read` harus boolean.');
    readAt = read ? (readAt ?? now) : null;
  }

  if (reply !== undefined) {
    if (reply !== null && typeof reply !== 'string') return bad(res, 'Balasan tidak valid.');
    const text = (reply ?? '').trim();
    if (text.length > LIMITS.reply) return bad(res, `Balasan maksimal ${LIMITS.reply} karakter.`);
    replyText = text || null;
    repliedAt = text ? now : null;
    if (text) readAt ??= now; // membalas = sudah membaca
  }

  if (isPublic !== undefined) {
    if (typeof isPublic !== 'boolean') return bad(res, '`isPublic` harus boolean.');
    pub = isPublic ? 1 : 0;
    if (isPublic) readAt ??= now;
  }

  const id = Number(row.id);
  await db.run(UPDATE_BY_ID, [readAt, replyText, repliedAt, pub, id]);
  res.json({ message: toMessage(await db.get(SELECT_BY_ID, [id])) });
});

router.delete('/messages/:id', async (req, res) => {
  const row = await findMessage(req, res);
  if (!row) return;
  await db.run(DELETE_BY_ID, [Number(row.id)]);
  res.status(204).end();
});

export default router;
