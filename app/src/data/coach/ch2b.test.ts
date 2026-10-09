import { describe, expect, it } from 'vitest'
import { questions } from '../questions'
import { dopantConcentration, dynamicResistance, fullWave, halfWave, filteredDc, forwardDropAtTemp, minorityCarrier } from '../../core/physics'
import { solveRectifier } from '../../core/rectifier'
import { mc07Solve } from './ch2b'
import { QA01_SPECS } from '../../figures/circuits'
import type { VariantQ } from '../types'

const num = (v: VariantQ) => { if (!('part' in v)) throw new Error('not numeric'); return v }
const q = (id: string) => questions.find((x) => x.id === id)!

describe('第 2 章教練引用的數值經核心與求解器重算', () => {
  it('MC-03:Nd = 5×10¹³,p = 4.5×10⁶,(1.5×10¹⁰)² = 2.25×10²⁰,p < ni', () => {
    const nd = dopantConcentration(5e22, 1e9)
    expect(nd).toBeCloseTo(5e13, -3)
    expect(minorityCarrier(1.5e10, nd)).toBeCloseTo(4.5e6, -2)
    expect(1.5e10 ** 2).toBeCloseTo(2.25e20, -10)
    expect(minorityCarrier(1.5e10, nd)).toBeLessThan(1.5e10)
  })
  it('MC-05:rd = 25 mV/1 mA = 25 Ω;靜態電阻 600 Ω;10 mA 時 2.5 Ω;電流愈大 rd 愈小', () => {
    expect(dynamicResistance(1e-3)).toBeCloseTo(25, 9)
    expect(0.6 / 1e-3).toBeCloseTo(600, 9)
    expect(dynamicResistance(10e-3)).toBeCloseTo(2.5, 9)
    expect(dynamicResistance(2e-3)).toBeLessThan(dynamicResistance(1e-3))
  })
  it('MC-07:D1 導通、D2 截止,Vo = 3 V,D2 的 V_AK = 2 − 3 = −1 V', () => {
    const s = mc07Solve(12, 3, 2, 1, 1)
    expect(s.on.D1).toBe(true)
    expect(s.on.D2).toBe(false)
    expect(s.v[5]).toBeCloseTo(3, 3)
    expect(s.vak.D2).toBeCloseTo(-1, 3)
    expect(12 * 1 / (3 + 1)).toBe(3)
  })
  it('QA-02:Vth = 9.6、Rth = 4 kΩ、I = 0.4 mA、Vo = 8 V、Vo < Vth', () => {
    const vth = 12 * 20 / 25
    const rth = (5 * 20) / 25
    expect(vth).toBeCloseTo(9.6, 9)
    expect(rth).toBeCloseTo(4, 9)
    expect(vth / (rth + 20)).toBeCloseTo(0.4, 9)
    expect((vth / (rth + 20)) * 20).toBeCloseTo(8, 9)
    expect(8).toBeLessThan(vth)
  })
  it('MC-09:Vi>0 時 D1、D3 導通;D2、D4 反向偏壓;Vi<0 時 D2、D4 導通,負載電流方向不變', () => {
    const p = solveRectifier('bridge', 10)
    expect([p.on.D1, p.on.D3]).toEqual([true, true])
    expect(p.vak.D2).toBeLessThan(-1)
    expect(p.vak.D4).toBeLessThan(-1)
    const n = solveRectifier('bridge', -10)
    expect([n.on.D2, n.on.D4]).toEqual([true, true])
    expect(Math.sign(p.io)).toBe(Math.sign(n.io))
    expect(p.io).toBeGreaterThan(0)
  })
  it('MC-11:1.11² = 1.2337 → r = 0.483;半波 r = 1.21;全波 r < 半波 r', () => {
    const f = fullWave(10), h = halfWave(10)
    expect(f.vo_rms / f.vo_dc).toBeCloseTo(Math.PI / (2 * Math.SQRT2), 9)
    expect(1.11 ** 2).toBeCloseTo(1.2321, 3)
    expect(f.rippleFactor).toBeCloseTo(0.4834, 3)
    expect(h.rippleFactor).toBeCloseTo(1.2112, 3)
    expect(f.rippleFactor).toBeLessThan(h.rippleFactor)
  })
  it('MC-12:Vdc = 18 − 1 = 17,介於 16 與 18;先減再除會得 8', () => {
    expect(filteredDc(18, 2)).toBe(17)
    expect((18 - 2) / 2).toBe(8)
  })
  it('PY-03:ΔT = 40℃、ΔV = −0.1 V、VD = 0.55 V', () => {
    expect(65 - 25).toBe(40)
    expect(forwardDropAtTemp(0.65, 25, 65)).toBeCloseTo(0.55, 9)
    expect(forwardDropAtTemp(0.65, 25, 65)).toBeLessThan(0.65)
  })
  it('QA-01:圖 (7) 重繪版的符號數量與教練文字一致(A 無載子;B 全電子;C 電子多;D 電洞多;E 相等)', () => {
    const [A, B, C, D, E] = QA01_SPECS
    expect([A.minus + A.plus, B.plus, C.minus > C.plus, D.plus > D.minus, E.minus === E.plus]).toEqual([0, 0, true, true, true])
    expect(B.minus).toBe(24); expect([C.minus, C.plus]).toEqual([21, 5]); expect([D.minus, D.plus]).toEqual([4, 26]); expect(E.minus).toBe(12)
  })
})

