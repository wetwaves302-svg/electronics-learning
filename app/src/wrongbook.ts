import { useMemo } from 'react'
import { orderWrongBook, wrongBook, type Attempt, type WrongItem } from './core/progress'
import { useQuestions } from './data/bank'
import type { Question } from './data/types'
import { useAttempts } from './store'

/** 依目前的紀錄與題庫,算出排好出題順序的錯題清單(自動蒐集,不需學生收藏) */
export function computeWrong(attempts: Attempt[], qs: Question[], now = Date.now()): WrongItem[] {
  const ids = new Set(qs.map((q) => q.id))
  const self = new Set(qs.filter((q) => q.type === 'open').map((q) => q.id))
  const last = new Map<string, number>()
  for (const a of attempts) if (a.source === 'question') last.set(a.itemId, Math.max(last.get(a.itemId) ?? 0, a.at))
  return orderWrongBook(wrongBook(attempts, ids, self), last, now)
}

export function useWrongBook() {
  const attempts = useAttempts()
  const qs = useQuestions()
  return useMemo(() => computeWrong(attempts, qs), [attempts, qs])
}
