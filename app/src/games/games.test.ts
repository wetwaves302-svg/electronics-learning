import { describe, expect, it } from 'vitest'
import katex from 'katex'
import { games } from './index'
import { subCount, type GameItem, type Visual, type WaveSpec } from './types'
import { waveFn } from './WaveVisual'
import { scramble } from './Items'
import { knowledgePoints } from '../data/knowledgePoints'
import { judgeNumeric } from '../core/answer'
import { symmetricWave } from '../core/physics'
import { measure } from '../core/waveform'

const W = (v?: Visual): WaveSpec => { if (!v || v.kind !== 'wave') throw new Error('不是波形圖像'); return v.wave }
const kpIds = new Set(knowledgePoints.map((k) => k.id))
const allItems = games.flatMap((g) => g.levels.flatMap((l) => l.items.map((it) => ({ g, l, it }))))
const kpsOf = (it: GameItem) => (it.kind === 'match' ? it.pairs.map((p) => p.kp) : it.kind === 'classify' ? it.things.map((t) => t.kp) : [it.kp])
const waves = (it: GameItem): WaveSpec[] =>
  it.kind === 'classify' ? it.things.flatMap((t) => (t.visual?.kind === 'wave' ? [t.visual.wave] : [])) : []

describe('遊戲資料結構', () => {
  it('每個遊戲有 3 關,每關約 5~8 小題', () => {
    for (const g of games) {
      expect(g.levels.map((l) => l.level)).toEqual([1, 2, 3])
      for (const l of g.levels) {
        const n = l.items.reduce((s, it) => s + subCount(it), 0)
        expect(n, `${g.id} L${l.level}`).toBeGreaterThanOrEqual(5)
        expect(n, `${g.id} L${l.level}`).toBeLessThanOrEqual(8)
      }
    }
  })
  it('知識點編號存在(與習作共用)', () => {
    for (const { g, it } of allItems) for (const k of kpsOf(it)) expect(kpIds.has(k), `${g.id} ${k}`).toBe(true)
  })
  it('每題都有提示與解釋', () => {
    for (const { g, it } of allItems) { expect(it.hint.length, g.id).toBeGreaterThan(3); expect(it.explain.length, g.id).toBeGreaterThan(3) }
  })
  it('選擇題:答案索引有效', () => {
    for (const { it } of allItems) if (it.kind === 'choice') { expect(it.answer).toBeGreaterThanOrEqual(0); expect(it.answer).toBeLessThan(it.options.length) }
  })
  it('配對題:右側不重複;洗牌不等於原順序', () => {
    for (const { it } of allItems) if (it.kind === 'match') {
      expect(new Set(it.pairs.map((p) => p.right)).size).toBe(it.pairs.length)
      expect(new Set(it.pairs.map((p) => p.left)).size).toBe(it.pairs.length)
      expect(scramble(it.pairs.length)).not.toEqual(it.pairs.map((_, i) => i))
    }
  })
  it('拼圖題:TeX 可渲染;洗牌後不等於正確順序', () => {
    for (const { it } of allItems) if (it.kind === 'puzzle') {
      for (const t of it.tokens) expect(() => katex.renderToString(t, { throwOnError: true }), t).not.toThrow()
      expect(scramble(it.tokens.length)).not.toEqual(it.tokens.map((_, i) => i))
    }
  })
  it('配對題的 TeX 可渲染', () => {
    for (const { it } of allItems) if (it.kind === 'match') for (const p of it.pairs) {
      if (p.leftTex) katex.renderToString(p.left, { throwOnError: true })
      if (p.rightTex) katex.renderToString(p.right, { throwOnError: true })
    }
  })
})

