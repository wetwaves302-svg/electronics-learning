import { describe, expect, it } from 'vitest'
import { questions } from '../questions'
import { dutyCycle, mixedRms, sinePeak, sineRms, symmetricWave, triangularPulse, combineSameFreqSines } from '../../core/physics'
import type { VariantQ } from '../types'

const num = (v: VariantQ) => { if (!('part' in v)) throw new Error('not numeric'); return v }
const q = (id: string) => questions.find((x) => x.id === id)!

describe('第 1 章教練引用的數值經核心重算', () => {
  it('MC-08:AC 100 V → Vm = 141.4 V;反推 141.4/1.414 = 100', () => {
    expect(sinePeak(100)).toBeCloseTo(141.42, 1)
    expect(141.4 / 1.414).toBeCloseTo(100, 1)
  })
  it('MC-11:2 sin(314t+30°):Vrms 1.414、f = 314/2π ≈ 50、T = 20 ms;314÷6.28 = 50', () => {
    expect(sineRms(2)).toBeCloseTo(1.414, 3)
    expect(314 / (2 * Math.PI)).toBeCloseTo(50, 1)
    expect(1000 / 50).toBe(20)
    expect(314 / 6.28).toBeCloseTo(50, 6)
  })
  it('MC-13:3/(3+2) = 60%', () => expect(dutyCycle(3, 2)).toBeCloseTo(0.6))
  it('MC-15:弦波 FF = π/(2√2) ≈ 1.11 = (Vm/√2)/(2Vm/π)', () => {
    expect(symmetricWave('sine', 1).formFactor).toBeCloseTo(Math.PI / (2 * Math.SQRT2), 9)
    expect(Math.PI / 2.828).toBeCloseTo(1.11, 2)
  })
  it('MC-16:三角波 CF = √3;Vrms 比同峰值弦波小', () => {
    expect(symmetricWave('triangle', 1).crestFactor).toBeCloseTo(Math.sqrt(3), 9)
    expect(symmetricWave('triangle', 1).rms).toBeLessThan(symmetricWave('sine', 1).rms)
  })
  it('MC-17:只有方波 FF = CF;弦波 1.11≠1.414、三角 1.155≠1.732', () => {
    const eq = (k: 'sine' | 'square' | 'triangle') => Math.abs(symmetricWave(k, 1).formFactor - symmetricWave(k, 1).crestFactor) < 1e-9
    expect([eq('sine'), eq('square'), eq('triangle')]).toEqual([false, true, false])
  })
  it('MC-18:FF 三角 1.155 > 弦波 1.11 > 方波 1;三角 FF = 2/√3', () => {
    const f = (k: 'sine' | 'square' | 'triangle') => symmetricWave(k, 1).formFactor
    expect(f('triangle')).toBeGreaterThan(f('sine'))
    expect(f('sine')).toBeGreaterThan(f('square'))
    expect(f('triangle')).toBeCloseTo(2 / Math.sqrt(3), 9)
    expect(2 / 1.732).toBeCloseTo(1.155, 3)
  })
  it('MC-20:Vrms = √(9+16) = 5;最高 3+4√2 ≈ 8.66;(3√3)² = 27', () => {
    expect(mixedRms(3, [4 * Math.SQRT2])).toBeCloseTo(5, 9)
    expect(3 + 4 * Math.SQRT2).toBeCloseTo(8.657, 3)
    expect(4 * Math.SQRT2 / Math.SQRT2).toBeCloseTo(4, 9)
    expect((3 * Math.sqrt(3)) ** 2).toBeCloseTo(27, 9)
  })
  it('QA-03:格數 → Vm = 8、T = 20 ms、f = 50、ω = 100π;t=5ms 時 −8 sin(π/2) = −8', () => {
    expect(2 * 4).toBe(8)
    expect(1 / 0.02).toBe(50)
    expect(2 * Math.PI * 50).toBeCloseTo(100 * Math.PI, 9)
    expect(-8 * Math.sin(100 * Math.PI * 0.005)).toBeCloseTo(-8, 9)
  })
  it('QA-04:三角脈波 Vm=9、寬 T/3:Vav 1.5、Vrms 3、FF 2、CF 3;Vrms² = Vm²/9', () => {
    const m = triangularPulse(9, 1 / 3)
    expect([m.avg, m.rms, m.formFactor, m.crestFactor].map((x) => Math.round(x * 1e6) / 1e6)).toEqual([1.5, 3, 2, 3])
    expect(m.rms ** 2).toBeCloseTo(81 / 9, 9)
  })
  it('QA-05:展開後 8√2 sinωt + 3√2 cosωt,AC 有效值 √73,總有效值 10;直接相加峰值得約 10.39', () => {
    const s = combineSameFreqSines([{ peak: 4 * Math.SQRT2, phaseDeg: 0 }, { peak: 5 * Math.SQRT2, phaseDeg: (Math.atan2(3, 4) * 180) / Math.PI }])
    expect(s.a).toBeCloseTo(8 * Math.SQRT2, 9)
    expect(s.b).toBeCloseTo(3 * Math.SQRT2, 9)
    expect(s.peak / Math.SQRT2).toBeCloseTo(Math.sqrt(73), 9)
    expect(mixedRms(3 * Math.sqrt(3), [s.peak])).toBeCloseTo(10, 9)
    expect(Math.sqrt(27 + 81)).toBeCloseTo(10.39, 2)
    expect(Math.sqrt(73)).toBeLessThan(9)
  })
  it('PY-01:Vrms = 0.0707、f = 500、sin(10π) = 0', () => {
    expect(sineRms(0.1)).toBeCloseTo(0.0707, 4)
    expect(1000 * Math.PI / (2 * Math.PI)).toBeCloseTo(500, 9)
    expect(Math.abs(Math.sin(10 * Math.PI))).toBeLessThan(1e-9)
  })
  it('PY-04:cos(x+13°) = sin(x+103°);差 58°;直接相減 32°', () => {
    const x = 0.7, d = Math.PI / 180
    expect(Math.cos(x + 13 * d)).toBeCloseTo(Math.sin(x + 103 * d), 9)
    expect(103 - 45).toBe(58)
    expect(45 - 13).toBe(32)
  })
})

