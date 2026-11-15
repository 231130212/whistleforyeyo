import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { config } from './config.js';

// Satu kode untuk dua tempat:
// - Laptop (default): file SQLite lokal di server/data/whistle.db
// - Hosting: database Turso di cloud (isi TURSO_DATABASE_URL + TURSO_AUTH_TOKEN)
const remoteUrl = process.env.TURSO_DATABASE_URL;

if (!remoteUrl) fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

const client = createClient(
  remoteUrl
    ? { url: remoteUrl, authToken: process.env.TURSO_AUTH_TOKEN }
    : { url: `file:${config.dbPath}` },
);

export const dbLocation = remoteUrl ? 'Turso (cloud)' : config.dbPath;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT,
    body        TEXT    NOT NULL,
    song_json   TEXT,
    created_at  TEXT    NOT NULL,
    read_at     TEXT,
    reply       TEXT,
    replied_at  TEXT,
    is_public   INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_public  ON messages (is_public, replied_at DESC);

  -- Sesi login admin. Yang disimpan hanya hash token, bukan token aslinya,
  -- jadi kalau database bocor, sesi tetap tidak bisa dipakai.
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash      TEXT PRIMARY KEY,
    pw_fingerprint  TEXT NOT NULL,
    created_at      TEXT NOT NULL,
    expires_at      TEXT NOT NULL,
    user_agent      TEXT
  );

  -- Hitungan rate limit (anti brute force & spam), dibagi antar instance server.
  CREATE TABLE IF NOT EXISTS rate_limits (
    key       TEXT PRIMARY KEY,
    hits      INTEGER NOT NULL,
    reset_at  INTEGER NOT NULL
  );
`;

export async function initDb() {
  if (!remoteUrl) await client.execute('PRAGMA journal_mode = WAL');
  await client.executeMultiple(SCHEMA);
}

// Helper kecil. Semua query memakai parameter (?) — aman dari SQL injection.
export const db = {
  all: async (sql, args = []) => (await client.execute({ sql, args })).rows,
  get: async (sql, args = []) => (await client.execute({ sql, args })).rows[0],
  run: (sql, args = []) => client.execute({ sql, args }),
};

/** Baris database -> objek untuk admin (lengkap). */
export function toMessage(row) {
  return {
    id: Number(row.id),
    name: row.name,
    body: row.body,
    song: row.song_json ? JSON.parse(row.song_json) : null,
    createdAt: row.created_at,
    readAt: row.read_at,
    reply: row.reply,
    repliedAt: row.replied_at,
    isPublic: Number(row.is_public) === 1,
  };
}

/** Baris database -> objek untuk papan publik (tanpa info internal). */
export function toPublicMessage(row) {
  const { readAt, isPublic, ...rest } = toMessage(row);
  return rest;
}
