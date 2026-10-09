import { useMemo, useState, type ReactNode } from 'react'
import Formula from '../components/Formula'
import VisualView from './VisualView'
import { judgeNumeric } from '../core/answer'
import type { CalcItem, ChoiceItem, ClassifyItem, MatchItem, PuzzleItem, Visual } from './types'

/** 提示等級:0 無、1 概念提示、2 看解釋(之後作答不算獨立) */
export type HintLevel = 0 | 1 | 2
export type Rec = (key: string, kp: string, can: string, correct: boolean, level: HintLevel) => void

/** 固定規則的洗牌(不使用隨機):以與 n 互質的步長重排,保證不等於原順序 */
export function scramble(n: number): number[] {
  if (n < 2) return [0]
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
  let s = 2
  while (gcd(s, n) !== 1) s++
  const p = Array.from({ length: n }, (_, i) => (i * s + 1) % n)
  return p
}

const vis = (v?: Visual) => (v ? <div className="mx-auto max-w-sm"><VisualView v={v} /></div> : null)

function HintBox({ level, hint, explain, onHint }: { level: HintLevel; hint: string; explain: string; onHint: () => void }) {
  return (
    <div className="mt-3 space-y-2">
      {level >= 1 && <p className="rounded-xl bg-mist px-3 py-2 text-sm"><b>提示:</b>{hint}</p>}
      {level >= 2 && <p className="rounded-xl bg-sun-100 px-3 py-2 text-sm"><b>解釋:</b>{explain}</p>}
      {level < 2 && <button className="btn btn-ghost text-sm" onClick={onHint}>{level === 0 ? '給我提示' : '還是不確定,看解釋'}</button>}
    </div>
  )
}

const Next = ({ onClick, children = '下一題' }: { onClick: () => void; children?: ReactNode }) => (
  <button className="btn btn-primary w-full mt-3" onClick={onClick}>{children}</button>
)

const Good = ({ explain }: { explain: string }) => (
  <p role="status" className="mt-3 rounded-xl bg-teal-100 px-3 py-2 text-sm"><b>答對了!</b>{explain}</p>
)

/* ── 選擇題(符號/圖像辨識、讀圖) ── */
export function ChoiceView({ item, id, rec, onDone }: { item: ChoiceItem; id: string; rec: Rec; onDone: () => void }) {
  const [level, setLevel] = useState<HintLevel>(0)
  const [wrong, setWrong] = useState<number[]>([])
  const [ok, setOk] = useState(false)
  const pick = (i: number) => {
    if (ok || wrong.includes(i)) return
    const c = i === item.answer
    rec(id, item.kp, item.can, c, level)
    if (c) setOk(true); else setWrong([...wrong, i])
  }
  const hasVis = item.options.some((o) => o.visual)
  return (
    <div>
      <p className="text-lg">{item.prompt}</p>
      {vis(item.visual)}
      <div className={`mt-3 grid gap-2 ${hasVis ? 'grid-cols-2' : 'sm:grid-cols-2'}`}>
        {item.options.map((o, i) => (
          <button key={i} disabled={ok && i !== item.answer} onClick={() => pick(i)} aria-label={o.text ?? `選項 ${i + 1}`}
            className={`rounded-2xl border-2 p-2 text-left min-h-11 ${ok && i === item.answer ? 'border-teal-500 bg-teal-100' : wrong.includes(i) ? 'border-coral-500 bg-red-50 opacity-70' : 'border-navy-800/40 bg-white'}`}>
            {o.visual && <VisualView v={o.visual} />}
            {o.text && <span className="block px-1 py-1">{o.text}</span>}
          </button>
        ))}
      </div>
      {wrong.length > 0 && !ok && <p role="status" className="mt-2 text-sm">差一點點,再試試看(不會扣分)。</p>}
      {!ok && <HintBox level={level} hint={item.hint} explain={item.explain} onHint={() => setLevel((level + 1) as HintLevel)} />}
      {ok && <><Good explain={item.explain} /><Next onClick={onDone} /></>}
    </div>
  )
}

