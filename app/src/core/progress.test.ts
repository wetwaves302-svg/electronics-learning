import { describe, expect, it } from 'vitest'
import { type Attempt, errorCounts, isDue, itemMastery, kpStats, nextReviewAt } from './progress'

const D = 86_400_000
const mk = (o: Partial<Attempt>): Attempt => ({
  itemId: 'q1', source: 'question', kps: ['KP-A'], correct: true, kind: 'firstIndependent', at: 0, ...o,
})

describe('itemMastery', () => {
  it('沒有紀錄', () => expect(itemMastery([])).toBe('unseen'))
  it('只有答錯', () => expect(itemMastery([mk({ correct: false })])).toBe('attempted'))
  it('用提示後答對只算曾經答對', () => {
    expect(itemMastery([mk({ correct: false }), mk({ kind: 'hinted', at: 1 })])).toBe('everCorrect')
  })
  it('看完解析後答對不算精熟', () => {
    expect(itemMastery([mk({ correct: false }), mk({ kind: 'afterSolution', at: 1 })])).toBe('everCorrect')
  })
  it('第一次獨立答對', () => expect(itemMastery([mk({})])).toBe('independent'))
  it('隔天延宕複習仍答對', () => {
    expect(itemMastery([mk({}), mk({ kind: 'delayedReview', at: 2 * D })])).toBe('retained')
  })
  it('同一天內的延宕複習不算隔一段時間', () => {
    expect(itemMastery([mk({}), mk({ kind: 'delayedReview', at: 1000 })])).toBe('independent')
  })
})

describe('kpStats', () => {
  it('同一題重複答對不會讓知識點進入「能獨立答對」', () => {
    const a = [mk({ at: 0 }), mk({ kind: 'delayedReview', at: 1000 })]
    expect(kpStats('KP-A', a).mastery).not.toBe('independent')
  })
  it('兩個不同題目獨立答對才算能獨立答對', () => {
    const a = [mk({ itemId: 'q1' }), mk({ itemId: 'q2' })]
    const s = kpStats('KP-A', a)
    expect(s.mastery).toBe('independent')
    expect(s.firstCorrect).toBe(2)
  })
  it('首次獨立作答統計與是否答對', () => {
    const a = [mk({ itemId: 'q1', correct: false }), mk({ itemId: 'q1', kind: 'hinted', at: 1 })]
    const s = kpStats('KP-A', a)
    expect(s.firstTotal).toBe(1)
    expect(s.firstCorrect).toBe(0)
    expect(s.mastery).toBe('everCorrect')
  })
  it('只看與該知識點有關的紀錄', () => {
    expect(kpStats('KP-B', [mk({})]).mastery).toBe('unseen')
  })
})

describe('延宕複習排程', () => {
  it('首次獨立答對 → 1 天後複習', () => expect(nextReviewAt([mk({})])).toBe(1 * D))
  it('連續答對間隔拉長:1 → 3 → 7 → 14', () => {
    const a = [
      mk({ at: 0 }),
      mk({ kind: 'delayedReview', at: 1 * D }),
      mk({ kind: 'delayedReview', at: 4 * D }),
      mk({ kind: 'delayedReview', at: 11 * D }),
    ]
    expect(nextReviewAt(a)).toBe(11 * D + 14 * D)
  })
  it('答錯後退回 1 天', () => {
    const a = [mk({ at: 0 }), mk({ kind: 'delayedReview', at: 1 * D }), mk({ kind: 'delayedReview', at: 4 * D, correct: false })]
    expect(nextReviewAt(a)).toBe(4 * D + 1 * D)
  })
  it('isDue 判斷', () => {
    expect(isDue([mk({})], 0.5 * D)).toBe(false)
    expect(isDue([mk({})], 1 * D)).toBe(true)
  })
})

describe('errorCounts', () => {
  it('只統計答錯且有分類的紀錄', () => {
    const a = [mk({ correct: false, errorType: 'unit' }), mk({ correct: false, errorType: 'unit' }), mk({ correct: false })]
    expect(errorCounts(a)).toEqual({ unit: 2 })
  })
})

import { orderWrongBook, wrongBook, REVIEW_COOLDOWN_MS } from './progress'

