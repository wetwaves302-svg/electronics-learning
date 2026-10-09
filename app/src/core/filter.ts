/**
 * 電容濾波的穩態模擬(理想二極體、理想電源、負載 R、電容 C)。
 * 電容電壓 vc:二極體導通時追隨整流後的來源電壓;截止時以 RC 指數放電。
 * 每步 vc = max(v_source, vc·exp(−dt/RC)),此式在理想假設下是精確解。
 */
export interface FilterResult {
  vp: number
  vmin: number
  /** 漣波峰對峰值 */
  vrPP: number
  vdc: number
  vrms: number
  /** 漣波因數 r = (交流有效值)/Vdc = √(Vrms² − Vdc²)/Vdc */
  ripple: number
  /** 取樣(一個輸入週期) */
  samples: { t: number; vs: number; vc: number }[]
}

export function simulateFilter(opts: { vm: number; f: number; r: number; c: number; full: boolean; stepsPerCycle?: number; cycles?: number }): FilterResult {
  const { vm, f, r, c, full } = opts
  const n = opts.stepsPerCycle ?? 4000
  const cycles = opts.cycles ?? 12
  const dt = 1 / (f * n)
  const decay = Math.exp(-dt / (r * c))
  let vc = 0
  const samples: FilterResult['samples'] = []
  for (let k = 0; k < cycles * n; k++) {
    const t = k * dt
    const s = vm * Math.sin(2 * Math.PI * f * t)
    const src = full ? Math.abs(s) : Math.max(s, 0)
    vc = Math.max(src, vc * decay)
    if (k >= (cycles - 1) * n) samples.push({ t: t - (cycles - 1) / f, vs: s, vc })
  }
  const vs = samples.map((x) => x.vc)
  const vdc = vs.reduce((a, b) => a + b, 0) / vs.length
  const vrms = Math.sqrt(vs.reduce((a, b) => a + b * b, 0) / vs.length)
  const vp = Math.max(...vs)
  const vmin = Math.min(...vs)
  return { vp, vmin, vrPP: vp - vmin, vdc, vrms, ripple: Math.sqrt(Math.max(vrms * vrms - vdc * vdc, 0)) / vdc, samples }
}

/** 課本近似式:全波 Vr(pp) ≈ Vp/(2fRC),半波 Vr(pp) ≈ Vp/(fRC) */
export const rippleApprox = (vp: number, f: number, r: number, c: number, full: boolean) => vp / ((full ? 2 : 1) * f * r * c)
