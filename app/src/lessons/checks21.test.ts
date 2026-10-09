import { describe, expect, it } from 'vitest'
import { checks21 } from './checks21'

describe('2-1 小檢核答案由核心重算', () => {
  const expected: Record<string, string> = {
    'LC-21-1': '4 個', 'LC-21-2': '不能', 'LC-21-3': '變大', 'LC-21-4': 'N 型', 'LC-21-5': '少數載子', 'LC-21-6': '13 次方', 'LC-21-7': '1.6e-19',
  }
  it('verify 與預期一致', () => { for (const c of checks21) expect(c.verify!(), c.id).toBe(expected[c.id]) })
  it('標示的正確選項文字對應預期', () => {
    const pick = (id: string) => { const c = checks21.find((x) => x.id === id)!; return c.options[c.answer] }
    expect(pick('LC-21-1')).toBe('4 個')
    expect(pick('LC-21-3')).toBe('變大')
    expect(pick('LC-21-4')).toBe('N 型')
    expect(pick('LC-21-5')).toBe('少數載子')
    expect(pick('LC-21-6')).toContain('10¹³')
    expect(pick('LC-21-7')).toBe('1.6×10⁻¹⁹ J')
    expect(pick('LC-21-2')).toContain('不能')
  })
})