describe('錯題本(自動蒐集)', () => {
  const Q = new Set(['q1', 'q2', 'q3', 'q4'])
  const w = (a: Attempt[], self = new Set<string>()) => wrongBook(a, Q, self)
  it('第一次獨立答錯的題目自動進入錯題本', () => {
    const r = w([mk({ correct: false, at: 5 })])
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ itemId: 'q1', reason: 'never', lastWrongAt: 5, wrongCount: 1 })
  })
  it('答對的題目、從來沒答錯的題目不在錯題本', () => {
    expect(w([mk({}), mk({ itemId: 'q2', kind: 'hinted', at: 3 })])).toEqual([])
  })
  it('答錯後用提示答對:仍在錯題本(靠提示答對,還沒獨立答對)', () => {
    const r = w([mk({ correct: false, at: 1 }), mk({ kind: 'hinted', at: 2 })])
    expect(r[0].reason).toBe('hintOnly')
  })
  it('答錯後看過解析再答對:仍在錯題本', () => {
    expect(w([mk({ correct: false, at: 1 }), mk({ kind: 'afterSolution', at: 2 })])[0].reason).toBe('hintOnly')
  })
  it('答錯後,之後有一次獨立答對(延宕複習)才移出錯題本', () => {
    expect(w([mk({ correct: false, at: 1 }), mk({ kind: 'hinted', at: 2 }), mk({ kind: 'delayedReview', at: 3 })])).toEqual([])
  })
  it('曾經獨立答對,後來複習時又答錯:回到錯題本(relapse)', () => {
    const r = w([mk({ at: 1 }), mk({ kind: 'delayedReview', correct: false, at: 2 })])
    expect(r[0]).toMatchObject({ reason: 'relapse', lastWrongAt: 2 })
  })
  it('較早的獨立答對不能抵銷較晚的答錯', () => {
    expect(w([mk({ correct: false, at: 1 }), mk({ kind: 'delayedReview', at: 2 }), mk({ kind: 'delayedReview', correct: false, at: 3 })])).toHaveLength(1)
  })
  it('只看習作題:遊戲、教學檢核、不在題庫內的紀錄不會進錯題本', () => {
    expect(w([mk({ source: 'game', correct: false }), mk({ source: 'lesson', correct: false, itemId: 'q2' }), mk({ itemId: 'V:q1:0', correct: false })])).toEqual([])
  })
  it('自評題:答錯後有較晚的答對就移出(因為自評無法算獨立答對)', () => {
    const a = [mk({ itemId: 'q3', correct: false, kind: 'afterSolution', at: 1 }), mk({ itemId: 'q3', correct: true, kind: 'afterSolution', at: 2 })]
    expect(w(a)).toHaveLength(1)
    expect(w(a, new Set(['q3']))).toEqual([])
  })
  it('記錄錯誤類型與次數(取最近一次答錯)', () => {
    const r = w([mk({ correct: false, at: 1, errorType: 'unit' }), mk({ correct: false, kind: 'hinted', at: 2, errorType: 'arithmetic' })])
    expect(r[0]).toMatchObject({ errorType: 'arithmetic', wrongCount: 2 })
  })
  it('出題順序:沒答對過 → 後來又錯 → 靠提示答對;冷卻中的排最後', () => {
    const items = [
      { itemId: 'hint', reason: 'hintOnly' as const, lastWrongAt: 10, wrongCount: 1 },
      { itemId: 'never', reason: 'never' as const, lastWrongAt: 5, wrongCount: 1 },
      { itemId: 'relapse', reason: 'relapse' as const, lastWrongAt: 7, wrongCount: 1 },
      { itemId: 'coolNever', reason: 'never' as const, lastWrongAt: 20, wrongCount: 1 },
    ]
    const now = 10_000_000
    const last = new Map([['coolNever', now - 60_000]])
    expect(orderWrongBook(items, last, now).map((x) => x.itemId)).toEqual(['never', 'relapse', 'hint', 'coolNever'])
    expect(orderWrongBook(items, new Map([['coolNever', now - REVIEW_COOLDOWN_MS - 1]]), now)[0].itemId).toBe('coolNever') // 冷卻結束後同等級中較新答錯者優先
  })
})
