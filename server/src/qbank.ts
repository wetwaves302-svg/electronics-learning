import { questions as baseQuestions } from '../../app/src/data/questions'
import { knowledgePoints } from '../../app/src/data/knowledgePoints'
import { all, one, run, type DB } from './db.ts'
import { HttpError, int, optStr, str } from './http.ts'

export const STATUSES = ['pending', 'calcVerified', 'teacherChecked', 'needsFix', 'published'] as const
export type Status = (typeof STATUSES)[number]
export const UNITS = ['1-1', '1-2', '2-1', '2-2', '2-3'] as const

export interface BankQ {
  id: string; unit: string; kps: string[]; label: string; stem: string; type: string
  status: string; solution: string; version: number; custom: boolean
}

interface EditRow { qid: string; solution: string | null; stem: string | null; status: string; def: string | null; version: number; updated_by: number; updated_at: number }

/** 題庫 = 內建題目 + 教師編輯 + 教師新增。分析、匯出都用這個。 */
export function bank(db: DB): BankQ[] {
  const edits = new Map(all<EditRow>(db, 'SELECT * FROM question_edits').map((e) => [e.qid, e]))
  const out: BankQ[] = baseQuestions.map((q) => {
    const e = edits.get(q.id)
    return { id: q.id, unit: q.unit, kps: q.kps, label: q.source.label, stem: e?.stem ?? q.stem, type: q.type, status: e?.status ?? q.review, solution: e?.solution ?? q.solution, version: e?.version ?? 0, custom: false }
  })
  for (const e of edits.values()) {
    if (!e.def) continue
    const d = JSON.parse(e.def)
    out.push({ id: e.qid, unit: d.unit, kps: d.kps, label: d.label ?? '教師新增題', stem: e.stem ?? d.stem, type: d.type, status: e.status, solution: e.solution ?? d.solution, version: e.version, custom: true })
  }
  return out
}

/** 給學生端套用:教師編輯與新增題的完整內容 */
export function overridesPayload(db: DB) {
  const edits: Record<string, { solution?: string; stem?: string; status: string; version: number }> = {}
  const custom: unknown[] = []
  for (const e of all<EditRow>(db, 'SELECT * FROM question_edits')) {
    if (e.def) {
      const d = JSON.parse(e.def)
      custom.push({
        id: e.qid, type: d.type, unit: d.unit, source: { file: '教師新增', page: 0, label: d.label ?? '教師新增題' }, kps: d.kps,
        stem: e.stem ?? d.stem, solution: e.solution ?? d.solution, review: e.status, ...(d.type === 'mc' ? { options: d.options.map((text: string) => ({ text })), answer: d.answer } : { parts: d.parts }),
      })
    } else {
      edits[e.qid] = { ...(e.solution !== null ? { solution: e.solution } : {}), ...(e.stem !== null ? { stem: e.stem } : {}), status: e.status, version: e.version }
    }
  }
  return { edits, custom }
}

export interface EditInput { solution?: unknown; stem?: unknown; status?: unknown; note?: unknown }

/** 儲存編輯並保留版本紀錄。回傳新版本號。 */
export function saveEdit(db: DB, qid: string, input: EditInput, userId: number, now = Date.now()): number {
  const base = baseQuestions.find((q) => q.id === qid)
  const cur = one<EditRow>(db, 'SELECT * FROM question_edits WHERE qid = ?', qid)
  if (!base && !cur?.def) throw new HttpError(404, '找不到這道題')
  const status = input.status === undefined ? (cur?.status ?? base?.review ?? 'pending') : str(input.status, 'status')
  if (!(STATUSES as readonly string[]).includes(status)) throw new HttpError(400, '狀態不正確')
  const solution = input.solution === undefined ? (cur?.solution ?? null) : optStr(input.solution, 'solution')
  const stem = input.stem === undefined ? (cur?.stem ?? null) : optStr(input.stem, 'stem', 5000)
  const note = input.note === undefined ? '' : (optStr(input.note, 'note', 500) ?? '')
  const version = (cur?.version ?? 0) + 1
  const def = cur?.def ?? null
  db.exec('BEGIN')
  try {
    // 第一次編輯內建題時,先把原始內容存成版本 0,避免覆蓋已驗證的內容
    if (!cur && base) run(db, 'INSERT INTO question_versions (qid,version,solution,stem,status,def,edited_by,edited_at,note) VALUES (?,?,?,?,?,?,?,?,?)', qid, 0, base.solution, base.stem, base.review, null, userId, now, '原始內容(內建題庫)')
    run(db, 'INSERT INTO question_versions (qid,version,solution,stem,status,def,edited_by,edited_at,note) VALUES (?,?,?,?,?,?,?,?,?)', qid, version, solution, stem, status, def, userId, now, note)
    run(db, 'INSERT INTO question_edits (qid,solution,stem,status,def,version,updated_by,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(qid) DO UPDATE SET solution=excluded.solution, stem=excluded.stem, status=excluded.status, version=excluded.version, updated_by=excluded.updated_by, updated_at=excluded.updated_at', qid, solution, stem, status, def, version, userId, now)
    db.exec('COMMIT')
  } catch (e) { db.exec('ROLLBACK'); throw e }
  return version
}

