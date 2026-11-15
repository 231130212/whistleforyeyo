import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { LIMITS } from '../config.js';
import { db, toMessage } from '../db.js';

const router = Router();
router.use(requireAdmin);

const FILTERS = {
  all: '1 = 1',
  unread: 'read_at IS NULL',
  public: 'is_public = 1',
};

const listBy = Object.fromEntries(
  Object.entries(FILTERS).map(([key, where]) => [
    key,
    db.prepare(`SELECT * FROM messages WHERE ${where} ORDER BY created_at DESC`),
  ]),
);
const selectStats = db.prepare(`
  SELECT COUNT(*)                     AS total,
         COALESCE(SUM(read_at IS NULL), 0) AS unread,
         COALESCE(SUM(is_public = 1), 0)   AS public
  FROM messages
`);
const selectById = db.prepare('SELECT * FROM messages WHERE id = ?');
const updateById = db.prepare(`
  UPDATE messages
  SET read_at = ?, reply = ?, replied_at = ?, is_public = ?
  WHERE id = ?
`);
const deleteById = db.prepare('DELETE FROM messages WHERE id = ?');

const bad = (res, error, status = 400) => res.status(status).json({ error });

function findMessage(req, res) {
  const id = Number(req.params.id);
  const row = Number.isInteger(id) ? selectById.get(id) : undefined;
  if (!row) bad(res, 'Bisikan tidak ditemukan.', 404);
  return row;
}

router.get('/messages', (req, res) => {
  const filter = FILTERS[req.query.filter] ? req.query.filter : 'all';
  res.json({
    messages: listBy[filter].all().map(toMessage),
    stats: { ...selectStats.get() },
  });
});

router.patch('/messages/:id', (req, res) => {
  const row = findMessage(req, res);
  if (!row) return;

  const { read, reply, isPublic } = req.body ?? {};
  const now = new Date().toISOString();
  let { read_at: readAt, reply: replyText, replied_at: repliedAt, is_public: pub } = row;

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

  updateById.run(readAt, replyText, repliedAt, pub, row.id);
  res.json({ message: toMessage(selectById.get(row.id)) });
});

router.delete('/messages/:id', (req, res) => {
  const row = findMessage(req, res);
  if (!row) return;
  deleteById.run(row.id);
  res.status(204).end();
});

export default router;
