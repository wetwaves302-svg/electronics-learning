import { describe, expect, it } from 'vitest'
import { solveRectifier, sweepRectifier, type RectifierKind } from './rectifier'
import { fullWave, halfWave, pivBridge, pivCenterTapFullWave, pivHalfWave } from './physics'

const close = (a: number, b: number, tol = 1e-3) => expect(Math.abs(a - b)).toBeLessThanOrEqual(Math.abs(b) * tol + 1e-6)

describe('理想二極體電路求解器:導通狀態', () => {
  it('半波:正半週 D1 導通、Vo=v;負半週截止、Vo=0', () => {
    const p = solveRectifier('half', 10)
    expect(p.on.D1).toBe(true)
    close(p.vo, 10)
    const n = solveRectifier('half', -10)
    expect(n.on.D1).toBe(false)
    expect(Math.abs(n.vo)).toBeLessThan(1e-4)
    close(n.vak.D1, -10)
  })
  it('橋式:Vi>0 時 D1、D3 導通,D2、D4 截止(習作 MC-09 的答案 A)', () => {
    const s = solveRectifier('bridge', 10)
    expect([s.on.D1, s.on.D2, s.on.D3, s.on.D4]).toEqual([true, false, true, false])
    close(s.vo, 10)
    // 電流路徑:次級上端 → D1 → RL(由 + 到 −)→ D3 → 次級下端
    expect(s.i.RL).toBeGreaterThan(0)
  })
  it('橋式:Vi<0 時換 D2、D4 導通,Vo 仍為正(習作 MC-09 選項 B 的情況)', () => {
    const s = solveRectifier('bridge', -10)
    expect([s.on.D1, s.on.D2, s.on.D3, s.on.D4]).toEqual([false, true, false, true])
    close(s.vo, 10)
  })
  it('中心抽頭:正半週只有 D1 導通,負半週只有 D2 導通', () => {
    const p = solveRectifier('centerTap', 12)
    expect([p.on.D1, p.on.D2]).toEqual([true, false])
    const n = solveRectifier('centerTap', -12)
    expect([n.on.D1, n.on.D2]).toEqual([false, true])
    close(n.vo, 12)
  })
})

describe('PIV:由求解器的最大逆向電壓驗證公式與習作答案', () => {
  const minVak = (kind: RectifierKind, vm: number) => {
    const m: Record<string, number> = {}
    for (const { state } of sweepRectifier(kind, vm, 100, 720)) for (const [id, v] of Object.entries(state.vak)) m[id] = Math.min(m[id] ?? 0, v)
    return m
  }
  it('半波 PIV = Vm(習作 MC-08:100 V)', () => close(-minVak('half', 100).D1, pivHalfWave(100), 2e-3))
  it('中心抽頭 PIV = 2Vm(每半邊)', () => {
    const m = minVak('centerTap', 12)
    close(-m.D1, pivCenterTapFullWave(12), 2e-3)
    close(-m.D2, pivCenterTapFullWave(12), 2e-3)
  })
  it('橋式每顆 PIV = Vm', () => {
    const m = minVak('bridge', 10)
    for (const id of ['D1', 'D2', 'D3', 'D4']) close(-m[id], pivBridge(10), 2e-3)
  })
  it('習作歷屆 PY-05:110:24 中心抽頭,每半邊 12√2 V,PIV ≈ 33.9 V < 34 V', () => {
    const half = 12 * Math.SQRT2
    const piv = -minVak('centerTap', half).D1
    close(piv, 24 * Math.SQRT2, 2e-3)
    expect(piv).toBeLessThan(34)
    expect(piv).toBeGreaterThan(32)
  })
})

describe('平均值、有效值、頻率:求解器數值積分 vs 封閉公式', () => {
  const stats = (kind: RectifierKind, vm: number) => {
    const sw = sweepRectifier(kind, vm, 100, 1440)
    const vo = sw.map((x) => x.state.vo)
    const dc = vo.reduce((s, x) => s + x, 0) / vo.length
    const rms = Math.sqrt(vo.reduce((s, x) => s + x * x, 0) / vo.length)
    // 輸出頻率:每個輸入週期內「由低變高」的穿越次數
    const thr = vm * 0.5
    let rises = 0
    for (let k = 0; k < vo.length; k++) if (vo[k] < thr && vo[(k + 1) % vo.length] >= thr) rises++
    return { dc, rms, rises }
  }
  it('半波:Vdc = Vm/π、Vrms = Vm/2、頻率 ×1', () => {
    const s = stats('half', 14.142)
    const f = halfWave(14.142)
    close(s.dc, f.vo_dc, 3e-3); close(s.rms, f.vo_rms, 3e-3)
    expect(s.rises).toBe(f.freqMultiplier)
  })
  it('中心抽頭與橋式:Vdc = 2Vm/π、Vrms = Vm/√2、頻率 ×2(習作 MC-10:60Hz→120Hz)', () => {
    for (const k of ['centerTap', 'bridge'] as const) {
      const s = stats(k, 10)
      const f = fullWave(10)
      close(s.dc, f.vo_dc, 3e-3); close(s.rms, f.vo_rms, 3e-3)
      expect(s.rises).toBe(f.freqMultiplier)
    }
  })
  it('漣波因數:半波 121%、全波 48%', () => {
    const rf = (k: RectifierKind) => { const s = stats(k, 10); return Math.sqrt((s.rms / s.dc) ** 2 - 1) }
    close(rf('half'), 1.211, 6e-3)
    close(rf('bridge'), 0.483, 1e-2)
  })
  it('習作 QA-03:10:1、Vi=100V rms、RL=100Ω 半波 → 14.1V、4.5V、7.07V、141mA、45mA、70.7mA', () => {
    const vm = (100 * Math.SQRT2) / 10
    const sw = sweepRectifier('half', vm, 100, 1440)
    const vo = sw.map((x) => x.state.vo)
    const dc = vo.reduce((s, x) => s + x, 0) / vo.length
    const rms = Math.sqrt(vo.reduce((s, x) => s + x * x, 0) / vo.length)
    close(Math.max(...vo), 14.14, 2e-3); close(dc, 4.5, 3e-3); close(rms, 7.07, 3e-3)
    close(Math.max(...vo) / 100, 0.1414, 2e-3); close(dc / 100, 0.045, 3e-3); close(rms / 100, 0.0707, 3e-3)
  })
})