/** 還原到某個版本(會產生新版本,不會刪除任何歷史) */
export function restoreVersion(db: DB, qid: string, version: number, userId: number): number {
  const v = one<{ solution: string | null; stem: string | null; status: string }>(db, 'SELECT solution, stem, status FROM question_versions WHERE qid = ? AND version = ?', qid, version)
  if (!v) throw new HttpError(404, '找不到這個版本')
  return saveEdit(db, qid, { solution: v.solution ?? '', stem: v.stem ?? undefined, status: v.status, note: `還原自版本 ${version}` }, userId)
}

export function createCustom(db: DB, input: Record<string, unknown>, userId: number, now = Date.now()): string {
  const unit = str(input.unit, 'unit')
  if (!(UNITS as readonly string[]).includes(unit)) throw new HttpError(400, '單元不在段考範圍內')
  const type = str(input.type, 'type')
  if (type !== 'mc' && type !== 'numeric') throw new HttpError(400, '題型必須是 mc 或 numeric')
  const kps = Array.isArray(input.kps) ? input.kps.map((k) => str(k, 'kp', 1, 20)) : []
  const kpSet = new Set(knowledgePoints.map((k) => k.id))
  if (kps.length === 0 || !kps.every((k) => kpSet.has(k))) throw new HttpError(400, '至少要選一個存在的知識點')
  const stem = str(input.stem, 'stem', 3, 5000)
  const solution = str(input.solution, 'solution', 1, 20000)
  const label = optStr(input.label, 'label', 60) ?? '教師新增題'
  const def: Record<string, unknown> = { unit, type, kps, stem, solution, label }
  if (type === 'mc') {
    const opts = Array.isArray(input.options) ? input.options.map((o) => str(o, 'option', 1, 500)) : []
    if (opts.length < 2 || opts.length > 6) throw new HttpError(400, '選項需 2~6 個')
    const answer = int(input.answer, 'answer')
    if (answer < 0 || answer >= opts.length) throw new HttpError(400, '正確選項索引無效')
    def.options = opts; def.answer = answer
  } else {
    const parts = Array.isArray(input.parts) ? input.parts : []
    if (parts.length < 1 || parts.length > 6) throw new HttpError(400, '數值題需 1~6 個作答欄位')
    def.parts = parts.map((p: Record<string, unknown>) => {
      if (typeof p?.value !== 'number' || !Number.isFinite(p.value)) throw new HttpError(400, '標準答案必須是數字')
      return { label: str(p.label, 'label', 1, 40), value: p.value, unit: typeof p.unit === 'string' ? p.unit.slice(0, 8) : '', relTol: typeof p.relTol === 'number' && p.relTol > 0 && p.relTol < 0.5 ? p.relTol : 0.01 }
    })
  }
  const row = one<{ n: number }>(db, "SELECT COUNT(*) AS n FROM question_edits WHERE qid LIKE 'CUS-%'")
  let n = (row?.n ?? 0) + 1
  let qid = `CUS-${String(n).padStart(3, '0')}`
  while (one(db, 'SELECT 1 FROM question_edits WHERE qid = ?', qid)) qid = `CUS-${String(++n).padStart(3, '0')}`
  const json = JSON.stringify(def)
  db.exec('BEGIN')
  try {
    run(db, 'INSERT INTO question_edits (qid,solution,stem,status,def,version,updated_by,updated_at) VALUES (?,?,?,?,?,?,?,?)', qid, null, null, 'pending', json, 1, userId, now)
    run(db, 'INSERT INTO question_versions (qid,version,solution,stem,status,def,edited_by,edited_at,note) VALUES (?,?,?,?,?,?,?,?,?)', qid, 1, solution, stem, 'pending', json, userId, now, '新增題目')
    db.exec('COMMIT')
  } catch (e) { db.exec('ROLLBACK'); throw e }
  return qid
}
