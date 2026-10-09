import { describe, expect, it } from 'vitest'
import { MATERIALS, dopedCarriers, depletionRel, diodeI, diodeV, isFromPoint, kT, niAt, solveSeries, vfAtTemp } from './semiconductor'
import { dynamicResistance, minorityCarrier } from './physics'

const si = MATERIALS[0], ge = MATERIALS[1], gaas = MATERIALS[2]
const close = (a: number, b: number, rel = 1e-6) => expect(Math.abs(a - b)).toBeLessThanOrEqual(Math.abs(b) * rel + 1e-30)

describe('熱能與本質載子', () => {
  it('300 K 時 kT ≈ 0.0259 eV(熱電壓約 25~26 mV,習作取 25 mV)', () => {
    close(kT(300), 0.02585, 1e-3)
    expect(kT(300)).toBeGreaterThan(0.025)
    expect(kT(300)).toBeLessThan(0.026)
  })
  it('300 K 的 ni 與習作一致:矽 1.5×10¹⁰', () => close(niAt(si, 300), 1.5e10))
  it('溫度愈高 ni 愈大;能隙愈小 ni 愈大(同溫度 Ge > Si > GaAs)', () => {
    expect(niAt(si, 350)).toBeGreaterThan(niAt(si, 300))
    expect(niAt(si, 300)).toBeGreaterThan(niAt(si, 250))
    expect(niAt(ge, 300)).toBeGreaterThan(niAt(si, 300))
    expect(niAt(si, 300)).toBeGreaterThan(niAt(gaas, 300))
  })
  it('矽在 300→310 K,ni 約增加 1.7 倍(常見經驗:約每升 10 K 增加一倍多)', () => {
    const r = niAt(si, 310) / niAt(si, 300)
    expect(r).toBeGreaterThan(1.5)
    expect(r).toBeLessThan(2.2)
  })
})

describe('摻雜後的載子濃度', () => {
  it('質量作用定律:n·p = ni²(精確解)', () => {
    for (const net of [0, 1e8, 1e10, 5e13, 1e17]) {
      const { n, p } = dopedCarriers(1.5e10, net, true)
      close(n * p, (1.5e10) ** 2, 1e-9)
    }
  })
  it('未摻雜:n = p = ni', () => {
    const c = dopedCarriers(1.5e10, 0, true)
    close(c.n, 1.5e10); close(c.p, 1.5e10)
  })
  it('習作 MC-03:Nd = 5×10¹³ → p ≈ 4.5×10⁶,與近似式 ni²/Nd 相差小於 0.01%', () => {
    const c = dopedCarriers(1.5e10, 5e13, true)
    close(c.p, 4.5e6, 1e-3)
    close(c.p, minorityCarrier(1.5e10, 5e13), 1e-4)
    close(c.n, 5e13, 1e-6)
  })
  it('N 型多數為電子、P 型多數為電洞', () => {
    const n = dopedCarriers(1.5e10, 1e15, true)
    const p = dopedCarriers(1.5e10, 1e15, false)
    expect(n.n).toBeGreaterThan(n.p)
    expect(p.p).toBeGreaterThan(p.n)
    close(n.n, p.p); close(n.p, p.n)
  })
  it('摻雜濃度與 ni 相當時,近似式失準(N = ni:多數載子約 1.618 ni,而不是 ni)', () => {
    const c = dopedCarriers(1.5e10, 1.5e10, true)
    close(c.n / 1.5e10, (1 + Math.sqrt(5)) / 2, 1e-9)
  })
})

describe('二極體模型', () => {
  const nvt = 0.025
  const is = isFromPoint(0.65, nvt) // 矽:1 mA 時 0.65 V(習作 PY-03)
  it('蕭克利方程式與反解互為反函數;1 mA 時 0.65 V', () => {
    close(diodeI(0.65, is, nvt), 1e-3, 1e-9)
    close(diodeV(2e-3, is, nvt), 0.65 + nvt * Math.log(2), 1e-6)
    expect(diodeI(-1, is, nvt)).toBeCloseTo(-is, 12) // 逆向 ≈ −Is
  })
  it('動態電阻:曲線切線斜率的倒數 = VT/I(習作 MC-05:1 mA → 25 Ω)', () => {
    const i0 = 1e-3, v0 = diodeV(i0, is, nvt), dv = 1e-6
    const slope = (diodeI(v0 + dv, is, nvt) - diodeI(v0 - dv, is, nvt)) / (2 * dv)
    close(1 / slope, dynamicResistance(i0), 1e-3)
    close(1 / slope, 25, 1e-3)
  })
  it('靜態電阻 V/I = 650 Ω,遠大於動態電阻 25 Ω', () => {
    close(diodeV(1e-3, is, nvt) / 1e-3, 650, 1e-9)
  })
  it('空乏區:零偏壓為 1;順向變窄、逆向變寬;偏壓達障壁電壓時消失', () => {
    expect(depletionRel(0, 0.7)).toBeCloseTo(1, 12)
    expect(depletionRel(0.5, 0.7)).toBeLessThan(1)
    expect(depletionRel(-5, 0.7)).toBeGreaterThan(1)
    expect(depletionRel(0.7, 0.7)).toBe(0)
    expect(depletionRel(-2, 0.7)).toBeGreaterThan(depletionRel(-1, 0.7))
  })
  it('串聯電路:各模型的工作點自洽,指數模型滿足 KVL 與二極體方程式', () => {
    const p = { vGamma: 0.7, rd: 25, is, nvt }
    const id = solveSeries('ideal', 5, 1000, p)
    expect(id.i).toBeCloseTo(5e-3, 9)
    const cv = solveSeries('constant', 5, 1000, p)
    expect(cv.i).toBeCloseTo(4.3e-3, 9)
    const pw = solveSeries('piecewise', 5, 1000, p)
    expect(pw.i).toBeCloseTo(4.3 / 1025, 6)
    const ex = solveSeries('exponential', 5, 1000, p)
    expect(5 - ex.v).toBeCloseTo(ex.i * 1000, 9) // KVL
    expect(ex.i).toBeCloseTo(diodeI(ex.v, is, nvt), 9) // 二極體方程式
    expect(ex.v).toBeGreaterThan(0.6); expect(ex.v).toBeLessThan(0.8)
  })
  it('電源為負:所有模型電流約為 0,二極體承受逆向電壓', () => {
    const p = { vGamma: 0.7, rd: 25, is, nvt }
    for (const m of ['ideal', 'constant', 'piecewise', 'exponential'] as const) {
      const s = solveSeries(m, -5, 1000, p)
      expect(Math.abs(s.i)).toBeLessThan(1e-9)
      expect(s.v).toBeLessThan(0)
    }
  })
  it('電源低於切入電壓:簡化模型不導通,指數模型有很小的電流', () => {
    const p = { vGamma: 0.7, rd: 25, is, nvt }
    expect(solveSeries('constant', 0.3, 1000, p).i).toBe(0)
    const ex = solveSeries('exponential', 0.3, 1000, p)
    expect(ex.i).toBeGreaterThan(0)
    expect(ex.i).toBeLessThan(1e-6)
  })
  it('溫度:25℃ 的 0.65 V → 65℃ 時 0.55 V(習作 PY-03)', () => {
    expect(vfAtTemp(0.65, 65)).toBeCloseTo(0.55, 9)
  })
})
