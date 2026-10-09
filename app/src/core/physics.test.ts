import { describe, expect, it } from 'vitest'
import * as P from './physics'

const close = (a: number, b: number, rel = 0.01) => expect(Math.abs(a - b)).toBeLessThanOrEqual(Math.abs(b) * rel)

describe('1-2 波形(習作第1章)', () => {
  it('MC-07 / MC-08 峰值與有效值', () => {
    close(P.sineRms(100), 70.7)
    close(P.sinePeak(100), 141.4)
  })
  it('MC-10 f = 1/T', () => close(P.frequencyFromPeriod(50e-6), 20e3))
  it('MC-11 v=√2 sin(314t+30°):Vrms、f、T', () => {
    close(P.sineRms(2), 1.414)
    close(314 / (2 * Math.PI), 50, 0.01)
    close(P.periodFromFrequency(50), 0.02)
  })
  it('MC-13 工作週期', () => close(P.dutyCycle(3, 2), 0.6))
  it('MC-14 / PY-03 由平均值反求工作週期', () => {
    close(P.dutyFromAverage(10, -2, 5.2), 0.6)
    close(P.pulseAverage(10, -2, 0.6), 5.2)
  })
  it('MC-15 弦波 FF=π/(2√2)', () => close(P.symmetricWave('sine', 1).formFactor, 1.11, 0.005))
  it('MC-16 三角波 CF=√3', () => close(P.symmetricWave('triangle', 1).crestFactor, Math.sqrt(3)))
  it('MC-17 方波 CF=FF=1', () => {
    const w = P.symmetricWave('square', 5)
    expect(w.crestFactor).toBeCloseTo(1)
    expect(w.formFactor).toBeCloseTo(1)
  })
  it('MC-18 三角波 FF=2/√3 為最大', () => {
    const tri = P.symmetricWave('triangle', 1).formFactor
    close(tri, 1.155, 0.002)
    expect(tri).toBeGreaterThan(P.symmetricWave('sine', 1).formFactor)
    expect(tri).toBeGreaterThan(P.symmetricWave('square', 1).formFactor)
  })
  it('MC-20 v=3−4√2 cos2ωt:Vrms=5', () => {
    expect(P.mixedRms(3, [4 * Math.SQRT2])).toBeCloseTo(5)
    close(3 + 4 * Math.SQRT2, 8.657)
  })
  it('QA-03 弦波瞬時式:Vm=8V、f=50Hz', () => {
    expect(2 * 4).toBe(8)
    close(P.frequencyFromPeriod(5e-3 * 4), 50)
  })
  it('QA-04 三角脈波(寬 T/3,Vm=9V):Vav=1.5V、Vrms=3V、FF=2、CF=3', () => {
    const w = P.triangularPulse(9, 1 / 3)
    expect(w.avg).toBeCloseTo(1.5)
    expect(w.rms).toBeCloseTo(3)
    expect(w.formFactor).toBeCloseTo(2)
    expect(w.crestFactor).toBeCloseTo(3)
  })
  it('QA-05 3√3 + 4√2 sinωt + 5√2 sin(ωt+37°) → Vrms=10', () => {
    // 5√2 sin(ωt+37°) 以 cos37°=0.8、sin37°=0.6 近似(3-4-5 直角三角形)
    const s = P.combineSameFreqSines([
      { peak: 4 * Math.SQRT2, phaseDeg: 0 },
      { peak: 5 * Math.SQRT2, phaseDeg: Math.atan2(3, 4) * 180 / Math.PI },
    ])
    expect(s.a).toBeCloseTo(8 * Math.SQRT2)
    expect(s.b).toBeCloseTo(3 * Math.SQRT2)
    expect(P.mixedRms(3 * Math.sqrt(3), [s.peak])).toBeCloseTo(10)
  })
  it('PY-01 v=0.1 sin(1000πt):f=500Hz、t=0.01s 時 v≈0', () => {
    close(1000 * Math.PI / (2 * Math.PI), 500)
    expect(Math.abs(0.1 * Math.sin(1000 * Math.PI * 0.01))).toBeLessThan(1e-9)
  })
  it('PY-02 工作週期 3/(3+2)', () => close(P.dutyCycle(3, 2), 0.6))
  it('PY-04 cos 與 sin 相位差', () => {
    const phi1 = P.cosPhaseToSinPhase(13)
    expect(phi1 - 45).toBe(58)
  })
})