describe('第 2 章變化題:題幹與標準答案以獨立方法重算', () => {
  it('MC-07:列舉二極體導通組合,取一致解,與求解器答案相同', () => {
    const v = q('WB2-MC-07').variant!
    for (let seed = 0; seed < 10; seed++) {
      const x = num(v.make(seed))
      const m = x.stem.match(/(\d+) V 電源 → D1 → (\d+) kΩ.*?(\d+) V 電源 → D2 → (\d+) kΩ.*?接 (\d+) kΩ/)!
      const [v1, r1, v2, r2, rl] = m.slice(1).map(Number)
      let best: number | null = null
      for (const on1 of [true, false]) for (const on2 of [true, false]) {
        const g1 = on1 ? 1 / r1 : 0, g2 = on2 ? 1 / r2 : 0
        const vo = ((on1 ? v1 / r1 : 0) + (on2 ? v2 / r2 : 0)) / (g1 + g2 + 1 / rl)
        const ok1 = on1 ? v1 > vo : v1 <= vo
        const ok2 = on2 ? v2 > vo : v2 <= vo
        if (ok1 && ok2) best = vo
      }
      expect(best, `seed ${seed}`).not.toBeNull()
      expect(x.part.value).toBeCloseTo(best!, 2)
    }
  })
  it('QA-02:戴維寧公式重算', () => {
    const v = q('WB2-QA-02').variant!
    for (let seed = 0; seed < 10; seed++) {
      const x = num(v.make(seed))
      const m = x.stem.match(/^(\d+) V 經 (\d+) kΩ.*?接 (\d+) kΩ.*?接 (\d+) kΩ/)!
      const [vs, r1, r2, r3] = m.slice(1).map(Number)
      const vth = (vs * r2) / (r1 + r2), rth = (r1 * r2) / (r1 + r2)
      expect(vth).toBeGreaterThan(0)
      expect(x.part.value).toBeCloseTo((vth / (rth + r3)) * r3, 2)
    }
  })
  it('MC-03:由題幹的稀釋比重算 p', () => {
    const v = q('WB2-MC-03').variant!
    const sup: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' }
    for (let seed = 0; seed < 10; seed++) {
      const x = num(v.make(seed))
      const m = x.stem.match(/每 (5×10⁹|10([⁰¹²³⁴⁵⁶⁷⁸⁹]+)) 個/)!
      const ratio = m[1] === '5×10⁹' ? 5e9 : 10 ** Number([...m[2]].map((c) => sup[c]).join(''))
      expect(x.part.value).toBeCloseTo((1.5e10 ** 2) / (5e22 / ratio), -1)
      expect(x.part.value).toBeLessThan(1.5e10)
    }
  })
  it('MC-05 / MC-12 / PY-03:由題幹重算', () => {
    for (let seed = 0; seed < 10; seed++) {
      const a = num(q('WB2-MC-05').variant!.make(seed))
      expect(a.part.value).toBeCloseTo(25 / Number(a.stem.match(/ID = ([\d.]+) mA/)![1]), 9)
      const b = num(q('WB2-MC-12').variant!.make(seed))
      const mb = b.stem.match(/峰值電壓 ([\d.]+) V,漣波電壓峰對峰值 ([\d.]+) V/)!
      expect(b.part.value).toBeCloseTo(Number(mb[1]) - Number(mb[2]) / 2, 9)
      const c = num(q('WB2-PY-03').variant!.make(seed))
      const mc = c.stem.match(/在 (\d+)℃ 時順向壓降為 ([\d.]+) V.*?在 (\d+)℃ 時/)!
      expect(c.part.value).toBeCloseTo(Number(mc[2]) - 0.0025 * (Number(mc[3]) - Number(mc[1])), 9)
    }
  })
  it('MC-09 變化題:標示的答案與電路求解器一致', () => {
    const v = q('WB2-MC-09').variant!
    for (let seed = 0; seed < 5; seed++) {
      const x = v.make(seed)
      if (!('options' in x)) throw new Error()
      const ans = x.options[x.answer]
      const kind = x.stem.startsWith('橋式') ? 'bridge' : x.stem.startsWith('中心抽頭') ? 'centerTap' : 'half'
      const pos = x.stem.includes('上半邊為正') || x.stem.includes('Vi > 0')
      const s = solveRectifier(kind, pos ? 1 : -1, 100)
      const ids = Object.keys(s.on).filter((k) => s.on[k])
      expect(ans).toBe(ids.length ? ids.join('、') : '沒有二極體導通')
    }
  })
})