describe('遊戲內容的物理正確性(由波形公式與計算核心驗證)', () => {
  it('分類 L1:直流/脈動直流/交流的標籤與實際取樣波形一致', () => {
    const it = games.find((g) => g.id === 'g12-classify')!.levels[0].items[0]
    if (it.kind !== 'classify') throw new Error()
    for (const t of it.things) {
      const m = measure(waveFn(W(t.visual)), 1, 20000)
      const kind = m.max - m.min < 1e-9 ? 0 : m.min >= -1e-9 || m.max <= 1e-9 ? 1 : 2
      expect(kind, t.can).toBe(t.bucket)
    }
  })
  it('分類 L2:波峰因數的標籤與核心計算一致(1、√2、√3)', () => {
    const it = games.find((g) => g.id === 'g12-classify')!.levels[1].items[0]
    if (it.kind !== 'classify') throw new Error()
    const target = [1, Math.SQRT2, Math.sqrt(3)]
    for (const t of it.things) {
      const type = W(t.visual).type
      const kind = type === 'cosine' ? 'sine' : type
      const cf = symmetricWave(kind as 'sine' | 'square' | 'triangle' | 'sawtooth', 1).crestFactor
      expect(cf).toBeCloseTo(target[t.bucket], 6)
      // 以取樣數值再驗一次
      const m = measure(waveFn(W(t.visual)), 1)
      expect(m.max / m.rms).toBeCloseTo(target[t.bucket], 2)
    }
  })
  it('波形偵探 L2:恰有一個選項符合「FF=CF=1」,且為標示答案;「交流」題只有答案會穿過 0 V', () => {
    const lv = games.find((g) => g.id === 'g12-wave')!.levels[1]
    const ff = lv.items.find((i) => i.kind === 'choice' && i.can === '波形因數')!
    const ac = lv.items.find((i) => i.kind === 'choice' && i.can === '交流')!
    if (ff.kind !== 'choice' || ac.kind !== 'choice') throw new Error()
    const hits = ff.options.map((o, i) => { const m = measure(waveFn(W(o.visual)), 1); return Math.abs(m.rms / m.absAvg - 1) < 1e-3 && Math.abs(m.max / m.rms - 1) < 1e-3 ? i : -1 }).filter((i) => i >= 0)
    expect(hits).toEqual([ff.answer])
    const crosses = ac.options.map((o) => { const m = measure(waveFn(W(o.visual)), 1, 20000); return m.min < -1e-6 && m.max > 1e-6 })
    expect(crosses.filter(Boolean)).toHaveLength(1)
    expect(crosses[ac.answer]).toBe(true)
  })
  it('餘弦波在 t=0 為最大值(辨識題的依據)', () => {
    expect(waveFn({ type: 'cosine', vm: 3 })(0)).toBeCloseTo(3)
    expect(waveFn({ type: 'sine', vm: 3 })(0)).toBeCloseTo(0)
  })
  it('示波器讀圖題:格數與題目數字一致(5 ms/格×4 格=20 ms=50 Hz;2 V/格×3 格=6 V)', () => {
    const lv = games.find((g) => g.id === 'g12-wave')!.levels[2]
    for (const it of lv.items) {
      if (it.kind !== 'calc' || it.visual?.kind !== 'wave' || !it.visual.wave.grid) continue
      const wave = W(it.visual)
      const g = wave.grid!
      const f = wave.f!
      expect(1 / f / g.tPerDiv, '一個週期占的格數').toBeCloseTo(4)
      expect(wave.vm / g.vPerDiv, '峰值占的格數').toBeCloseTo(3)
      // 峰值確實落在圖的範圍內
      expect(wave.vm).toBeLessThanOrEqual((g.vPerDiv * g.yDiv) / 2)
    }
  })
  it('計算題的標準答案可被判定器接受,且單位換算等價(20 kHz = 20000 Hz)', () => {
    for (const { g, it } of allItems) if (it.kind === 'calc') expect(judgeNumeric(`${it.part.value}${it.part.unit}`, it.part).ok, g.id).toBe(true)
    const f = games.find((g) => g.id === 'g12-wave')!.levels[2].items[2]
    if (f.kind !== 'calc') throw new Error()
    expect(judgeNumeric('20 kHz', f.part).ok).toBe(true)
    expect(judgeNumeric('20000 Hz', f.part).ok).toBe(true)
    expect(judgeNumeric('2 kHz', f.part).ok).toBe(false)
  })
  it('分類:每個 bucket 索引有效', () => {
    for (const { it } of allItems) if (it.kind === 'classify') for (const t of it.things) { expect(t.bucket).toBeLessThan(it.buckets.length); expect(t.visual || t.text).toBeTruthy() }
    expect(waves).toBeDefined()
  })
})

