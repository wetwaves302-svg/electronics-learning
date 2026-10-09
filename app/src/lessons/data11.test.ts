import { describe, expect, it } from 'vitest'
import { FOUR_C, IC_LEVELS, MFG_STEPS, PERIODS } from './data11'
import { checks11 } from './checks11'

describe('1-1 教學資料(講義)', () => {
  it('製造流程依序為 a~l 共 12 步,前 6 步晶圓處理、後 6 步測試與封裝', () => {
    expect(MFG_STEPS.map((s) => s.letter).join('')).toBe('abcdefghijkl')
    expect(MFG_STEPS.slice(0, 6).every((s) => s.phase === '晶圓處理')).toBe(true)
    expect(MFG_STEPS.slice(6).every((s) => s.phase === '測試與封裝')).toBe(true)
  })
  it('IC 規模共 6 級,首為單電晶體、末為 ULSI,名稱不重複', () => {
    expect(IC_LEVELS).toHaveLength(6)
    expect(IC_LEVELS[0].name).toBe('單電晶體')
    expect(IC_LEVELS[5].name).toBe('ULSI')
    expect(new Set(IC_LEVELS.map((l) => l.name)).size).toBe(6)
  })
  it('人物年代:出生年 < 逝世年;諾貝爾獎年代為 4 位數', () => {
    for (const p of PERIODS.flatMap((x) => x.people)) {
      const [b, d] = p.years.split('~').map(Number)
      expect(b).toBeLessThan(d)
      for (const y of p.nobel?.match(/\d+/g) ?? []) expect(y).toHaveLength(4)
    }
  })
  it('三位電晶體發明者(卜拉登、巴定、蕭特力)都在電晶體時期,且 1956 年得獎', () => {
    const t = PERIODS.find((p) => p.id === 'transistor')!
    expect(t.people.map((x) => x.name).sort()).toEqual(['卜拉登', '巴定', '蕭特力'].sort())
    for (const x of t.people) expect(x.nobel).toContain('1956')
  })
  it('兩種 4C 各 4 項', () => {
    expect(FOUR_C.application.items).toHaveLength(4)
    expect(FOUR_C.integration.items).toHaveLength(4)
  })
})

describe('1-1 小檢核答案由教學資料重算', () => {
  const expected: Record<string, string> = { 'LC-11-1': '真空管時期', 'LC-11-2': '基爾比', 'LC-11-3': '2 次', 'LC-11-4': 'ULSI', 'LC-11-5': '之後', 'LC-11-6': '車用(汽車)電子' }
  it('verify 結果等於預期,且標示的正確選項與之相符', () => {
    for (const c of checks11) {
      expect(c.verify!(), c.id).toBe(expected[c.id])
      expect(c.options[c.answer], c.id).toBe(expected[c.id])
    }
  })
})
