import { useSyncExternalStore } from 'react'
import { questions as base } from './questions'
import type { Question, ReviewStatus } from './types'

/**
 * 目前使用中的題庫 = 內建題庫 + 老師的修訂 + 老師新增的題目。
 * 離線時使用最後一次下載的版本(快取在 localStorage)。
 */
export interface Overrides {
  edits: Record<string, { solution?: string; stem?: string; status: string; version: number }>
  custom: Question[]
}
const CACHE_KEY = 'electronics-overrides-v1'
let current: Question[] = base
const subs = new Set<() => void>()

export function merge(o: Overrides | null): Question[] {
  if (!o) return base
  const edited = base.map((q) => {
    const e = o.edits[q.id]
    return e ? { ...q, ...(e.solution !== undefined ? { solution: e.solution, solutionAuthoredByUs: false } : {}), ...(e.stem !== undefined ? { stem: e.stem } : {}), review: e.status as ReviewStatus, teacherVersion: e.version } : q
  })
  return [...edited, ...o.custom.map((c) => ({ ...c, teacherVersion: 1 }) as Question)]
}

export function applyOverrides(o: Overrides | null) {
  current = merge(o)
  subs.forEach((f) => f())
}

export async function loadOverrides(fetcher: () => Promise<Overrides>) {
  try { const raw = localStorage.getItem(CACHE_KEY); if (raw) applyOverrides(JSON.parse(raw) as Overrides) } catch { /* ignore */ }
  try {
    const o = await fetcher()
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(o)) } catch { /* ignore */ }
    applyOverrides(o)
  } catch { /* 連不上伺服器:沿用快取或內建題庫 */ }
}

export const getQuestions = () => current
export const getQuestion = (id: string) => current.find((q) => q.id === id)
export const useQuestions = () => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb) } }, () => current)
