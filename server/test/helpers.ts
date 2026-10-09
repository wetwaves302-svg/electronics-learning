import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createApp } from '../src/app.ts'
import { hashPassword } from '../src/auth.ts'
import { openDb, run, type DB } from '../src/db.ts'

export interface TestEnv { db: DB; base: string; server: Server; clock: { t: number }; close: () => Promise<void> }

export async function startEnv(): Promise<TestEnv> {
  const db = openDb(':memory:')
  const clock = { t: 1_800_000_000_000 }
  const handler = createApp({ db, now: () => clock.t })
  const server = createServer((req, res) => { void handler(req, res) })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  return { db, base, server, clock, close: () => new Promise((r) => server.close(() => r())) }
}

export function addTeacher(db: DB, username: string, password = 'teacher-pass-1', name = username) {
  const { salt, hash } = hashPassword(password)
  return Number(run(db, 'INSERT INTO users (username,name,role,pass_hash,pass_salt,created_at) VALUES (?,?,?,?,?,?)', username, name, 'teacher', hash, salt, 1).lastInsertRowid)
}

export function client(env: TestEnv) {
  const call = async (method: string, path: string, opts: { token?: string; body?: unknown; raw?: boolean } = {}) => {
    const res = await fetch(env.base + path, {
      method,
      headers: { ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}), ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
    if (opts.raw) return { status: res.status, res }
    const text = await res.text()
    let data: any = undefined
    try { data = text ? JSON.parse(text) : undefined } catch { data = text }
    return { status: res.status, data }
  }
  const login = async (username: string, password: string) => {
    const r = await call('POST', '/api/auth/login', { body: { username, password } })
    if (r.status !== 200) throw new Error(`login failed ${r.status}`)
    return r.data.token as string
  }
  return { call, login }
}

/** 建立:老師 + 班級 + 學生帳號(經由 API),回傳 token 與 id */
export async function setupClass(env: TestEnv, teacherName = 't1', students = ['s1', 's2', 's3']) {
  addTeacher(env.db, teacherName)
  const c = client(env)
  const tt = await c.login(teacherName, 'teacher-pass-1')
  const cls = (await c.call('POST', '/api/classes', { token: tt, body: { name: '技高二甲' } })).data
  const reg = await c.call('POST', '/api/classes/' + cls.id + '/students', { token: tt, body: { lines: students.map((s) => `${s},${s}姓名,pass-${s}-1`).join('\n') } })
  const stuTokens: Record<string, string> = {}
  for (const s of students) stuTokens[s] = await c.login(s, `pass-${s}-1`)
  const ids = Object.fromEntries((await c.call('GET', '/api/classes/' + cls.id + '/students', { token: tt })).data.students.map((x: any) => [x.username, x.id]))
  return { c, teacherToken: tt, cls, stuTokens, ids, reg }
}

export const at = (env: TestEnv, offsetSec = 0) => env.clock.t - 60_000 + offsetSec * 1000
export const mkAttempt = (itemId: string, correct: boolean, kind: string, t: number, extra: Record<string, unknown> = {}) => ({ itemId, source: 'question', kps: ['KP-12-03'], correct, kind, at: t, ...extra })
