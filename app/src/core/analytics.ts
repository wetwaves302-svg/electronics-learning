import { errorCounts, itemMastery, kpStats, type Attempt } from './progress'
import { knowledgePoints } from '../data/knowledgePoints'

/** 分析只需要題目的基本資料 */
export interface BankQ { id: string; unit: string; label: string }

const DAY = 86_400_000

export interface StudentRef { id: number; username: string; name: string }
export interface StudentSummary {
  id: number; username: string; name: string
  tried: number; coverage: number
  firstTotal: number; firstCorrect: number; firstRate: number | null
  independent: number; stuck: number
  gameAttempts: number; lessonAttempts: number
  lastActive: number | null
  topErrors: [string, number][]
  weakKps: { id: string; title: string; mastery: string }[]
  needsHelp: boolean; helpReasons: string[]
}

/** 需補救條件:首次作答 ≥ 5 次且首次答對率 < 50%;或有 ≥ 3 題一直沒答對 */
export const HELP_MIN_FIRST = 5
export const HELP_RATE = 0.5
export const HELP_STUCK = 3

export function groupBy<T>(rows: T[], key: (r: T) => string | number) {
  const m = new Map<string | number, T[]>()
  for (const r of rows) { const k = key(r); (m.get(k) ?? m.set(k, []).get(k)!).push(r) }
  return m
}

export function summarize(student: StudentRef, attempts: Attempt[], q: BankQ[]): StudentSummary {
  const ids = new Set(q.map((x) => x.id))
  const qa = attempts.filter((a) => a.source === 'question' && ids.has(a.itemId))
  const byItem = groupBy(qa, (a) => a.itemId)
  const masteries = [...byItem.entries()].map(([id, as]) => ({ id, m: itemMastery(as) }))
  const firsts = qa.filter((a) => a.kind === 'firstIndependent')
  const firstCorrect = firsts.filter((a) => a.correct).length
  const stuck = masteries.filter((x) => x.m === 'attempted').length
  const independent = masteries.filter((x) => x.m === 'independent' || x.m === 'retained').length
  const firstRate = firsts.length ? firstCorrect / firsts.length : null
  const reasons: string[] = []
  if (firsts.length >= HELP_MIN_FIRST && (firstRate ?? 1) < HELP_RATE) reasons.push(`首次獨立答對率 ${Math.round((firstRate ?? 0) * 100)}%(低於 ${HELP_RATE * 100}%)`)
  if (stuck >= HELP_STUCK) reasons.push(`有 ${stuck} 題還沒答對過`)
  const weak = knowledgePoints.map((k) => kpStats(k.id, attempts)).filter((s) => s.mastery === 'attempted' || s.mastery === 'everCorrect')
  return {
    id: student.id, username: student.username, name: student.name,
    tried: byItem.size, coverage: q.length ? byItem.size / q.length : 0,
    firstTotal: firsts.length, firstCorrect, firstRate,
    independent, stuck,
    gameAttempts: attempts.filter((a) => a.source === 'game').length,
    lessonAttempts: attempts.filter((a) => a.source === 'lesson').length,
    lastActive: attempts.length ? Math.max(...attempts.map((a) => a.at)) : null,
    topErrors: Object.entries(errorCounts(attempts)).sort((a, b) => b[1] - a[1]).slice(0, 3),
    weakKps: weak.map((s) => ({ id: s.kp, title: knowledgePoints.find((k) => k.id === s.kp)!.title, mastery: s.mastery })),
    needsHelp: reasons.length > 0, helpReasons: reasons,
  }
}

export interface QuestionStat { id: string; unit: string; label: string; students: number; firstTotal: number; firstCorrect: number; firstRate: number | null; topError: string | null }
export interface UnitStat { unit: string; questions: number; avgIndependentRatio: number; studentsDone: number }

export function classAnalytics(students: StudentRef[], attemptsByUser: Map<number, Attempt[]>, q: BankQ[]) {
  const summaries = students.map((s) => summarize(s, attemptsByUser.get(s.id) ?? [], q))
  const questionStats: QuestionStat[] = q.map((x) => {
    let studentsTried = 0, firstTotal = 0, firstCorrect = 0
    const errs: Record<string, number> = {}
    for (const s of students) {
      const as = (attemptsByUser.get(s.id) ?? []).filter((a) => a.itemId === x.id && a.source === 'question')
      if (as.length) studentsTried++
      for (const a of as) {
        if (a.kind === 'firstIndependent') { firstTotal++; if (a.correct) firstCorrect++ }
        if (!a.correct && a.errorType) errs[a.errorType] = (errs[a.errorType] ?? 0) + 1
      }
    }
    const top = Object.entries(errs).sort((a, b) => b[1] - a[1])[0]
    return { id: x.id, unit: x.unit, label: x.label, students: studentsTried, firstTotal, firstCorrect, firstRate: firstTotal ? firstCorrect / firstTotal : null, topError: top ? top[0] : null }
  })
  const units = [...new Set(q.map((x) => x.unit))].sort()
  const unitStats: UnitStat[] = units.map((u) => {
    const qs = q.filter((x) => x.unit === u)
    const ratios = students.map((s) => {
      const as = (attemptsByUser.get(s.id) ?? []).filter((a) => a.source === 'question')
      const ok = qs.filter((x) => { const m = itemMastery(as.filter((a) => a.itemId === x.id)); return m === 'independent' || m === 'retained' }).length
      return qs.length ? ok / qs.length : 0
    })
    return { unit: u, questions: qs.length, avgIndependentRatio: ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0, studentsDone: ratios.filter((r) => r >= 0.8).length }
  })
  const errTotals: Record<string, number> = {}
  for (const s of students) for (const [k, n] of Object.entries(errorCounts(attemptsByUser.get(s.id) ?? []))) errTotals[k] = (errTotals[k] ?? 0) + n
  return {
    students: summaries,
    questions: questionStats,
    units: unitStats,
    commonErrors: Object.entries(errTotals).sort((a, b) => b[1] - a[1]),
    needHelp: summaries.filter((s) => s.needsHelp).map((s) => ({ id: s.id, name: s.name || s.username, reasons: s.helpReasons })),
    hardest: questionStats.filter((x) => x.firstTotal >= 3).sort((a, b) => (a.firstRate ?? 1) - (b.firstRate ?? 1)).slice(0, 5),
  }
}

export interface AssignmentProgress { studentId: number; done: number; independent: number; total: number }
export function assignmentProgress(students: StudentRef[], attemptsByUser: Map<number, Attempt[]>, questionIds: string[]): AssignmentProgress[] {
  return students.map((s) => {
    const as = (attemptsByUser.get(s.id) ?? []).filter((a) => a.source === 'question')
    let done = 0, independent = 0
    for (const id of questionIds) {
      const m = itemMastery(as.filter((a) => a.itemId === id))
      if (m === 'everCorrect' || m === 'independent' || m === 'retained') done++
      if (m === 'independent' || m === 'retained') independent++
    }
    return { studentId: s.id, done, independent, total: questionIds.length }
  })
}

export const isInactive = (s: StudentSummary, now: number, days = 7) => s.lastActive === null || now - s.lastActive > days * DAY
