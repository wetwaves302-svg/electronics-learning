import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export type DB = DatabaseSync

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('teacher','student')),
  pass_hash TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  class_id INTEGER REFERENCES classes(id),
  disabled INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  item_id TEXT NOT NULL,
  source TEXT NOT NULL,
  kps TEXT NOT NULL,
  correct INTEGER NOT NULL,
  kind TEXT NOT NULL,
  at INTEGER NOT NULL,
  error_type TEXT,
  UNIQUE (user_id, item_id, at)
);
CREATE INDEX IF NOT EXISTS attempts_user ON attempts(user_id);
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  title TEXT NOT NULL,
  question_ids TEXT NOT NULL,
  due INTEGER,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS question_edits (
  qid TEXT PRIMARY KEY,
  solution TEXT,
  stem TEXT,
  status TEXT NOT NULL,
  def TEXT,
  version INTEGER NOT NULL,
  updated_by INTEGER NOT NULL REFERENCES users(id),
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS question_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  qid TEXT NOT NULL,
  version INTEGER NOT NULL,
  solution TEXT,
  stem TEXT,
  status TEXT NOT NULL,
  def TEXT,
  edited_by INTEGER NOT NULL REFERENCES users(id),
  edited_at INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  UNIQUE (qid, version)
);
`

export function openDb(path: string): DB {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec('PRAGMA foreign_keys = ON;')
  if (path !== ':memory:') db.exec('PRAGMA journal_mode = WAL;')
  db.exec(SCHEMA)
  return db
}

/** node:sqlite 回傳的列轉型輔助 */
export const all = <T,>(db: DB, sql: string, ...p: (string | number | null)[]) => db.prepare(sql).all(...p) as unknown as T[]
export const one = <T,>(db: DB, sql: string, ...p: (string | number | null)[]) => (db.prepare(sql).get(...p) ?? undefined) as unknown as T | undefined
export const run = (db: DB, sql: string, ...p: (string | number | null)[]) => db.prepare(sql).run(...p)
