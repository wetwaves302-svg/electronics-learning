import { describe, expect, it } from 'vitest'
import { rippleApprox, simulateFilter } from './filter'
import { filteredDc, fullWave, halfWave } from './physics'

const close = (a: number, b: number, tol: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(Math.abs(b) * tol + 1e-9)

describe('電容濾波模擬', () => {
  it('電容極小時退化為未濾波的整流輸出(全波 Vdc = 2Vm/π、半波 Vm/π)', () => {
    close(simulateFilter({ vm: 10, f: 60, r: 100, c: 1e-9, full: true }).vdc, fullWave(10).vo_dc, 0.01)
    close(simulateFilter({ vm: 10, f: 60, r: 100, c: 1e-9, full: false }).vdc, halfWave(10).vo_dc, 0.01)
  })
  it('電容愈大,漣波愈小、直流愈接近峰值', () => {
    const a = simulateFilter({ vm: 10, f: 60, r: 100, c: 100e-6, full: true })
    const b = simulateFilter({ vm: 10, f: 60, r: 100, c: 470e-6, full: true })
    const c = simulateFilter({ vm: 10, f: 60, r: 100, c: 2200e-6, full: true })
    expect(a.vrPP).toBeGreaterThan(b.vrPP)
    expect(b.vrPP).toBeGreaterThan(c.vrPP)
    expect(a.vdc).toBeLessThan(b.vdc)
    expect(c.vdc).toBeLessThan(10)
    expect(a.ripple).toBeGreaterThan(c.ripple)
  })
  it('RC 夠大時,近似式 Vr(pp)≈Vp/(2fRC) 與模擬接近,Vdc ≈ Vp − Vr/2(習作 MC-12 的算法)', () => {
    const s = simulateFilter({ vm: 10, f: 60, r: 100, c: 2200e-6, full: true })
    const approx = rippleApprox(10, 60, 100, 2200e-6, true)
    // 近似式假設整個半週期都在放電,實際電容在峰值附近會充電,所以近似式略偏大(上限)
    expect(approx).toBeGreaterThanOrEqual(s.vrPP)
    close(s.vrPP, approx, 0.15)
    close(s.vdc, filteredDc(s.vp, s.vrPP), 0.01)
  })
  it('半波的漣波約為全波的兩倍(同 RC)', () => {
    const h = simulateFilter({ vm: 10, f: 60, r: 100, c: 2200e-6, full: false })
    const f = simulateFilter({ vm: 10, f: 60, r: 100, c: 2200e-6, full: true })
    close(h.vrPP / f.vrPP, 2, 0.12)
  })
  it('峰值不超過輸入峰值', () => {
    expect(simulateFilter({ vm: 10, f: 60, r: 100, c: 470e-6, full: true }).vp).toBeLessThanOrEqual(10.0001)
  })
})