/* ── 簡單計算 ── */
export function CalcView({ item, id, rec, onDone }: { item: CalcItem; id: string; rec: Rec; onDone: () => void }) {
  const [level, setLevel] = useState<HintLevel>(0)
  const [val, setVal] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const submit = () => {
    const r = judgeNumeric(val, item.part)
    rec(id, item.kp, item.can, r.ok, level)
    if (r.ok) { setOk(true); setMsg(null) }
    else setMsg(r.reason === 'missingUnit' || r.reason === 'wrongUnit' ? '單位有問題(漏寫或不對),再檢查一次。' : r.reason === 'unparsable' ? '請寫成像 20 kHz 或 5.66 V 的樣子。' : '數值還不對,再算一次或看提示。')
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!ok && val.trim()) submit() }}>
      <p className="text-lg">{item.prompt}</p>
      {vis(item.visual)}
      <label className="mt-3 block">
        <span className="text-sm">{item.part.label}{item.part.unit ? '(請連同單位寫)' : ''}</span>
        <input autoComplete="off" disabled={ok} value={val} onChange={(e) => setVal(e.target.value)} className="block w-full rounded-xl border-2 border-navy-800/40 px-3 py-2 min-h-11" />
      </label>
      {!ok && <button className="btn btn-primary mt-2" disabled={!val.trim()}>確認</button>}
      {msg && <p role="status" className="mt-2 text-sm">{msg}</p>}
      {!ok && <HintBox level={level} hint={item.hint} explain={item.explain} onHint={() => setLevel((level + 1) as HintLevel)} />}
      {ok && <><Good explain={item.explain} /><Next onClick={onDone} /></>}
    </form>
  )
}

