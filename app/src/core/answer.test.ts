import { describe, expect, it } from 'vitest'
import { judgeNumeric, parseQuantity } from './answer'

describe('parseQuantity', () => {
  it('SI 前綴', () => {
    expect(parseQuantity('20 mA')).toEqual({ value: 0.02, unit: 'A' })
    expect(parseQuantity('0.02A')).toEqual({ value: 0.02, unit: 'A' })
    expect(parseQuantity('20kHz')?.value).toBe(20000)
  })
  it('科學記號與 Ω', () => {
    expect(parseQuantity('4.5×10^6')?.value).toBe(4.5e6)
    expect(parseQuantity('1.5e10')?.value).toBe(1.5e10)
    expect(parseQuantity('25Ω')).toEqual({ value: 25, unit: 'Ω' })
    expect(parseQuantity('25 ohm')).toEqual({ value: 25, unit: 'Ω' })
  })
  it('無法解析', () => expect(parseQuantity('abc')).toBeNull())
})

describe('judgeNumeric', () => {
  const spec = { value: 0.02, unit: 'A' }
  it('0.02 A 與 20 mA 為同一數值', () => {
    expect(judgeNumeric('20 mA', spec).ok).toBe(true)
    expect(judgeNumeric('0.02 A', spec).ok).toBe(true)
  })
  it('單位為不同物理量', () => expect(judgeNumeric('20 mV', spec)).toEqual({ ok: false, reason: 'wrongUnit' }))
  it('漏寫單位', () => expect(judgeNumeric('0.02', spec)).toEqual({ ok: false, reason: 'missingUnit' }))
  it('數值錯誤(差 10 倍)', () => expect(judgeNumeric('200 mA', spec)).toEqual({ ok: false, reason: 'outOfTolerance' }))
  it('容許誤差內', () => expect(judgeNumeric('70.7 V', { value: 70.71, unit: 'V' }).ok).toBe(true))
  it('無單位的量(如因數)', () => {
    expect(judgeNumeric('2', { value: 2, unit: '' }).ok).toBe(true)
  })
  it('百分比', () => expect(judgeNumeric('60%', { value: 60, unit: '%' }).ok).toBe(true))
})
