/** 半導體與二極體的物理模型(2-1、2-2 教學用)。公式皆為教科書標準式,並於測試中驗證。 */

export const K_EV = 8.617333e-5 // 波茲曼常數,eV/K

/** 熱能 kT(eV)。300 K 時約 0.0259 eV,等於熱電壓 V_T 的數值(V)。 */
export const kT = (tKelvin: number) => K_EV * tKelvin

export interface Material { id: 'si' | 'ge' | 'gaas'; name: string; egEv: number; ni300: number }
/** 能隙與 300 K 本質濃度的典型值。Si 的 ni 與習作一致(1.5×10¹⁰ /cm³)。 */
export const MATERIALS: Material[] = [
  { id: 'si', name: '矽 Si', egEv: 1.12, ni300: 1.5e10 },
  { id: 'ge', name: '鍺 Ge', egEv: 0.67, ni300: 2.4e13 },
  { id: 'gaas', name: '砷化鎵 GaAs', egEv: 1.42, ni300: 1.8e6 },
]

/** 本質載子濃度隨溫度:ni ∝ T^1.5 · exp(−Eg/2kT),以 300 K 的值為基準 */
export function niAt(m: Material, tKelvin: number): number {
  return m.ni300 * Math.pow(tKelvin / 300, 1.5) * Math.exp(-(m.egEv / (2 * K_EV)) * (1 / tKelvin - 1 / 300))
}

/**
 * 摻雜後的熱平衡載子濃度(電中性 + 質量作用定律,精確解)。
 * donor=true:淨施體濃度 net(N 型);donor=false:淨受體濃度(P 型)。
 * 多數載子 = (N + √(N² + 4ni²))/2;少數載子 = ni²/多數載子。N ≫ ni 時多數 ≈ N。
 */
export function dopedCarriers(ni: number, net: number, donor: boolean) {
  const major = (net + Math.sqrt(net * net + 4 * ni * ni)) / 2
  const minor = (ni * ni) / major
  return donor ? { n: major, p: minor } : { n: minor, p: major }
}

/* ───────── 二極體 ───────── */

/** 蕭克利方程式(順向與逆向):I = Is·(e^{V/(η·VT)} − 1) */
export const diodeI = (v: number, is: number, nvt: number) => is * (Math.exp(v / nvt) - 1)
/** 反解:給定電流求電壓 */
export const diodeV = (i: number, is: number, nvt: number) => nvt * Math.log(i / is + 1)
/** 以「在 iRef 時的順向電壓」反推 Is */
export const isFromPoint = (vAtRef: number, nvt: number, iRef = 1e-3) => iRef / (Math.exp(vAtRef / nvt) - 1)

/** 空乏區寬度(相對於零偏壓的寬度):W/W0 = √((Vbi − V)/Vbi),V 為外加偏壓(順向為正)。V ≥ Vbi 時空乏區已消失。 */
export function depletionRel(v: number, vbi: number): number {
  if (v >= vbi) return 0
  return Math.sqrt((vbi - v) / vbi)
}

export type DiodeModel = 'ideal' | 'constant' | 'piecewise' | 'exponential'
export interface ModelParams { vGamma: number; rd: number; is: number; nvt: number }

/** 二極體與電阻串聯(電源 E、電阻 R)的工作點:四種模型 */
export function solveSeries(model: DiodeModel, e: number, r: number, p: ModelParams): { i: number; v: number } {
  if (model === 'ideal') return e > 0 ? { i: e / r, v: 0 } : { i: 0, v: e }
  if (model === 'constant') return e > p.vGamma ? { i: (e - p.vGamma) / r, v: p.vGamma } : { i: 0, v: e }
  if (model === 'piecewise') {
    if (e <= p.vGamma) return { i: 0, v: e }
    const i = (e - p.vGamma) / (r + p.rd)
    return { i, v: p.vGamma + i * p.rd }
  }
  // 指數模型:解 (E − v)/R = Is(e^{v/nvt} − 1),以二分法求 v
  const f = (v: number) => (e - v) / r - diodeI(v, p.is, p.nvt)
  let lo = Math.min(e, 0) - 1e-9
  let hi = Math.max(e, 0.0001)
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2
    if (f(mid) > 0) lo = mid; else hi = mid
  }
  const v = (lo + hi) / 2
  return { i: (e - v) / r, v }
}

/** 溫度對順向壓降:約 −2.5 mV/℃(習作採用) */
export const TEMP_COEFF = -0.0025
export const vfAtTemp = (vf25: number, tCelsius: number) => vf25 + TEMP_COEFF * (tCelsius - 25)