/* ── 公式拼圖(點選依序放入) ── */
export function PuzzleView({ item, id, rec, onDone }: { item: PuzzleItem; id: string; rec: Rec; onDone: () => void }) {
  const order = useMemo(() => scramble(item.tokens.length), [item.tokens.length])
  const pool = order.map((o) => item.tokens[o])
  const [placed, setPlaced] = useState<number[]>([])
  const [level, setLevel] = useState<HintLevel>(0)
  const [badPos, setBadPos] = useState<number[]>([])
  const [ok, setOk] = useState(false)
  const tex = (s: string) => <Formula tex={s} />
  const check = () => {
    const seq = placed.map((p) => pool[p])
    const wrongPos = seq.map((t, i) => (t === item.tokens[i] ? -1 : i)).filter((i) => i >= 0)
    const c = wrongPos.length === 0 && seq.length === item.tokens.length
    rec(id, item.kp, item.can, c, level)
    if (c) setOk(true); else setBadPos(wrongPos)
  }
  return (
    <div>
      <p className="text-lg">{item.prompt}</p>
      <div className="mt-3 flex min-h-14 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-navy-800/50 bg-white p-2" aria-label="你拼的公式">
        {placed.length === 0 && <span className="text-sm text-slate-500">點下面的方塊,依序放進來</span>}
        {placed.map((p, i) => (
          <button key={i} disabled={ok} onClick={() => { setPlaced(placed.filter((_, k) => k !== i)); setBadPos([]) }}
            className={`rounded-xl border-2 px-3 py-1 min-h-11 ${badPos.includes(i) ? 'border-coral-500 bg-red-50' : 'border-teal-600 bg-sun-100'}`} aria-label={`已放入第 ${i + 1} 個,點一下取回`}>{tex(pool[p])}</button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="可用的方塊">
        {pool.map((t, p) => (
          <button key={p} disabled={placed.includes(p) || ok} onClick={() => { setPlaced([...placed, p]); setBadPos([]) }}
            className="rounded-xl border-2 border-navy-800/50 bg-white px-3 py-1 min-h-11 disabled:opacity-30">{tex(t)}</button>
        ))}
      </div>
      {!ok && (
        <div className="mt-3 flex gap-2">
          <button className="btn btn-primary" disabled={placed.length !== item.tokens.length} onClick={check}>檢查</button>
          <button className="btn btn-ghost" onClick={() => { setPlaced([]); setBadPos([]) }}>全部清除</button>
        </div>
      )}
      {badPos.length > 0 && !ok && <p role="status" className="mt-2 text-sm">紅框的位置不太對,點一下取回再換換看。</p>}
      {!ok && <HintBox level={level} hint={item.hint} explain={item.explain} onHint={() => setLevel((level + 1) as HintLevel)} />}
      {ok && <><Good explain={item.explain} /><Next onClick={onDone} /></>}
    </div>
  )
}

/* ── 配對 ── */
export function MatchView({ item, id, rec, onDone }: { item: MatchItem; id: string; rec: Rec; onDone: () => void }) {
  const n = item.pairs.length
  const order = useMemo(() => scramble(n), [n])
  const [sel, setSel] = useState<number | null>(null)
  const [solved, setSolved] = useState<number[]>([])
  const [level, setLevel] = useState<HintLevel>(0)
  const [msg, setMsg] = useState<string | null>(null)
  const done = solved.length === n
  const cell = (text: string, tex?: boolean) => (tex ? <Formula tex={text} /> : <span>{text}</span>)
  const tapRight = (pairIdx: number) => {
    if (sel === null) { setMsg('先點左邊一個,再點右邊的配對。'); return }
    const c = pairIdx === sel
    const p = item.pairs[sel]
    rec(`${id}:${sel}`, p.kp, p.can, c, level)
    if (c) { setSolved([...solved, sel]); setSel(null); setMsg(null) } else setMsg('這兩個不是一對,再想想看。')
  }
  return (
    <div>
      <p className="text-lg">{item.prompt}</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="grid gap-2" aria-label="左邊">
          {item.pairs.map((p, i) => (
            <button key={i} disabled={solved.includes(i)} aria-pressed={sel === i} onClick={() => { setSel(i); setMsg(null) }}
              className={`rounded-2xl border-2 px-2 py-2 min-h-11 text-left ${solved.includes(i) ? 'border-teal-500 bg-teal-100' : sel === i ? 'border-teal-600 bg-sun-100 font-bold' : 'border-navy-800/40 bg-white'}`}>{cell(p.left, p.leftTex)}</button>
          ))}
        </div>
        <div className="grid gap-2" aria-label="右邊">
          {order.map((pi) => (
            <button key={pi} disabled={solved.includes(pi)} onClick={() => tapRight(pi)}
              className={`rounded-2xl border-2 px-2 py-2 min-h-11 text-left ${solved.includes(pi) ? 'border-teal-500 bg-teal-100' : 'border-navy-800/40 bg-white'}`}>{cell(item.pairs[pi].right, item.pairs[pi].rightTex)}</button>
          ))}
        </div>
      </div>
      {msg && <p role="status" className="mt-2 text-sm">{msg}</p>}
      {!done && <HintBox level={level} hint={item.hint} explain={item.explain} onHint={() => setLevel((level + 1) as HintLevel)} />}
      {done && <><Good explain={item.explain} /><Next onClick={onDone} /></>}
    </div>
  )
}

/* ── 分類 ── */
export function ClassifyView({ item, id, rec, onDone }: { item: ClassifyItem; id: string; rec: Rec; onDone: () => void }) {
  const [i, setI] = useState(0)
  const [level, setLevel] = useState<HintLevel>(0)
  const [wrong, setWrong] = useState<number[]>([])
  const done = i >= item.things.length
  if (done) return <><Good explain={item.explain} /><Next onClick={onDone} /></>
  const t = item.things[i]
  const pick = (b: number) => {
    const c = b === t.bucket
    rec(`${id}:${i}`, t.kp, t.can, c, level)
    if (c) { setI(i + 1); setWrong([]) } else setWrong([...wrong, b])
  }
  return (
    <div>
      <p className="text-lg">{item.prompt}</p>
      <p className="text-sm text-slate-600">第 {i + 1} / {item.things.length} 個</p>
      <div className="mt-2 rounded-2xl border-2 border-navy-800/40 bg-white p-3">
        {vis(t.visual)}
        {t.text && <p className="text-center text-lg font-bold">{t.text}</p>}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {item.buckets.map((b, k) => (
          <button key={k} disabled={wrong.includes(k)} onClick={() => pick(k)}
            className={`btn ${wrong.includes(k) ? 'btn-ghost opacity-50' : 'btn-sun'}`}>{b}</button>
        ))}
      </div>
      {wrong.length > 0 && <p role="status" className="mt-2 text-sm">差一點點,換一個分類試試。</p>}
      <HintBox level={level} hint={item.hint} explain={item.explain} onHint={() => setLevel(Math.min(2, level + 1) as HintLevel)} />
    </div>
  )
}
