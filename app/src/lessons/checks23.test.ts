import { describe, expect, it } from 'vitest'
import { checks23 } from './checks23'

describe('2-3 小檢核答案', () => {
  const expected: Record<string, string> = {
    'LC-23-1': '20 V', 'LC-23-2': '120 Hz', 'LC-23-3': '2,2', 'LC-23-4': '3.18 V', 'LC-23-5': '48%', 'LC-23-6': '變小',
  }
  it('可計算題的答案由核心/求解器重算後一致', () => {
    for (const c of checks23) expect(c.verify!(), c.id).toBe(expected[c.id])
  })
  it('標示的正確選項文字與重算值一致', () => {
    const pick = (id: string) => { const c = checks23.find((x) => x.id === id)!; return c.options[c.answer] }
    expect(pick('LC-23-1')).toBe('20 V')
    expect(pick('LC-23-2')).toBe('120 Hz')
    expect(pick('LC-23-3')).toBe('2 顆')
    expect(pick('LC-23-4')).toBe('3.18 V')
    expect(pick('LC-23-5')).toBe('48%')
    expect(pick('LC-23-6')).toBe('變小')
  })
})
