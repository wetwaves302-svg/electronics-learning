/** 波形產生與數值量測。動畫與圖都由這裡的公式產生,不使用隨機數。 */

export type WaveFn = (t: number) => number
export type WaveKind = 'sine' | 'square' | 'triangle' | 'sawtooth'

const frac = (x: number) => x - Math.floor(x)

/** 對稱於 0 的週期波,峰值 vm、頻率 f、相位 phaseDeg(僅弦波使用) */
export function makeWave(kind: WaveKind, vm: number, f: number, phaseDeg = 0): WaveFn {
  const ph = (phaseDeg * Math.PI) / 180
  switch (kind) {
    case 'sine':
      return (t) => vm * Math.sin(2 * Math.PI * f * t + ph)
    case 'square':
      return (t) => (frac(f * t) < 0.5 ? vm : -vm)
    case 'triangle':
      // 0 → +vm → 0 → −vm → 0
      return (t) => {
        const x = frac(f * t)
        return x < 0.25 ? 4 * vm * x : x < 0.75 ? vm * (2 - 4 * x) : vm * (4 * x - 4)
      }
    case 'sawtooth':
      // −vm → +vm 線性上升後瞬間回到 −vm
      return (t) => vm * (2 * frac(f * t) - 1)
  }
}

/** 脈波:高位準 vh、低位準 vl、工作週期 duty(0~1)、頻率 f */
export const makePulse = (vh: number, vl: number, duty: number, f: number): WaveFn =>
  (t) => (frac(f * t) < duty ? vh : vl)

/** 週期內一個三角脈波,寬度為 widthFraction × T,峰值 vm(習作第 1 章問答 4) */
export function makeTriangularPulse(vm: number, widthFraction: number, T: number): WaveFn {
  const w = widthFraction * T
  return (t) => {
    const x = t - Math.floor(t / T) * T
    if (x >= w) return 0
    return x < w / 2 ? (2 * vm * x) / w : (2 * vm * (w - x)) / w
  }
}

export interface Measured { avg: number; absAvg: number; rms: number; max: number; min: number }

/** 以梯形/中點法在一個週期內數值積分,用來驗證封閉解 */
export function measure(fn: WaveFn, T: number, n = 200_000): Measured {
  let sum = 0, abs = 0, sq = 0, max = -Infinity, min = Infinity
  for (let i = 0; i < n; i++) {
    const v = fn(((i + 0.5) / n) * T)
    sum += v; abs += Math.abs(v); sq += v * v
    if (v > max) max = v
    if (v < min) min = v
  }
  return { avg: sum / n, absAvg: abs / n, rms: Math.sqrt(sq / n), max, min }
}

/** 取樣成 SVG 路徑所需的點;遇到不連續(方波、鋸齒)以較密取樣呈現 */
export function samplePoints(fn: WaveFn, t0: number, t1: number, n = 600): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n
    pts.push([t, fn(t)])
  }
  return pts
}
