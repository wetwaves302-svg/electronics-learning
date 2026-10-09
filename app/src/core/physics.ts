/** 電子學 I(1-1～2-3)計算核心。所有公式皆為封閉解,供題庫答案驗證與動畫使用。 */

export type WaveKind = 'sine' | 'square' | 'triangle' | 'sawtooth' | 'fullRectSine' | 'halfRectSine'

export interface WaveMetrics {
  /** 平均值(整個週期,含符號) */
  avg: number
  rms: number
  /** 波形因數 FF = Vrms / Vav(以整流平均值,即絕對值平均) */
  formFactor: number
  /** 波峰因數 CF = Vm / Vrms */
  crestFactor: number
}

/** 對稱於 0 的週期波(正弦、方波、三角、鋸齒):峰值 vm */
export function symmetricWave(kind: 'sine' | 'square' | 'triangle' | 'sawtooth', vm: number): WaveMetrics {
  const absAvgRatio = { sine: 2 / Math.PI, square: 1, triangle: 0.5, sawtooth: 0.5 }[kind]
  const rmsRatio = { sine: 1 / Math.SQRT2, square: 1, triangle: 1 / Math.sqrt(3), sawtooth: 1 / Math.sqrt(3) }[kind]
  const absAvg = absAvgRatio * vm
  const rms = rmsRatio * vm
  return { avg: 0, rms, formFactor: rms / absAvg, crestFactor: vm / rms }
}

/** 弦波有效值 */
export const sineRms = (vm: number) => vm / Math.SQRT2
/** 由有效值求峰值 */
export const sinePeak = (vrms: number) => vrms * Math.SQRT2

export const frequencyFromPeriod = (periodSec: number) => 1 / periodSec
export const periodFromFrequency = (hz: number) => 1 / hz

/** 工作週期(0~1) */
export const dutyCycle = (tHigh: number, tLow: number) => tHigh / (tHigh + tLow)

/** 脈波平均值,vh 與 vl 為高低位準 */
export const pulseAverage = (vh: number, vl: number, duty: number) => vh * duty + vl * (1 - duty)

/** 由脈波平均值反求工作週期 */
export const dutyFromAverage = (vh: number, vl: number, avg: number) => (avg - vl) / (vh - vl)

/** 脈波有效值 */
export const pulseRms = (vh: number, vl: number, duty: number) => Math.sqrt(vh * vh * duty + vl * vl * (1 - duty))

/** 三角脈波(寬 T/k,峰值 vm,每週期一個):用於 WB1-QA-04 */
export function triangularPulse(vm: number, widthFraction: number): WaveMetrics {
  const avg = (vm / 2) * widthFraction
  const rms = Math.sqrt((vm * vm) / 3 * widthFraction)
  return { avg, rms, formFactor: rms / avg, crestFactor: vm / rms }
}

/**
 * 交直流混合波有效值:Vrms = sqrt(Vdc² + Σ(Vm_k/√2)²)。
 * 同頻不同相位須先合成為單一正弦(見 combineSameFreqSines)再套用。
 */
export function mixedRms(vdc: number, acPeaks: number[]) {
  return Math.sqrt(vdc * vdc + acPeaks.reduce((s, v) => s + (v * v) / 2, 0))
}

/** 同頻率正弦波 A·sin(ωt+φ) 的和,回傳 a·sinωt + b·cosωt 的 (a, b) 與合成峰值、相位(度) */
export function combineSameFreqSines(terms: { peak: number; phaseDeg: number }[]) {
  let a = 0
  let b = 0
  for (const { peak, phaseDeg } of terms) {
    const p = (phaseDeg * Math.PI) / 180
    a += peak * Math.cos(p)
    b += peak * Math.sin(p)
  }
  return { a, b, peak: Math.hypot(a, b), phaseDeg: (Math.atan2(b, a) * 180) / Math.PI }
}

/** cos(ωt+θ) 轉成 sin 的相位:cos x = sin(x+90°) */
export const cosPhaseToSinPhase = (thetaDeg: number) => thetaDeg + 90

