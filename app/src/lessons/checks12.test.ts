import { describe, expect, it } from 'vitest'
import { checks12 } from './checks12'

describe('1-2 小檢核答案', () => {
  const expected: Record<string, string> = {
    'LC-12-2': '40 Hz', 'LC-12-3': '155.56 V', 'LC-12-4': '2 V', 'LC-12-5': 'FF=1 CF=1', 'LC-12-6': '5 V',
  }
  it('可計算題的標準答案由計算核心重算後一致', () => {
    for (const c of checks12) {
      if (!c.verify) continue
      expect(c.verify(), c.id).toBe(expected[c.id])
    }
  })
  it('標示的正確選項文字與重算值一致', () => {
    const pick = (id: string) => { const c = checks12.find((x) => x.id === id)!; return c.options[c.answer] }
    expect(pick('LC-12-2')).toBe('40 Hz')
    expect(pick('LC-12-4')).toBe('2 V')
    expect(pick('LC-12-6')).toBe('5 V')
    expect(pick('LC-12-5')).toBe('方波')
    expect(pick('LC-12-3')).toBe('有效值')
  })
  it('每題 answer 在選項範圍內', () => {
    for (const c of checks12) { expect(c.answer).toBeGreaterThanOrEqual(0); expect(c.answer).toBeLessThan(c.options.length) }
  })
})