describe('2-1 半導體(習作第2章)', () => {
  it('MC-03 摻雜後電洞濃度', () => {
    const nd = P.dopantConcentration(5e22, 1e9)
    close(nd, 5e13)
    close(P.minorityCarrier(1.5e10, nd), 4.5e6)
  })
  it('PY-01 1 eV = 1.6×10⁻¹⁹ J', () => expect(P.EV_TO_JOULE).toBe(1.6e-19))
})

describe('2-2 二極體', () => {
  it('MC-05 rd = 25mV / 1mA = 25Ω', () => close(P.dynamicResistance(1e-3), 25))
  it('MC-07 12V 經 3kΩ 與 1kΩ 負載分壓 = 3V,且大於 2V 使 D2 截止', () => {
    const vo = P.divider(12, 3e3, 1e3)
    close(vo, 3)
    expect(vo).toBeGreaterThan(2)
  })
  it('QA-02 戴維寧化簡:Vth=9.6V、Rth=4kΩ、Vo=8V、I=0.4mA', () => {
    const vth = P.divider(12, 5e3, 20e3)
    const rth = P.parallel(5e3, 20e3)
    close(vth, 9.6)
    close(rth, 4e3)
    const r = P.idealDiodeWithThevenin({ vth, rth }, 20e3)
    expect(r.on).toBe(true)
    close(r.vout, 8)
    close(r.current, 0.4e-3)
  })
  it('PY-03 溫度 25→65℃,0.65V → 0.55V', () => close(P.forwardDropAtTemp(0.65, 25, 65), 0.55))
})

describe('2-3 整流濾波', () => {
  it('MC-08 半波 PIV = Vm', () => expect(P.pivHalfWave(100)).toBe(100))
  it('MC-10 全波輸出頻率為輸入 2 倍', () => expect(60 * P.fullWave(1).freqMultiplier).toBe(120))
  it('MC-11 / PY-04 全波漣波因數 48%,半波 121%', () => {
    close(P.fullWave(1).rippleFactor, 0.483, 0.005)
    close(P.halfWave(1).rippleFactor, 1.211, 0.005)
  })
  it('MC-12 濾波直流 = 18 − 2/2 = 17V', () => expect(P.filteredDc(18, 2)).toBe(17))
  it('QA-03 10:1、Vi=100V rms、半波整流 RL=100Ω', () => {
    const vs = P.transformerSecondaryPeak(100 * Math.SQRT2, 10, 1)
    close(vs, 14.14)
    const o = P.halfWave(vs)
    close(o.vo_peak, 14.1)
    close(o.vo_dc, 4.5)
    close(o.vo_rms, 7.07)
    close(o.vo_peak / 100, 0.141)
    close(o.vo_dc / 100, 0.045)
    close(o.vo_rms / 100, 0.0707)
  })
  it('PY-05 110:24 中心抽頭全波:每半 12V rms,PIV ≈ 33.9V,34V 為最小可用選項', () => {
    const vsHalf = P.transformerSecondaryPeak(110 * Math.SQRT2, 110, 24) / 2
    close(vsHalf, 12 * Math.SQRT2)
    const piv = P.pivCenterTapFullWave(vsHalf)
    close(piv, 24 * Math.SQRT2)
    expect(piv).toBeLessThan(34)
    expect(piv).toBeGreaterThan(32)
  })
})
