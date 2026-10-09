import { describe, expect, it } from 'vitest'
import { checks22 } from './checks22'

describe('2-2 小檢核答案由核心重算', () => {
  const expected: Record<string, string> = {
    'LC-22-1': 'P 型與 N 型半導體接合時', 'LC-22-2': '變窄', 'LC-22-3': '12.5 Ω', 'LC-22-4': '650 Ω', 'LC-22-5': '0.55 V', 'LC-22-6': '4.3 mA',
  }
  it('verify 與預期一致,且標示的正確選項與之相符', () => {
    for (const c of checks22) {
      expect(c.verify!(), c.id).toBe(expected[c.id])
      const opt = c.options[c.answer]
      expect(opt === expected[c.id] || opt === expected[c.id].replace('一致', ''), `${c.id}: ${opt}`).toBe(true)
    }
  })
})