/* ───── 2-3 遊戲:內容由電路求解器驗證 ───── */
import { rectifierNetlist, solveRectifier, sweepRectifier, type RectifierKind } from '../core/rectifier'

const g23 = (id: string) => games.find((g) => g.id === id)!
const KIND_OF: Record<string, RectifierKind> = { 半波整流: 'half', 中心抽頭全波: 'centerTap', 橋式全波: 'bridge' }
const KINDS: RectifierKind[] = ['half', 'centerTap', 'bridge']
const diodeCount = (k: RectifierKind) => rectifierNetlist(k, 1, 100).els.filter((e) => e.type === 'D').length
const vCount = (k: RectifierKind) => rectifierNetlist(k, 1, 100).els.filter((e) => e.type === 'V').length
const onCounts = (k: RectifierKind) => sweepRectifier(k, 10, 100, 360).filter((x) => Math.abs(x.v) > 1).map((x) => Object.values(x.state.on).filter(Boolean).length)
const outFreq = (k: RectifierKind, vm = 10) => {
  const vo = sweepRectifier(k, vm, 100, 1440).map((x) => x.state.vo)
  let rises = 0
  for (let i = 0; i < vo.length; i++) if (vo[i] < vm * 0.5 && vo[(i + 1) % vo.length] >= vm * 0.5) rises++
  return rises
}
const minVakOf = (k: RectifierKind, vm: number) => {
  let m = 0
  for (const { state } of sweepRectifier(k, vm, 100, 720)) for (const x of Object.values(state.vak)) m = Math.min(m, x)
  return -m
}

