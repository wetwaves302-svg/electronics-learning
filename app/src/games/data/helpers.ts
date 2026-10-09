import type { CalcItem, ChoiceItem, ClassifyItem, MatchItem, MatchPair, ClassifyThing, Visual } from '../types'

/** 選擇題:正確選項的位置依題序輪替(固定演算法),避免總在同一個位置 */
export function ch(i: number, kp: string, can: string, prompt: string, correct: string, wrongs: string[], hint: string, explain: string, visual?: Visual): ChoiceItem {
  const opts = [correct, ...wrongs]
  const target = i % opts.length
  const out = [...opts]
  ;[out[0], out[target]] = [out[target], out[0]]
  return { kind: 'choice', kp, can, prompt, visual, options: out.map((text) => ({ text })), answer: target, hint, explain }
}

export const match = (prompt: string, pairs: MatchPair[], hint: string, explain: string): MatchItem => ({ kind: 'match', prompt, pairs, hint, explain })
export const pair = (left: string, right: string, kp: string, can: string): MatchPair => ({ left, right, kp, can })
export const classify = (prompt: string, buckets: string[], things: ClassifyThing[], hint: string, explain: string): ClassifyItem => ({ kind: 'classify', prompt, buckets, things, hint, explain })
export const thing = (text: string, bucket: number, kp: string, can: string): ClassifyThing => ({ text, bucket, kp, can })
export const calc = (kp: string, can: string, prompt: string, label: string, value: number, unit: string, hint: string, explain: string, relTol = 0.01): CalcItem => ({ kind: 'calc', kp, can, prompt, part: { label, value, unit, relTol }, hint, explain })
