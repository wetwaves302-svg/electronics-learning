/** 數值答案判定:支援 SI 前綴單位換算、容許誤差、有效位數。不以字串比對。 */

const PREFIX: Record<string, number> = {
  T: 1e12, G: 1e9, M: 1e6, k: 1e3, K: 1e3, '': 1, m: 1e-3, μ: 1e-6, µ: 1e-6, u: 1e-6, n: 1e-9, p: 1e-12,
}

/** 基本單位與其可接受別名(同一物理量,不同量不可混用) */
const BASE_UNITS = ['V', 'A', 'Ω', 'ohm', 'Ohm', 'Hz', 's', 'W', 'F', 'J', 'eV', '%', '°', 'deg', ''] as const

export interface ParsedValue {
  /** 換算為基本單位後的數值 */
  value: number
  /** 正規化後的基本單位('' 表示無單位) */
  unit: string
}

function normBase(u: string) {
  if (u === 'ohm' || u === 'Ohm') return 'Ω'
  if (u === 'deg') return '°'
  return u
}

/** 解析如 "20 mA"、"0.02A"、"4.5×10^6"、"1.5e10"、"60%"、"25Ω" */
export function parseQuantity(raw: string): ParsedValue | null {
  const s = raw
    .trim()
    .replace(/\s+/g, '')
    .replace(/[×xX＊*]10\^?\{?(-?\d+)\}?/g, 'e$1')
    .replace(/，/g, '')
    .replace(/,/g, '')
    .replace(/−/g, '-')
  const m = s.match(/^([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)(.*)$/)
  if (!m) return null
  const num = Number(m[1])
  if (!Number.isFinite(num)) return null
  const rest = m[2]
  if (rest === '') return { value: num, unit: '' }
  for (const base of [...BASE_UNITS].sort((a, b) => b.length - a.length)) {
    if (base === '') continue
    if (rest.endsWith(base)) {
      const prefix = rest.slice(0, rest.length - base.length)
      if (prefix in PREFIX) {
        return { value: num * PREFIX[prefix], unit: normBase(base) }
      }
    }
  }
  return null
}

export interface NumericSpec {
  /** 標準答案(基本單位) */
  value: number
  /** 基本單位,'' 表示無單位 */
  unit: string
  /** 相對容許誤差,預設 1% */
  relTol?: number
  /** 絕對容許誤差(值接近 0 時使用) */
  absTol?: number
}

export type JudgeResult =
  | { ok: true }
  | { ok: false; reason: 'unparsable' | 'wrongUnit' | 'missingUnit' | 'outOfTolerance' }

/**
 * 判定。規則:
 * - 標準答案有單位時,學生必須填寫相容單位,0.02 A 與 20 mA 視為相同。
 * - 單位不同物理量(如 V 與 A)判 wrongUnit。
 * - 未寫單位判 missingUnit,以便提示而非直接視為觀念錯誤。
 */
export function judgeNumeric(input: string, spec: NumericSpec): JudgeResult {
  const p = parseQuantity(input)
  if (!p) return { ok: false, reason: 'unparsable' }
  if (spec.unit !== '' && p.unit === '') return { ok: false, reason: 'missingUnit' }
  if (p.unit !== spec.unit) return { ok: false, reason: 'wrongUnit' }
  const rel = spec.relTol ?? 0.01
  const abs = spec.absTol ?? 0
  const diff = Math.abs(p.value - spec.value)
  if (diff <= abs || diff <= Math.abs(spec.value) * rel) return { ok: true }
  return { ok: false, reason: 'outOfTolerance' }
}
