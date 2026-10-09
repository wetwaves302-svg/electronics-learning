import { dutyCycle, mixedRms, pulseAverage, sineRms, symmetricWave } from '../core/physics'

export interface Check {
  id: string
  kps: string[]
  q: string
  options: string[]
  answer: number
  explain: string
  /** 若為計算題,由核心重算標準答案,供測試驗證 */
  verify?: () => string
}

const f2 = (x: number) => String(Math.round(x * 100) / 100)

/** 1-2 教學區塊的小檢核。答案可計算者以 verify 與計算核心對照。 */
export const checks12: Check[] = [
  {
    id: 'LC-12-1', kps: ['KP-12-01'],
    q: '電壓大小會隨時間改變,但極性(正負)始終不變,這是哪一種波形?',
    options: ['純直流', '脈動直流', '交流'], answer: 1,
    explain: '大小不變、極性不變是純直流;大小會變、極性不變是脈動直流;極性會正負交替才是交流。',
  },
  {
    id: 'LC-12-2', kps: ['KP-12-02'],
    q: '一個波形的週期是 25 ms,頻率是多少?',
    options: ['25 Hz', '40 Hz', '400 Hz', '0.04 Hz'], answer: 1,
    explain: 'f = 1/T = 1 / 0.025 s = 40 Hz。注意先把 ms 換成 s。',
    verify: () => `${1 / 0.025} Hz`,
  },
  {
    id: 'LC-12-3', kps: ['KP-12-03'],
    q: '插座標示 AC 110 V,這個 110 V 指的是?',
    options: ['峰值', '有效值', '平均值'], answer: 1,
    explain: '電源標示的電壓是有效值。峰值是 110 × √2 ≈ 155.6 V。',
    verify: () => `${f2(110 * Math.SQRT2)} V`,
  },
  {
    id: 'LC-12-4', kps: ['KP-12-05'],
    q: '脈波高位準 5 V、低位準 0 V,工作週期 40%,平均值是多少?',
    options: ['1 V', '2 V', '2.5 V', '3 V'], answer: 1,
    explain: 'Vav = VH × D + VL × (1 − D) = 5 × 0.4 + 0 × 0.6 = 2 V。',
    verify: () => `${pulseAverage(5, 0, 0.4)} V`,
  },
  {
    id: 'LC-12-5', kps: ['KP-12-06'],
    q: '哪一種波形的波形因數與波峰因數都等於 1?',
    options: ['弦波', '三角波', '方波'], answer: 2,
    explain: '方波的峰值、有效值、整流平均值都一樣大,所以 FF = CF = 1。',
    verify: () => { const w = symmetricWave('square', 3); return `FF=${w.formFactor} CF=${w.crestFactor}` },
  },
  {
    id: 'LC-12-6', kps: ['KP-12-08'],
    q: '直流 4 V 疊加峰值 3√2 V 的弦波,有效值是多少?',
    options: ['7 V', '5 V', '約 8.24 V', '1 V'], answer: 1,
    explain: '交流有效值 = 3√2/√2 = 3 V。Vrms = √(4² + 3²) = 5 V。直流與交流不能直接相加有效值。',
    verify: () => `${mixedRms(4, [3 * Math.SQRT2])} V`,
  },
]

/** 供測試使用 */
export const _core = { dutyCycle, sineRms }