describe('第 1 章變化題:題幹數字與標準答案一致', () => {
  it('波形因數/波峰因數:標準答案與波形名稱、種類相符', () => {
    const v = q('WB1-MC-15').variant!
    for (let seed = 0; seed < 16; seed++) {
      const x = num(v.make(seed))
      const kind = (['sine', 'square', 'triangle', 'sawtooth'] as const)[['弦波', '方波', '三角波', '鋸齒波'].findIndex((n) => x.stem.includes(n))]
      const m = symmetricWave(kind, 1)
      expect(x.part.value).toBeCloseTo(x.stem.includes('波峰因數') ? m.crestFactor : m.formFactor, 9)
    }
  })
  it('PY-04:由題幹重算相位差', () => {
    const v = q('WB1-PY-04').variant!
    for (let seed = 0; seed < 10; seed++) {
      const x = num(v.make(seed))
      const m = x.stem.match(/cos\(100πt \+ (\d+)°\).*sin\(100πt \+ (\d+)°\)/)!
      expect(x.part.value).toBe(Number(m[1]) + 90 - Number(m[2]))
    }
  })
  it('QA-03:頻率 = 1/(4 格 × 每格時間)', () => {
    const v = q('WB1-QA-03').variant!
    for (let seed = 0; seed < 10; seed++) {
      const x = num(v.make(seed))
      const m = x.stem.match(/每格 ([\d.]+) ms/)!
      expect(x.part.value).toBeCloseTo(1 / ((Number(m[1]) * 4) / 1000), 9)
    }
  })
  it('混合波:由題幹重算 Vrms', () => {
    const v = q('WB1-MC-20').variant!
    for (let seed = 0; seed < 10; seed++) {
      const x = num(v.make(seed))
      const m = x.stem.match(/(\d+)√2 V,疊加直流 (\d+) V/)!
      expect(x.part.value).toBeCloseTo(Math.hypot(Number(m[2]), Number(m[1])), 9)
    }
  })
  it('QA-05:由題幹重算(sin37°=0.6、cos37°=0.8)', () => {
    const v = q('WB1-QA-05').variant!
    for (let seed = 0; seed < 10; seed++) {
      const x = num(v.make(seed))
      const m = x.stem.match(/= (\d+) \+ (\d+)√2 sinωt \+ (\d+)√2 sin/)!
      const [dc, a, b] = [Number(m[1]), Number(m[2]), Number(m[3])]
      const at = a + 0.8 * b, bt = 0.6 * b
      expect(x.part.value).toBeCloseTo(Math.hypot(dc, Math.sqrt(at * at + bt * bt)), 6)
    }
  })
  it('弦波敘述題:恰有一個錯誤選項(頻率誤用 ω),其餘三項皆由核心驗證為真', () => {
    const v = q('WB1-MC-11').variant!
    for (let seed = 0; seed < 10; seed++) {
      const x = v.make(seed)
      if (!('options' in x)) throw new Error()
      const m = x.stem.match(/= ([\d.]+) sin\(([\d.]+)t \+ (\d+)°\)/)!
      const [vm, w, ph] = [Number(m[1]), Number(m[2]), Number(m[3])]
      const f = w / (2 * Math.PI)
      const truths = x.options.map((o) => {
        if (o.startsWith('有效值')) return Math.abs(Number(o.match(/[\d.]+/)![0]) - sineRms(vm)) < 0.01
        if (o.startsWith('相角')) return Number(o.match(/\d+/)![0]) === ph
        if (o.startsWith('頻率')) return Math.abs(Number(o.match(/[\d.]+/)![0]) - f) < 0.5
        return Math.abs(Number(o.match(/[\d.]+/)![0]) - 1000 / f) < 0.01
      })
      expect(truths.filter((t) => !t)).toHaveLength(1)
      expect(truths[x.answer]).toBe(false)
    }
  })
})