describe('2-3 遊戲:題目與電路求解器一致', () => {
  it('電路偵探 L3:答案與求解器相同,且橋式 Vi>0 為 D1、D3(習作 MC-09)', () => {
    const lv = g23('g23-circuit').levels[2]
    const picked = lv.items.map((it) => { if (it.kind !== 'choice') throw new Error(); return it.options[it.answer].text })
    expect(picked).toEqual(['D1', '沒有二極體導通', 'D1', 'D2', 'D1、D3', 'D2、D4'])
    for (const it of lv.items) if (it.kind === 'choice') expect(new Set(it.options.map((o) => o.text)).size).toBe(it.options.length)
  })
  it('電路偵探 L2:每題答案與圖中電路種類一致', () => {
    const lv = g23('g23-circuit').levels[1]
    for (const it of lv.items) {
      if (it.kind !== 'choice' || it.visual?.kind !== 'circuit') throw new Error()
      const names = it.options.map((o) => o.text!)
      const hit = Object.entries(KIND_OF).find(([n]) => names[it.answer].startsWith(n))
      expect(hit?.[1], names[it.answer]).toBe(it.visual.circuit)
    }
  })
  it('分類 L1:每句描述與求解器得到的電路特性一致', () => {
    const it = g23('g23-classify').levels[0].items[0]
    if (it.kind !== 'classify') throw new Error()
    const rule: Record<string, (k: RectifierKind) => boolean> = {
      '只需要 1 顆二極體': (k) => diodeCount(k) === 1,
      '變壓器次級要有中心抽頭': (k) => vCount(k) === 2,
      '需要 4 顆二極體': (k) => diodeCount(k) === 4,
      '輸出頻率等於輸入頻率': (k) => outFreq(k) === 1,
      '任何時刻都有 2 顆二極體同時導通': (k) => onCounts(k).every((n) => n === 2),
      '每個半週輪流由 1 顆二極體導通,共 2 顆': (k) => diodeCount(k) === 2 && onCounts(k).every((n) => n === 1),
    }
    for (const t of it.things) {
      const matches = KINDS.filter(rule[t.text!])
      expect(matches, t.text).toHaveLength(1)
      expect(KIND_OF[it.buckets[t.bucket]], t.text).toBe(matches[0])
    }
  })
  it('分類 L2:PIV 分類與求解器的 PIV/次級峰值一致', () => {
    const it = g23('g23-classify').levels[1].items[0]
    if (it.kind !== 'classify') throw new Error()
    const ratio = (k: RectifierKind) => minVakOf(k, 10) / 10 // 以「每半邊/次級」電壓 10 V 為基準
    const textKind: Record<string, RectifierKind> = { 只用1顆二極體的整流電路: 'half', 次級有中心抽頭2顆二極體的整流電路: 'centerTap' }
    for (const t of it.things) {
      const k = t.visual?.kind === 'circuit' ? t.visual.circuit : textKind[t.text!.replace(/[、,\s]/g, '')]
      expect(k, String(t.text)).toBeDefined()
      expect(Math.round(ratio(k) * 10) / 10 === 2 ? 1 : 0, `${t.text ?? k}`).toBe(t.bucket)
    }
  })
  it('分類 L3:輸出頻率與求解器一致(60 Hz 輸入)', () => {
    const it = g23('g23-classify').levels[2].items[0]
    if (it.kind !== 'classify') throw new Error()
    for (const t of it.things) {
      const k: RectifierKind = t.visual?.kind === 'circuit' ? t.visual.circuit : t.text!.includes('半波') ? 'half' : 'bridge'
      expect(outFreq(k) * 60, t.text ?? k).toBe(it.buckets[t.bucket] === '60 Hz' ? 60 : 120)
    }
  })
  it('計算 L3:關鍵答案由獨立方式重算', () => {
    const lv = g23('g23-calc').levels[2].items.map((it) => { if (it.kind !== 'calc') throw new Error(); return it.part })
    expect(lv[0].value).toBeCloseTo(14.142, 2)
    expect(lv[1].value).toBeCloseTo(4.502, 2)
    expect(lv[3].value).toBe(17)
    expect(lv[4].value).toBeCloseTo(33.94, 1)
    expect(lv[5].value).toBe(800)
    // 以電路求解器對照半波 Vdc
    const vo = sweepRectifier('half', 14.142, 100, 1440).map((x) => x.state.vo)
    expect(vo.reduce((a, b) => a + b, 0) / vo.length).toBeCloseTo(lv[1].value, 1)
    expect(solveRectifier('half', 14.142).vo).toBeCloseTo(14.142, 2)
  })
})

/* ───── 1-1、2-1、2-2 遊戲:內容與講義資料、計算核心、求解器對照 ───── */
import { dopedCarriers as dc, niAt as ni, MATERIALS as MAT, solveSeries as ss } from '../core/semiconductor'
import { dynamicResistance as dynR, forwardDropAtTemp as fdt } from '../core/physics'
import { mc07Solve } from '../data/coach/ch2b'
import { DONORS_21, ACCEPTORS_21 } from './data/game21'

const lv = (gid: string, n: 0 | 1 | 2) => games.find((g) => g.id === gid)!.levels[n].items
const cls = (gid: string, n: 0 | 1 | 2) => { const it = lv(gid, n)[0]; if (it.kind !== 'classify') throw new Error('not classify'); return it }
const mapOf = (it: ReturnType<typeof cls>) => Object.fromEntries(it.things.map((t) => [t.text!, it.buckets[t.bucket]]))
const choices = (gid: string, n: 0 | 1 | 2) => lv(gid, n).map((it) => { if (it.kind !== 'choice') throw new Error('not choice'); return it })
const calcs = (gid: string, n: 0 | 1 | 2) => lv(gid, n).map((it) => { if (it.kind !== 'calc') throw new Error('not calc'); return it.part })

