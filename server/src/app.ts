import { existsSync, readFileSync, statSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { HttpError, Router, readJson, sendJson, int, str, optStr, type Ctx } from './http.ts'
import { all, one, run, type DB } from './db.ts'
import { RateLimiter, USERNAME_RE, hashPassword, newClassCode, newInitialPassword, newToken, tokenHash, verifyPassword } from './auth.ts'
import { assignmentProgress, classAnalytics, summarize, groupBy } from './analytics.ts'
import { STATUSES, bank, createCustom, overridesPayload, restoreVersion, saveEdit } from './qbank.ts'
import { buildWorkbook } from './export.ts'
import type { Attempt } from '../../app/src/core/progress'

export interface AppConfig { db: DB; staticDir?: string; corsOrigin?: string; now?: () => number; sessionDays?: number }
interface User { id: number; username: string; name: string; role: 'teacher' | 'student'; class_id: number | null; disabled: number }

const KINDS = ['firstIndependent', 'hinted', 'afterSolution', 'delayedReview']
const SOURCES = ['question', 'game', 'lesson']
const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2', '.ico': 'image/x-icon' }

export function createApp(cfg: AppConfig) {
  const { db } = cfg
  const now = cfg.now ?? Date.now
  const sessionMs = (cfg.sessionDays ?? 30) * 86_400_000
  const loginLimit = new RateLimiter(8, 10 * 60_000, now)
  const registerLimit = new RateLimiter(30, 60 * 60_000, now)
  const r = new Router()
  const ctxUser = new WeakMap<IncomingMessage, User>()

  const authed = (req: IncomingMessage): User => {
    const u = ctxUser.get(req)
    if (!u) throw new HttpError(401, '請先登入')
    return u
  }
  const needTeacher = (req: IncomingMessage) => { const u = authed(req); if (u.role !== 'teacher') throw new HttpError(403, '需要教師帳號'); return u }
  const needStudent = (req: IncomingMessage) => { const u = authed(req); if (u.role !== 'student') throw new HttpError(403, '需要學生帳號'); return u }
  const ownClass = (t: User, id: string) => {
    const c = one<{ id: number; name: string; code: string }>(db, 'SELECT id, name, code FROM classes WHERE id = ? AND teacher_id = ?', Number(id), t.id)
    if (!c) throw new HttpError(404, '找不到班級')
    return c
  }
  const ownStudent = (t: User, id: string) => {
    const s = one<{ id: number; username: string; name: string; class_id: number; disabled: number }>(db, 'SELECT u.id, u.username, u.name, u.class_id, u.disabled FROM users u JOIN classes c ON c.id = u.class_id WHERE u.id = ? AND u.role = ? AND c.teacher_id = ?', Number(id), 'student', t.id)
    if (!s) throw new HttpError(404, '找不到學生')
    return s
  }
  const classStudents = (classId: number) => all<{ id: number; username: string; name: string; disabled: number }>(db, 'SELECT id, username, name, disabled FROM users WHERE class_id = ? AND role = ? ORDER BY username', classId, 'student')
  const loadAttempts = (ids: number[]) => {
    const m = new Map<number, Attempt[]>()
    for (const id of ids) m.set(id, [])
    if (ids.length === 0) return m
    const rows = all<{ user_id: number; item_id: string; source: string; kps: string; correct: number; kind: string; at: number; error_type: string | null }>(db, `SELECT user_id, item_id, source, kps, correct, kind, at, error_type FROM attempts WHERE user_id IN (${ids.map(() => '?').join(',')}) ORDER BY at`, ...ids)
    for (const a of rows) m.get(a.user_id)!.push({ itemId: a.item_id, source: a.source as Attempt['source'], kps: JSON.parse(a.kps), correct: !!a.correct, kind: a.kind as Attempt['kind'], at: a.at, errorType: a.error_type ?? undefined })
    return m
  }
  const startSession = (userId: number) => {
    const token = newToken()
    run(db, 'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)', tokenHash(token), userId, now() + sessionMs)
    return token
  }
  const pub = (u: User) => ({ id: u.id, username: u.username, name: u.name, role: u.role, classId: u.class_id })
  const body = (c: Ctx) => (c.body && typeof c.body === 'object' ? (c.body as Record<string, unknown>) : {})
  const ip = (req: IncomingMessage) => req.socket.remoteAddress ?? 'unknown'

  /* ───── 公開 ───── */
  r.get('/api/health', () => ({ ok: true }))
  r.get('/api/questions/overrides', () => overridesPayload(db))

  r.post('/api/auth/login', (c) => {
    const b = body(c)
    const username = str(b.username, '帳號', 1, 64)
    const password = str(b.password, '密碼', 1, 200)
    const key = `${ip(c.req)}|${username.toLowerCase()}`
    if (!loginLimit.check(key)) throw new HttpError(429, '嘗試次數太多,請 10 分鐘後再試')
    const u = one<User & { pass_hash: string; pass_salt: string }>(db, 'SELECT * FROM users WHERE username = ?', username)
    if (!u || u.disabled || !verifyPassword(password, u.pass_salt, u.pass_hash)) throw new HttpError(401, '帳號或密碼錯誤')
    loginLimit.clear(key)
    return { token: startSession(u.id), user: pub(u) }
  })

  r.post('/api/auth/register-student', (c) => {
    if (!registerLimit.check(ip(c.req))) throw new HttpError(429, '註冊太頻繁,請稍後再試')
    const b = body(c)
    const code = str(b.classCode, '班級代碼', 4, 12).toUpperCase()
    const username = str(b.username, '帳號', 2, 32)
    if (!USERNAME_RE.test(username)) throw new HttpError(400, '帳號只能用英文、數字、中文與 _ . -(2~32 字)')
    const password = str(b.password, '密碼', 6, 100)
    const name = optStr(b.name, '姓名', 30) ?? ''
    const cls = one<{ id: number }>(db, 'SELECT id FROM classes WHERE code = ?', code)
    if (!cls) throw new HttpError(400, '班級代碼不正確')
    if (one(db, 'SELECT 1 FROM users WHERE username = ?', username)) throw new HttpError(409, '這個帳號已經有人使用')
    const { salt, hash } = hashPassword(password)
    const res = run(db, 'INSERT INTO users (username, name, role, pass_hash, pass_salt, class_id, created_at) VALUES (?,?,?,?,?,?,?)', username, name, 'student', hash, salt, cls.id, now())
    const id = Number(res.lastInsertRowid)
    return { token: startSession(id), user: { id, username, name, role: 'student', classId: cls.id } }
  })

  /* ───── 登入後共通 ───── */
  r.get('/api/me', (c) => ({ user: pub(authed(c.req) as User) }))
  r.post('/api/auth/logout', (c) => {
    const h = c.req.headers.authorization
    if (h?.startsWith('Bearer ')) run(db, 'DELETE FROM sessions WHERE token_hash = ?', tokenHash(h.slice(7)))
    return { ok: true }
  })
  r.post('/api/auth/password', (c) => {
    const u = authed(c.req)
    const b = body(c)
    const row = one<{ pass_hash: string; pass_salt: string }>(db, 'SELECT pass_hash, pass_salt FROM users WHERE id = ?', u.id)!
    if (!verifyPassword(str(b.oldPassword, '舊密碼', 1, 200), row.pass_salt, row.pass_hash)) throw new HttpError(400, '舊密碼不正確')
    const np = str(b.newPassword, '新密碼', u.role === 'teacher' ? 8 : 6, 100)
    const { salt, hash } = hashPassword(np)
    run(db, 'UPDATE users SET pass_hash = ?, pass_salt = ? WHERE id = ?', hash, salt, u.id)
    run(db, 'DELETE FROM sessions WHERE user_id = ?', u.id)
    return { token: startSession(u.id) }
  })

  /* ───── 學生 ───── */
  r.post('/api/attempts/sync', (c) => {
    const u = needStudent(c.req)
    const list = body(c).attempts
    if (!Array.isArray(list)) throw new HttpError(400, 'attempts 必須是陣列')
    if (list.length > 2000) throw new HttpError(413, '一次最多同步 2000 筆')
    const t = now()
    const stmt = db.prepare('INSERT INTO attempts (user_id,item_id,source,kps,correct,kind,at,error_type) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id,item_id,at) DO UPDATE SET error_type = COALESCE(excluded.error_type, attempts.error_type)')
    let saved = 0
    db.exec('BEGIN')
    try {
      for (const raw of list as Record<string, unknown>[]) {
        const itemId = str(raw.itemId, 'itemId', 1, 80)
        if (!SOURCES.includes(raw.source as string) || !KINDS.includes(raw.kind as string)) throw new HttpError(400, '作答紀錄格式不正確')
        const at = int(raw.at, 'at')
        if (at < 1_577_836_800_000 || at > t + 86_400_000) throw new HttpError(400, '作答時間不合理')
        const kps = Array.isArray(raw.kps) ? raw.kps.slice(0, 8).map((k) => str(k, 'kp', 1, 20)) : []
        if (typeof raw.correct !== 'boolean') throw new HttpError(400, 'correct 必須是布林值')
        stmt.run(u.id, itemId, raw.source as string, JSON.stringify(kps), raw.correct ? 1 : 0, raw.kind as string, at, typeof raw.errorType === 'string' ? raw.errorType.slice(0, 30) : null)
        saved++
      }
      db.exec('COMMIT')
    } catch (e) { db.exec('ROLLBACK'); throw e }
    return { saved }
  })
  r.get('/api/attempts/mine', (c) => ({ attempts: loadAttempts([needStudent(c.req).id]).get(authed(c.req).id) }))
  r.get('/api/assignments/mine', (c) => {
    const u = needStudent(c.req)
    if (!u.class_id) return { assignments: [] }
    const mine = loadAttempts([u.id])
    const ref = [{ id: u.id, username: u.username, name: u.name }]
    return {
      assignments: all<{ id: number; title: string; question_ids: string; due: number | null }>(db, 'SELECT id, title, question_ids, due FROM assignments WHERE class_id = ? ORDER BY created_at DESC', u.class_id).map((a) => {
        const ids: string[] = JSON.parse(a.question_ids)
        return { id: a.id, title: a.title, questionIds: ids, due: a.due, progress: assignmentProgress(ref, mine, ids)[0] }
      }),
    }
  })

  /* ───── 教師:班級與學生 ───── */
  r.post('/api/classes', (c) => {
    const t = needTeacher(c.req)
    const name = str(body(c).name, '班級名稱', 1, 40)
    let code = newClassCode()
    while (one(db, 'SELECT 1 FROM classes WHERE code = ?', code)) code = newClassCode()
    const res = run(db, 'INSERT INTO classes (name, code, teacher_id, created_at) VALUES (?,?,?,?)', name, code, t.id, now())
    return { id: Number(res.lastInsertRowid), name, code }
  })
  r.get('/api/classes', (c) => {
    const t = needTeacher(c.req)
    return { classes: all<{ id: number; name: string; code: string; students: number }>(db, "SELECT c.id, c.name, c.code, (SELECT COUNT(*) FROM users u WHERE u.class_id = c.id AND u.role = 'student') AS students FROM classes c WHERE c.teacher_id = ? ORDER BY c.id", t.id) }
  })
  r.get('/api/classes/:id/students', (c) => {
    const cls = ownClass(needTeacher(c.req), c.params.id)
    return { class: cls, students: classStudents(cls.id) }
  })
  r.post('/api/classes/:id/students', (c) => {
    const cls = ownClass(needTeacher(c.req), c.params.id)
    const lines = str(body(c).lines, '學生名單', 1, 20000).split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (lines.length > 200) throw new HttpError(400, '一次最多新增 200 位學生')
    const created: { username: string; name: string; password: string }[] = []
    const errors: { line: string; error: string }[] = []
    for (const line of lines) {
      const [username, name = '', pw] = line.split(/[,\t，]/).map((x) => x.trim())
      if (!USERNAME_RE.test(username ?? '')) { errors.push({ line, error: '帳號格式不正確' }); continue }
      if (one(db, 'SELECT 1 FROM users WHERE username = ?', username)) { errors.push({ line, error: '帳號已存在' }); continue }
      const password = pw && pw.length >= 6 ? pw : newInitialPassword()
      const { salt, hash } = hashPassword(password)
      run(db, 'INSERT INTO users (username, name, role, pass_hash, pass_salt, class_id, created_at) VALUES (?,?,?,?,?,?,?)', username, name.slice(0, 30), 'student', hash, salt, cls.id, now())
      created.push({ username, name, password })
    }
    return { created, errors }
  })
  r.post('/api/students/:id/reset-password', (c) => {
    const s = ownStudent(needTeacher(c.req), c.params.id)
    const password = newInitialPassword()
    const { salt, hash } = hashPassword(password)
    run(db, 'UPDATE users SET pass_hash = ?, pass_salt = ? WHERE id = ?', hash, salt, s.id)
    run(db, 'DELETE FROM sessions WHERE user_id = ?', s.id)
    return { username: s.username, password }
  })
  r.post('/api/students/:id/disable', (c) => {
    const s = ownStudent(needTeacher(c.req), c.params.id)
    const disabled = body(c).disabled === true ? 1 : 0
    run(db, 'UPDATE users SET disabled = ? WHERE id = ?', disabled, s.id)
    if (disabled) run(db, 'DELETE FROM sessions WHERE user_id = ?', s.id)
    return { ok: true, disabled: !!disabled }
  })

  /* ───── 教師:分析 ───── */
  r.get('/api/classes/:id/analytics', (c) => {
    const cls = ownClass(needTeacher(c.req), c.params.id)
    const students = classStudents(cls.id).filter((s) => !s.disabled)
    return { class: cls, ...classAnalytics(students, loadAttempts(students.map((s) => s.id)), bank(db)) }
  })
  r.get('/api/students/:id/history', (c) => {
    const s = ownStudent(needTeacher(c.req), c.params.id)
    const q = bank(db)
    const at = loadAttempts([s.id]).get(s.id)!
    const sum = summarize(s, at, q)
    const byQ = groupBy(at.filter((a) => a.source === 'question'), (a) => a.itemId)
    const perQuestion = q.filter((x) => byQ.has(x.id)).map((x) => {
      const as = byQ.get(x.id)!
      return { id: x.id, label: x.label, unit: x.unit, tries: as.length, firstCorrect: as.find((a) => a.kind === 'firstIndependent')?.correct ?? null, everCorrect: as.some((a) => a.correct), lastAt: Math.max(...as.map((a) => a.at)) }
    })
    return { student: { id: s.id, username: s.username, name: s.name }, summary: sum, perQuestion, recent: at.slice(-300).reverse() }
  })

  /* ───── 教師:指定練習 ───── */
  r.post('/api/classes/:id/assignments', (c) => {
    const cls = ownClass(needTeacher(c.req), c.params.id)
    const b = body(c)
    const title = str(b.title, '名稱', 1, 60)
    const valid = new Set(bank(db).map((x) => x.id))
    const ids = Array.isArray(b.questionIds) ? [...new Set(b.questionIds.map((x) => str(x, '題目', 1, 40)))] : []
    if (ids.length === 0 || ids.length > 100 || !ids.every((x) => valid.has(x))) throw new HttpError(400, '請選擇 1~100 道存在的題目')
    const due = b.due === undefined || b.due === null ? null : int(b.due, '截止時間')
    const res = run(db, 'INSERT INTO assignments (class_id, title, question_ids, due, created_at) VALUES (?,?,?,?,?)', cls.id, title, JSON.stringify(ids), due, now())
    return { id: Number(res.lastInsertRowid) }
  })
  r.get('/api/classes/:id/assignments', (c) => {
    const cls = ownClass(needTeacher(c.req), c.params.id)
    const students = classStudents(cls.id).filter((s) => !s.disabled)
    const at = loadAttempts(students.map((s) => s.id))
    return {
      students: students.map((s) => ({ id: s.id, name: s.name || s.username })),
      assignments: all<{ id: number; title: string; question_ids: string; due: number | null }>(db, 'SELECT id, title, question_ids, due FROM assignments WHERE class_id = ? ORDER BY created_at DESC', cls.id).map((a) => {
        const ids: string[] = JSON.parse(a.question_ids)
        return { id: a.id, title: a.title, questionIds: ids, due: a.due, progress: assignmentProgress(students, at, ids) }
      }),
    }
  })
  r.del('/api/assignments/:id', (c) => {
    const t = needTeacher(c.req)
    const a = one<{ id: number }>(db, 'SELECT a.id FROM assignments a JOIN classes c ON c.id = a.class_id WHERE a.id = ? AND c.teacher_id = ?', Number(c.params.id), t.id)
    if (!a) throw new HttpError(404, '找不到指定練習')
    run(db, 'DELETE FROM assignments WHERE id = ?', a.id)
    return { ok: true }
  })

  /* ───── 教師:題目審核與編輯 ───── */
  r.get('/api/teacher/questions', (c) => { needTeacher(c.req); return { statuses: STATUSES, questions: bank(db) } })
  r.get('/api/teacher/questions/:qid/versions', (c) => {
    needTeacher(c.req)
    return { versions: all(db, 'SELECT v.version, v.solution, v.stem, v.status, v.edited_at AS editedAt, v.note, u.name AS editedBy FROM question_versions v JOIN users u ON u.id = v.edited_by WHERE v.qid = ? ORDER BY v.version DESC', c.params.qid) }
  })
  r.put('/api/teacher/questions/:qid', (c) => {
    const t = needTeacher(c.req)
    return { version: saveEdit(db, c.params.qid, body(c), t.id, now()) }
  })
  r.post('/api/teacher/questions/:qid/restore', (c) => {
    const t = needTeacher(c.req)
    return { version: restoreVersion(db, c.params.qid, int(body(c).version, 'version'), t.id) }
  })
  r.post('/api/teacher/questions', (c) => {
    const t = needTeacher(c.req)
    return { id: createCustom(db, body(c), t.id, now()) }
  })

  /* ───── 教師:匯出 ───── */
  r.get('/api/classes/:id/export.xlsx', async (c) => {
    const cls = ownClass(needTeacher(c.req), c.params.id)
    const students = classStudents(cls.id).filter((s) => !s.disabled)
    const at = loadAttempts(students.map((s) => s.id))
    const q = bank(db)
    const buf = await buildWorkbook({
      className: cls.name, students, analytics: classAnalytics(students, at, q), attempts: at, bank: q,
      assignments: all<{ title: string; question_ids: string; due: number | null }>(db, 'SELECT title, question_ids, due FROM assignments WHERE class_id = ? ORDER BY created_at', cls.id).map((a) => ({ title: a.title, questionIds: JSON.parse(a.question_ids), due: a.due, progress: assignmentProgress(students, at, JSON.parse(a.question_ids)) })),
    })
    c.res.writeHead(200, { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="class-${cls.id}-learning-records.xlsx"`, 'cache-control': 'no-store' })
    c.res.end(buf)
    return undefined
  })

  /* ───── 主處理器 ───── */
  const security = (res: ServerResponse) => { res.setHeader('x-content-type-options', 'nosniff'); res.setHeader('x-frame-options', 'DENY'); res.setHeader('referrer-policy', 'no-referrer') }

  function serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string): boolean {
    if (!cfg.staticDir || (req.method !== 'GET' && req.method !== 'HEAD')) return false
    const root = resolve(cfg.staticDir)
    let file = normalize(join(root, pathname === '/' ? 'index.html' : pathname))
    if (!file.startsWith(root)) return false
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html')
    if (!existsSync(file)) return false
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600' })
    res.end(req.method === 'HEAD' ? undefined : readFileSync(file))
    return true
  }

  return async (req: IncomingMessage, res: ServerResponse) => {
    security(res)
    const url = new URL(req.url ?? '/', 'http://localhost')
    const origin = req.headers.origin
    if (cfg.corsOrigin && origin === cfg.corsOrigin) {
      res.setHeader('access-control-allow-origin', origin)
      res.setHeader('access-control-allow-headers', 'authorization, content-type')
      res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS')
      res.setHeader('vary', 'origin')
    }
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
    try {
      if (!url.pathname.startsWith('/api/')) {
        if (serveStatic(req, res, decodeURIComponent(url.pathname))) return
        throw new HttpError(404, '找不到頁面')
      }
      const m = r.match(req.method ?? 'GET', url.pathname)
      if (!m) throw new HttpError(r.pathExists(url.pathname) ? 405 : 404, '找不到這個 API')
      const h = req.headers.authorization
      if (h?.startsWith('Bearer ')) {
        const u = one<User & { expires_at: number }>(db, 'SELECT u.id, u.username, u.name, u.role, u.class_id, u.disabled, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?', tokenHash(h.slice(7)))
        if (u && u.expires_at > now() && !u.disabled) ctxUser.set(req, u)
      }
      const data = await m.route.handler({ req, res, params: m.params, query: url.searchParams, body: await readJson(req) })
      if (!res.writableEnded) sendJson(res, 200, data)
    } catch (e) {
      if (res.writableEnded) return
      if (e instanceof HttpError) sendJson(res, e.status, { error: e.message })
      else { console.error('[server error]', e instanceof Error ? e.message : e); sendJson(res, 500, { error: '伺服器發生錯誤' }) }
    }
  }
}