/* ───────── 2-1 半導體 ───────── */

/** 摻雜濃度(每 ratioDenominator 個原子摻 1 個施體/受體) */
export const dopantConcentration = (atomDensity: number, ratioDenominator: number) => atomDensity / ratioDenominator

/** 質量作用定律:少數載子濃度 = ni² / 多數載子濃度。多數載子 ≈ 摻雜濃度(須 N ≫ ni) */
export function minorityCarrier(ni: number, majority: number) {
  return (ni * ni) / majority
}

/** 1 eV = 1.6×10⁻¹⁹ J */
export const EV_TO_JOULE = 1.6e-19

/* ───────── 2-2 二極體 ───────── */

/** 動態電阻 rd = VT / IDQ;vt 預設 25 mV(本教材習作採用) */
export const dynamicResistance = (idqAmp: number, vtVolt = 0.025) => vtVolt / idqAmp

/** 矽二極體順向壓降隨溫度變化:約 −2.5 mV/℃ */
export const forwardDropAtTemp = (vdAtT0: number, t0: number, t1: number, tcVoltPerC = -0.0025) =>
  vdAtT0 + tcVoltPerC * (t1 - t0)

/** 分壓:vin × r2 / (r1 + r2) */
export const divider = (vin: number, r1: number, r2: number) => (vin * r2) / (r1 + r2)

export const parallel = (...rs: number[]) => 1 / rs.reduce((s, r) => s + 1 / r, 0)

export interface Thevenin {
  vth: number
  rth: number
}

/** 理想二極體導通判斷(單一二極體串在戴維寧等效後):vth>0 導通 */
export function idealDiodeWithThevenin(th: Thevenin, loadR: number) {
  const on = th.vth > 0
  const i = on ? th.vth / (th.rth + loadR) : 0
  return { on, current: i, vout: i * loadR }
}

/* ───────── 2-3 整流濾波 ───────── */

export interface RectifierOutput {
  vo_peak: number
  vo_dc: number
  vo_rms: number
  /** 輸出頻率相對輸入頻率的倍數 */
  freqMultiplier: number
  /** 漣波因數 r = sqrt((Vrms/Vdc)² − 1)(未濾波) */
  rippleFactor: number
}

/** 理想二極體半波整流,vm 為二極體輸入(次級)峰值 */
export function halfWave(vm: number): RectifierOutput {
  const dc = vm / Math.PI
  const rms = vm / 2
  return { vo_peak: vm, vo_dc: dc, vo_rms: rms, freqMultiplier: 1, rippleFactor: Math.sqrt((rms / dc) ** 2 - 1) }
}

/** 理想二極體全波整流(中心抽頭每半邊 vm,或橋式輸入端 vm) */
export function fullWave(vm: number): RectifierOutput {
  const dc = (2 * vm) / Math.PI
  const rms = vm / Math.SQRT2
  return { vo_peak: vm, vo_dc: dc, vo_rms: rms, freqMultiplier: 2, rippleFactor: Math.sqrt((rms / dc) ** 2 - 1) }
}

/** 變壓器次級峰值:Vs(m) = (N2/N1) × Vi(m) */
export const transformerSecondaryPeak = (viPeak: number, n1: number, n2: number) => (viPeak * n2) / n1

/** 半波整流 PIV = Vs(m);中心抽頭全波 PIV = 2·Vs(m,每半邊);橋式 PIV = Vs(m) */
export const pivHalfWave = (vsPeak: number) => vsPeak
export const pivCenterTapFullWave = (vsPeakPerHalf: number) => 2 * vsPeakPerHalf
export const pivBridge = (vsPeak: number) => vsPeak

/** 濾波後直流平均值近似:Vdc ≈ Vp − Vr(pp)/2(三角形漣波近似) */
export const filteredDc = (vp: number, ripplePeakToPeak: number) => vp - ripplePeakToPeak / 2