describe('1-1 遊戲(對照講義)', () => {
  it('時光機 L2:人物所屬時期(講義第 3~7 頁)', () => {
    expect(mapOf(cls('g11-history', 1))).toEqual({ 佛來明: '真空管時期', 德福萊斯: '真空管時期', 卜拉登: '電晶體時期', 巴定: '電晶體時期', 蕭特力: '電晶體時期', 基爾比: '積體電路時期', 迪耳: '積體電路時期' })
  })
  it('時光機 L3:諾貝爾物理獎年份', () => {
    const m = lv('g11-history', 2)[0]
    if (m.kind !== 'match') throw new Error()
    expect(Object.fromEntries(m.pairs.map((p) => [p.left, p.right]))).toEqual({ 羅倫茲: '1902 年', 湯姆生: '1906 年', 布朗: '1909 年', 基爾比: '2000 年', 巴定: '1956 與 1972 年(兩度)' })
  })
  it('時光機 L1:每題的正確選項', () => {
    expect(choices('g11-history', 0).map((c) => c.options[c.answer].text)).toEqual(['二極真空管', '三極管', '點觸式固態放大器(電晶體)', '第一個鍺積體電路', '三極管', '真空管'])
  })
  it('IC 工廠 L1:縮寫對應中文名稱', () => {
    const got = choices('g11-ic', 0).map((c) => [c.prompt, c.options[c.answer].text])
    expect(got.slice(0, 5)).toEqual([['「SSI」是哪一種積體電路?', '小型積體電路'], ['「MSI」是哪一種積體電路?', '中型積體電路'], ['「LSI」是哪一種積體電路?', '大型積體電路'], ['「VLSI」是哪一種積體電路?', '超大型積體電路'], ['「ULSI」是哪一種積體電路?', '極大型積體電路']])
    expect(got[5][1]).toBe('ULSI')
  })
  it('IC 工廠 L2:製程分段;L3:下一步(講義圖 1-20)', () => {
    expect(mapOf(cls('g11-ic', 1))).toEqual({ 晶圓切片與拋光: '晶圓處理(做出電路)', 蝕刻: '晶圓處理(做出電路)', 薄膜沉積: '晶圓處理(做出電路)', 打線: '測試與封裝', 晶粒切割: '測試與封裝', 包裝並測試: '測試與封裝' })
    expect(choices('g11-ic', 2).map((c) => [c.prompt.match(/「(.+?)」/)![1], c.options[c.answer].text])).toEqual([['光罩', '蝕刻'], ['晶圓測試', '晶粒切割'], ['晶粒切割', '晶粒貼附'], ['晶粒貼附', '打線'], ['打線', '包裝並測試'], ['包裝並測試', 'IC 完成品']])
    for (const c of choices('g11-ic', 2)) expect(new Set(c.options.map((o) => o.text)).size).toBe(c.options.length)
  })
  it('4C 大冒險:兩種 4C 的歸類與生活產品', () => {
    expect(mapOf(cls('g11-4c', 1))).toEqual({ Computer: '電子應用產品的 4C', Consumer: '電子應用產品的 4C', Car: '電子應用產品的 4C', Components: '元件、通訊、計算、控制的 4C', Computation: '元件、通訊、計算、控制的 4C', Control: '元件、通訊、計算、控制的 4C' })
    expect(mapOf(cls('g11-4c', 2))).toMatchObject({ 筆記型電腦: 'Computer 電腦', 智慧型手機: 'Communication 通訊', 電視機: 'Consumer 消費性電子', 倒車雷達: 'Car 車用電子' })
  })
})

