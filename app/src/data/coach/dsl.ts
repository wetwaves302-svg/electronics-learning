import type { CoachStep, NumericPart, Variant, VariantQ } from '../types'

type Id = CoachStep['id']

/** 簡潔撰寫教練步驟:ask = [問題, 正確選項, 錯誤選項...](正確選項位置之後由 spreadCoach 分散) */
export function st(
  id: Id, title: string, teach: string, ask: [string, string, ...string[]], why: string, mistake: string,
  hints: [string, string, string], math?: CoachStep['math'],
): CoachStep {
  const [prompt, ...opts] = ask
  return { id, title, teach, ask: { prompt, options: opts, answer: 0, why }, commonMistake: mistake, hints, math }
}

export const pick = <T,>(arr: readonly T[], seed: number): T => arr[((seed % arr.length) + arr.length) % arr.length]
export const r2 = (x: number) => Math.round(x * 100) / 100
export const r3 = (x: number) => Math.round(x * 1000) / 1000

export const numVariant = (f: (seed: number) => { stem: string; part: NumericPart }): Variant => ({ make: (seed) => f(seed) })

/** 選擇題變化題:correct 為正確選項,wrongs 為錯誤選項;位置依種子輪替(固定演算法) */
export function mcVariantQ(stem: string, correct: string, wrongs: string[], why: string, seed: number): VariantQ {
  const opts = [correct, ...wrongs]
  const target = ((seed % opts.length) + opts.length) % opts.length
  const out = [...opts]
  ;[out[0], out[target]] = [out[target], out[0]]
  return { stem, options: out, answer: target, why }
}
export const mcVariant = (f: (seed: number) => { stem: string; correct: string; wrongs: string[]; why: string }): Variant => ({
  make: (seed) => { const v = f(seed); return mcVariantQ(v.stem, v.correct, v.wrongs, v.why, seed) },
})
