import { classAnalytics, summarize, groupBy, type BankQ, type StudentRef } from './core/analytics'
import type { Attempt } from './core/progress'
import { decodeBatch } from './collect'
import { parseCsv } from './csv'

export interface BoardData { students: StudentRef[]; attempts: Map<number, Attempt[]>; rows: number; badRows: number }

/** 把 Google 試算表匯出的 CSV 還原成每位學生的作答紀錄(依「項目+時間」去重,同一筆有錯誤類型者優先) */
export function buildBoard(csv: string): BoardData {
  const rows = parseCsv(csv)
  if (rows.length < 2) return { students: [], attempts: new Map(), rows: 0, badRows: 0 }
  const head = rows[0]
  let ci = head.findIndex((h) => h.includes('學生'))
  let cd = head.findIndex((h) => h.includes('紀錄'))
  if (ci < 0 || cd < 0) { ci = 1; cd = 2 }
  const byStudent = new Map<string, Map<string, Attempt>>()
  let bad = 0
  for (const r of rows.slice(1)) {
    const who = (r[ci] ?? '').trim()
    const list = decodeBatch(r[cd] ?? '')
    if (!who || list.length === 0) { bad++; continue }
    const m = byStudent.get(who) ?? new Map<string, Attempt>()
    for (const a of list) {
      const k = `${a.itemId}|${a.at}`
      const old = m.get(k)
      if (!old || (!old.errorType && a.errorType)) m.set(k, a)
    }
    byStudent.set(who, m)
  }
  const students: StudentRef[] = [...byStudent.keys()].sort((a, b) => a.localeCompare(b, 'zh-Hant')).map((label, i) => ({ id: i + 1, username: label, name: label }))
  const attempts = new Map<number, Attempt[]>()
  students.forEach((s) => attempts.set(s.id, [...byStudent.get(s.name)!.values()].sort((x, y) => x.at - y.at)))
  return { students, attempts, rows: rows.length - 1, badRows: bad }
}

export function boardAnalytics(d: BoardData, bank: BankQ[]) { return classAnalytics(d.students, d.attempts, bank) }
export function studentDetail(d: BoardData, id: number, bank: BankQ[]) {
  const s = d.students.find((x) => x.id === id)!
  const at = d.attempts.get(id) ?? []
  const byQ = groupBy(at.filter((a) => a.source === 'question'), (a) => a.itemId)
  return {
    student: s, summary: summarize(s, at, bank),
    perQuestion: bank.filter((x) => byQ.has(x.id)).map((x) => { const as = byQ.get(x.id)!; return { id: x.id, label: x.label, unit: x.unit, tries: as.length, firstCorrect: as.find((a) => a.kind === 'firstIndependent')?.correct ?? null, everCorrect: as.some((a) => a.correct), lastAt: Math.max(...as.map((a) => a.at)) } }),
    recent: [...at].reverse().slice(0, 300),
  }
}
