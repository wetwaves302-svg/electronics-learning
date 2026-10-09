import { describe, expect, it } from 'vitest'
import katex from 'katex'
import { questions } from '../questions'
import type { VariantQ } from '../types'
import { judgeNumeric } from '../../core/answer'
import { dutyFromAverage, frequencyFromPeriod, pulseAverage, sineRms, fullWave, halfWave, transformerSecondaryPeak } from '../../core/physics'
import { solveRectifier, sweepRectifier } from '../../core/rectifier'

const N = (v: VariantQ) => { if (!('part' in v)) throw new Error('非數值變化題'); return v }
const ORDER = ['read', 'analyze', 'principle', 'formula', 'compute', 'verify']
const coached = questions.filter((q) => q.coach)

describe('教練步驟結構', () => {
  it('至少有 3 題已建置教練內容', () => expect(coached.length).toBeGreaterThanOrEqual(3))
  it('每題:六步驟齊全、順序正確;每步選項、提示、說明完整(一次列出全部違規)', () => {
    const bad: string[] = []
    for (const q of coached) {
      if (q.coach!.map((s) => s.id).join() !== ORDER.join()) bad.push(`${q.id}: 步驟順序不對`)
      if (!q.variant) bad.push(`${q.id}: 缺遷移練習產生器`)
      for (const s of q.coach!) {
        const at = `${q.id}/${s.id}`
        if (s.ask.answer < 0 || s.ask.answer >= s.ask.options.length) bad.push(`${at}: answer 索引無效`)
        if (s.ask.options.length < 3) bad.push(`${at}: 選項少於 3`)
        if (new Set(s.ask.options).size !== s.ask.options.length) bad.push(`${at}: 選項重複`)
        if (s.hints.length !== 3) bad.push(`${at}: 提示不是 3 層`)
        s.hints.forEach((h, i) => { if (h.length <= 5) bad.push(`${at}: 提示 ${i + 1} 太短「${h}」`) })
        if (s.teach.length <= 10) bad.push(`${at}: teach 太短`)
        if (s.commonMistake.length <= 5) bad.push(`${at}: 常見錯誤太短「${s.commonMistake}」`)
        if (s.ask.why.length <= 5) bad.push(`${at}: why 太短`)
        if (/第[一二三四]個(選項|答案)|第 ?[一二三四] ?項|前兩個(選項|答案)|最後一個(選項|答案)|上一個選項/.test(s.ask.why)) bad.push(`${at}: why 用位置描述選項`)
      }
    }
    expect(bad).toEqual([])
  })
})

describe('教練內容引用的數值經核心重算', () => {
  it('MC-07:100/√2 = 70.7,141.4 大於峰值故不合理', () => {
    expect(sineRms(100)).toBeCloseTo(70.71, 1)
    expect(100 * Math.SQRT2).toBeGreaterThan(100)
  })
  it('MC-10:1/50μs = 20 kHz,反推 50 μs;1÷50=0.02', () => {
    expect(frequencyFromPeriod(50e-6)).toBeCloseTo(20000)
    expect(1 / 20000).toBeCloseTo(50e-6)
    expect(1 / 50).toBeCloseTo(0.02)
  })
  it('MC-14:D=0.6;回代 5.2;離 10V 差 4.8、離 −2V 差 7.2;錯誤選項值 0.27、0.43 確為常見錯法', () => {
    expect(dutyFromAverage(10, -2, 5.2)).toBeCloseTo(0.6)
    expect(pulseAverage(10, -2, 0.6)).toBeCloseTo(5.2)
    expect(10 - 5.2).toBeCloseTo(4.8)
    expect(5.2 + 2).toBeCloseTo(7.2)
    expect(3.2 / 12).toBeCloseTo(0.267, 2) // 把 +2 做成 −2
    expect(5.2 / 12).toBeCloseTo(0.433, 2) // 忘了加 2
    expect(12 * 0.6 - 2).toBeCloseTo(5.2)
  })
})

describe('變化題產生器', () => {
  for (const q of coached) {
    it(`${q.id}:40 組種子的標準答案自洽,且題目數字彼此一致`, () => {
      const seen = new Set<string>()
      for (let seed = 0; seed < 40; seed++) {
        const v0 = q.variant!.make(seed)
        seen.add(v0.stem)
        if (!('part' in v0)) {
          expect(new Set(v0.options).size, `${q.id} seed ${seed}`).toBe(v0.options.length)
          expect(v0.options.length).toBeGreaterThanOrEqual(3)
          expect(v0.answer).toBeGreaterThanOrEqual(0)
          expect(v0.answer).toBeLessThan(v0.options.length)
          expect(v0.why.length).toBeGreaterThan(5)
          // 防呆:選項不得混入提示用語(曾發生批次改寫誤傷)
          for (const o of v0.options) expect(/先想一想:「|關鍵在於「|所以答案的方向是「/.test(o), `${q.id} ${o}`).toBe(false)
          continue
        }
        const v = v0
        expect(Number.isFinite(v.part.value)).toBe(true)
        expect(judgeNumeric(`${v.part.value}${v.part.unit}`, v.part).ok, `${q.id} seed ${seed}`).toBe(true)
        if (q.id === 'WB1-MC-14') {
          expect(v.part.value).toBeGreaterThan(0)
          expect(v.part.value).toBeLessThan(100)
          const m = v.stem.match(/VH = (-?[\d.]+) V,VL = (-?[\d.]+) V,平均值為 (-?[\d.]+) V/)!
          const [vh, vl, avg] = [Number(m[1]), Number(m[2]), Number(m[3])]
          expect(vh).toBeGreaterThan(vl)
          expect(dutyFromAverage(vh, vl, avg) * 100).toBeCloseTo(v.part.value, 6)
        }
      }
      expect(seen.size).toBeGreaterThan(3)
    })
  }
})

