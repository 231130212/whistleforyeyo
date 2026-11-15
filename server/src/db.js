import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

export const db = new DatabaseSync(config.dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;

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
  -- jadi kalau file database bocor, sesi tetap tidak bisa dipakai.
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash      TEXT PRIMARY KEY,
    pw_fingerprint  TEXT NOT NULL,
    created_at      TEXT NOT NULL,
    expires_at      TEXT NOT NULL,
    user_agent      TEXT
  );
`);

/** Baris database -> objek untuk admin (lengkap). */
export function toMessage(row) {
  return {
    id: row.id,
    name: row.name,
    body: row.body,
    song: row.song_json ? JSON.parse(row.song_json) : null,
    createdAt: row.created_at,
    readAt: row.read_at,
    reply: row.reply,
    repliedAt: row.replied_at,
    isPublic: row.is_public === 1,
  };
}

/** Baris database -> objek untuk papan publik (tanpa info internal). */
export function toPublicMessage(row) {
  const { readAt, isPublic, ...rest } = toMessage(row);
  return rest;
}