describe('2-1 遊戲(對照講義與求解器)', () => {
  it('施體/受體元素分類與電子-電洞多寡一致(以摻雜公式驗證)', () => {
    const m = mapOf(cls('g21-vocab', 2))
    for (const n of DONORS_21) { expect(m[n]).toBe('施體(5 價,N 型)'); const c = dc(1.5e10, 1e15, true); expect(c.n).toBeGreaterThan(c.p) }
    for (const n of ACCEPTORS_21) { expect(m[n]).toBe('受體(3 價,P 型)'); const c = dc(1.5e10, 1e15, false); expect(c.p).toBeGreaterThan(c.n) }
    expect(DONORS_21).toEqual(['磷', '砷', '銻'])
    expect(ACCEPTORS_21).toEqual(['鋁', '鎵', '銦'])
  })
  it('材料偵探 L2:多數載子', () => {
    const m = mapOf(cls('g21-material', 1))
    expect(m['摻磷的矽']).toBe('自由電子'); expect(m['摻鎵的矽']).toBe('電洞'); expect(m['N 型半導體']).toBe('自由電子'); expect(m['P 型半導體']).toBe('電洞')
  })
  it('材料偵探 L3:數值由核心重算', () => {
    const p = lv('g21-material', 2).flatMap((it) => (it.kind === 'calc' ? [it.part] : []))
    expect(p).toHaveLength(5)
    expect(p[0].value).toBeCloseTo(5e13, -3)
    expect(p[1].value).toBeCloseTo(4.5e6, -2)
    expect(p[2].value).toBeCloseTo(5e12, -2)
    expect(p[3].value).toBe(1.6e-19)
    expect(p[4].value).toBeCloseTo(1.12 * 1.6e-19, 25)
    expect(MAT[0].egEv).toBe(1.12)
    const photon = lv('g21-material', 2)[5]
    if (photon.kind !== 'choice') throw new Error()
    expect(parseFloat(photon.options[photon.answer].text!)).toBeGreaterThanOrEqual(1.12)
    for (const o of photon.options.filter((_, i) => i !== photon.answer)) expect(parseFloat(o.text!)).toBeLessThan(1.12)
  })
})

describe('2-2 遊戲(對照核心與求解器)', () => {
  it('二極體探險 L3:導通/截止判斷與求解器一致', () => {
    const P = { vGamma: 0.7, rd: 25, is: 5.1e-15, nvt: 0.025 }
    expect(ss('ideal', 5, 1000, P).i).toBeGreaterThan(0) // +5 V 接陽極 → 導通
    expect(ss('ideal', -5, 1000, P).i).toBe(0) // 反接 → 截止
    const s = mc07Solve(12, 3, 2, 1, 1)
    expect([s.on.D1, s.on.D2]).toEqual([true, false])
    const c = choices('g22-basics', 2)
    expect(c.map((x) => x.options[x.answer].text)).toEqual(['導通', '截止', 'D1(接 12 V)', '0', '0 V'])
  })
  it('偏壓與溫度:效果方向與公式一致', () => {
    expect(fdt(0.65, 25, 65)).toBeLessThan(0.65) // 溫度升高,壓降下降
    expect(ni(MAT[0], 350)).toBeGreaterThan(ni(MAT[0], 300)) // ni 上升
    const t = mapOf(cls('g22-effects', 2))
    expect(t).toMatchObject({ 矽二極體的順向壓降: '變小(下降)', 逆向漏電流: '變大(上升)', 障壁電壓: '變小(下降)', '本質載子濃度 ni': '變大(上升)' })
    const b = mapOf(cls('g22-effects', 0))
    expect(b['空乏區變窄']).toBe('順向偏壓'); expect(b['空乏區變寬']).toBe('逆向偏壓'); expect(b['P 端接電源正端']).toBe('順向偏壓')
  })
  it('小算盤:動態電阻、靜態電阻、溫度、串聯電路的數值', () => {
    expect(calcs('g22-calc', 0).map((p) => p.value)).toEqual([25, 12.5, 5, 2.5, 50].map((x) => dynR(x === 25 ? 1e-3 : x === 12.5 ? 2e-3 : x === 5 ? 5e-3 : x === 2.5 ? 10e-3 : 0.5e-3)))
    expect(calcs('g22-calc', 0).map((p) => Math.round(p.value * 10) / 10)).toEqual([25, 12.5, 5, 2.5, 50])
    const p2 = calcs('g22-calc', 1)
    expect(Math.round(p2[0].value)).toBe(650)
    expect(p2.slice(1).map((p) => Math.round(p.value * 100) / 100)).toEqual([0.6, 0.55, 0.5, 0.7])
    const p3 = calcs('g22-calc', 2)
    const want = [0.0043, 0.004, 0.00465, 3, 0]
    p3.forEach((p, i) => expect(p.value).toBeCloseTo(want[i], 4))
  })
})