describe('數學式(KaTeX)', () => {
  it('所有教練步驟的 tex 都能無錯誤渲染', () => {
    for (const q of coached) for (const s of q.coach!) for (const m of s.math ?? []) {
      if (m.tex) expect(() => katex.renderToString(m.tex!, { throwOnError: true }), `${q.id}/${s.id}`).not.toThrow()
    }
  })
})

describe('2-3 教練內容引用的數值經核心與電路求解器驗證', () => {
  it('MC-08:截止時 RL 電壓為 0、二極體承受全部輸入電壓(−100V);AC 100V 的 PIV = 141.4V', () => {
    const s = solveRectifier('half', -100)
    expect(Math.abs(s.vo)).toBeLessThan(1e-3)
    expect(s.vak.D1).toBeCloseTo(-100, 2)
    expect(100 * Math.SQRT2).toBeCloseTo(141.42, 1)
  })
  it('MC-10:全波輸出頻率 2 倍;輸出週期 8.33 ms 是輸入 16.7 ms 的一半', () => {
    expect(fullWave(1).freqMultiplier * 60).toBe(120)
    expect(1 / 120).toBeCloseTo(0.00833, 4)
    expect(1 / 60).toBeCloseTo(0.01667, 4)
  })
  it('PY-05:上半邊正峰值時 D2 陽極 −Vs(m)、陰極 +Vs(m),V_AK = −2Vs(m);24√2 ≈ 33.94', () => {
    const half = 12 * Math.SQRT2
    const s = solveRectifier('centerTap', half)
    expect(s.on.D1).toBe(true)
    expect(s.on.D2).toBe(false)
    expect(s.vak.D2).toBeCloseTo(-2 * half, 1)
    expect(2 * half).toBeCloseTo(33.94, 1)
    expect(24 * 1.414).toBeCloseTo(33.94, 1)
    const piv = -Math.min(...sweepRectifier('centerTap', half, 100, 720).map((x) => x.state.vak.D2))
    expect(piv).toBeCloseTo(33.94, 1)
  })
  it('QA-03:半波數值與排序 dc < rms < p;Vo(rms)/Vo(dc) = π/2', () => {
    const vm = transformerSecondaryPeak(100 * Math.SQRT2, 10, 1)
    const h = halfWave(vm)
    expect(h.vo_dc).toBeLessThan(h.vo_rms)
    expect(h.vo_rms).toBeLessThan(h.vo_peak)
    expect(h.vo_rms / h.vo_dc).toBeCloseTo(Math.PI / 2, 6)
    expect(14.14 / Math.PI).toBeCloseTo(4.5, 1)
  })
})

describe('2-3 變化題的標準答案與題幹數字一致', () => {
  it('MC-08 / MC-10 / PY-05 / QA-03 變化題:由題幹重算與 part.value 相同', () => {
    const q = (id: string) => coached.find((x) => x.id === id)!
    for (let seed = 0; seed < 30; seed++) {
      const a = N(q('WB2-MC-08').variant!.make(seed))
      const ma = a.stem.match(/AC (\d+) V|(\d+) sinωt/)!
      const vm = ma[1] ? Number(ma[1]) * Math.SQRT2 : Number(ma[2])
      expect(a.part.value).toBeCloseTo(vm, 6)

      const b = N(q('WB2-MC-10').variant!.make(seed))
      const mb = b.stem.match(/^(\d+) Hz.*經(全波|半波)/)!
      expect(b.part.value).toBe(Number(mb[1]) * (mb[2] === '全波' ? 2 : 1))

      const c = N(q('WB2-PY-05').variant!.make(seed))
      const mc = c.stem.match(/AC (\d+) V.*?(\d+):(\d+)/)!
      const vs = (Number(mc[1]) * Math.SQRT2 * Number(mc[3])) / Number(mc[2])
      expect(c.part.value).toBeCloseTo(vs, 6) // 中心抽頭 PIV = 次級(全部)峰值

      const d = N(q('WB2-QA-03').variant!.make(seed))
      const md = d.stem.match(/輸入 (\d+) V.*?(\d+):(\d+)/)!
      const vp = (Number(md[1]) * Math.SQRT2 * Number(md[3])) / Number(md[2])
      expect(d.part.value).toBeCloseTo(vp / Math.PI, 1)
    }
  })
  it('四個變化題都產生多種不同題幹', () => {
    for (const id of ['WB2-MC-08', 'WB2-MC-10', 'WB2-PY-05', 'WB2-QA-03']) {
      const v = coached.find((x) => x.id === id)!.variant!
      expect(new Set(Array.from({ length: 12 }, (_, s) => v.make(s).stem)).size, id).toBeGreaterThan(3)
    }
  })
})

describe('正確答案位置分散(避免總是第一個)', () => {
  it('六步驟的正確選項位置不全相同,且排在第一個的比例不超過一半', () => {
    const pos: number[] = []
    for (const q of coached) for (const s of q.coach!) pos.push(s.ask.answer)
    expect(new Set(pos).size).toBeGreaterThanOrEqual(3)
    expect(pos.filter((x) => x === 0).length / pos.length).toBeLessThan(0.5)
  })
  it('位置調整後,正確選項的文字仍是原本的正確答案(以 spread 前後對照)', async () => {
    const { spreadOptions } = await import('./spread')
    const r = spreadOptions(['對', '錯1', '錯2', '錯3'], 0, 'x:y')
    expect(r.options[r.answer]).toBe('對')
    expect([...r.options].sort()).toEqual(['對', '錯1', '錯2', '錯3'].sort())
  })
})
