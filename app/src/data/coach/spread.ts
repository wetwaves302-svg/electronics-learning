import type { CoachStep } from '../types'

const hash = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }

/** 把選項中的正確答案移到依「題目+步驟」決定的位置(固定演算法,不是隨機),避免正確答案總在第一個。 */
export function spreadOptions(options: string[], answer: number, key: string): { options: string[]; answer: number } {
  const target = hash(key) % options.length
  const out = [...options]
  ;[out[answer], out[target]] = [out[target], out[answer]]
  return { options: out, answer: target }
}

export function spreadCoach(qid: string, steps: CoachStep[]): CoachStep[] {
  return steps.map((s) => ({ ...s, ask: { ...s.ask, ...spreadOptions(s.ask.options, s.ask.answer, `${qid}:${s.id}`) } }))
}
