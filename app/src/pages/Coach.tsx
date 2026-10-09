import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getQuestion, useQuestions } from '../data/bank'
import type { CoachStep, Question } from '../data/types'
import { addAttempt, useAttempts } from '../store'
import { fx } from '../feedback'
import { judgeNumeric } from '../core/answer'
import Formula from '../components/Formula'
import ModeTabs from '../components/ModeTabs'
import { sourceLine } from '../sources'
import { FIGURES } from '../figures'

const STEP_NAMES = ['讀懂題目', '分析', '選擇原理', '建立算式', '逐步運算', '驗證結果', '遷移練習']

export default function Coach() {
  useQuestions()
  const { qid } = useParams()
  const [params] = useSearchParams()
  const q = qid ? getQuestion(qid) : undefined
  const mode = params.get('mode') === 'b' ? 'b' : 'a'
  if (!q || !q.coach) return <p>這題的教練模式還在製作中。<Link className="underline" to={q ? `/practice/${q.id}` : '/practice'}>去自己做</Link></p>
  return (
    <div className="space-y-4">
      <Link to={`/unit/${q.unit}`} className="inline-block rounded-full bg-white border-2 border-navy-800 px-3 py-1 text-sm font-bold text-navy-800">← {q.unit} 單元</Link>
      <ModeTabs qid={q.id} mode={mode} hasCoach />
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <section className="card md:sticky md:top-4" aria-label="題目">
          <p className="text-xs text-slate-600">出處:{sourceLine(q)} · {q.id}</p>
          <p className="mt-2 text-lg leading-8">{q.stem}</p>
          {q.figure && FIGURES[q.figure] && <div className="mt-3">{FIGURES[q.figure]()}</div>}
          {q.type === 'mc' && (
            <ul className="mt-3 grid gap-1 text-sm">
              {q.options.map((o, i) => <li key={i}>({'ABCD'[i]}) {o.text}</li>)}
            </ul>
          )}
        </section>
        <section className="space-y-3" aria-label="解題步驟">
          {mode === 'a' ? <ModeA key={q.id} q={q} steps={q.coach} /> : <ModeB key={q.id} q={q} steps={q.coach} />}
        </section>
      </div>
    </div>
  )
}

function StepHeader({ i, title }: { i: number; title: string }) {
  return (
    <h2 className="text-lg font-extrabold text-navy-900">
      <span className="mr-2 rounded-lg bg-grape-500 px-2 text-white">STEP {i + 1}</span>{title}
    </h2>
  )
}

function MathHelp({ step }: { step: CoachStep }) {
  if (!step.math?.length) return null
  return (
    <div className="space-y-1">
      {step.math.map((m, i) => (
        <details key={i} className="rounded-xl bg-mist px-3 py-2 text-sm">
          <summary className="cursor-pointer font-bold">數學小幫手:{m.title}</summary>
          {m.tex && <Formula block tex={m.tex} />}
          <p>{m.text}</p>
        </details>
      ))}
    </div>
  )
}

const Mistake = ({ text }: { text: string }) => (
  <p className="rounded-xl border-2 border-sun-400 bg-sun-100 px-3 py-2 text-sm"><b>常見錯誤:</b>{text}</p>
)

/* 模式 A:老師帶著做 — 完整示範,一步一步展開 */
function ModeA({ q, steps }: { q: Question; steps: CoachStep[] }) {
  const [shown, setShown] = useState(1)
  return (
    <>
      {steps.slice(0, shown).map((s, i) => (
        <article key={s.id} className="card space-y-2">
          <StepHeader i={i} title={s.title} />
          <p>{s.teach}</p>
          <div className="rounded-xl bg-teal-100 px-3 py-2 text-sm">
            <p><b>想一想:</b>{s.ask.prompt}</p>
            <p className="mt-1"><b>答案:</b>{s.ask.options[s.ask.answer]}</p>
            <p className="mt-1">{s.ask.why}</p>
          </div>
          <Mistake text={s.commonMistake} />
          <MathHelp step={s} />
        </article>
      ))}
      {shown < steps.length ? (
        <button className="btn btn-primary w-full" onClick={() => setShown(shown + 1)}>下一步:{STEP_NAMES[shown]}</button>
      ) : (
        <Transfer q={q} stepNo={7} />
      )}
    </>
  )
}

/* 模式 B:一起想一想 — 每一步由學生判斷;提示分三層;教練模式不計入獨立精熟 */
function ModeB({ q, steps }: { q: Question; steps: CoachStep[] }) {
  const [i, setI] = useState(0)
  if (i >= steps.length) return <Transfer q={q} stepNo={7} />
  return <BStep key={steps[i].id} q={q} step={steps[i]} i={i} onNext={() => setI(i + 1)} />
}

function BStep({ q, step, i, onNext }: { q: Question; step: CoachStep; i: number; onNext: () => void }) {
  const attempts = useAttempts()
  const [sel, setSel] = useState<number | null>(null)
  const [hints, setHints] = useState(0)
  const [state, setState] = useState<'idle' | 'wrong' | 'right'>('idle')
  const itemId = `${q.id}:${step.id}`
  const submit = () => {
    if (sel === null) return
    const ok = sel === step.ask.answer
    addAttempt({ itemId, source: 'lesson', kps: q.kps, correct: ok, kind: 'hinted', at: Date.now() })
    setState(ok ? 'right' : 'wrong')
    if (ok) fx.correct(false); else fx.wrong()
  }
  void attempts
  return (
    <article className="card space-y-2">
      <StepHeader i={i} title={step.title} />
      <p>{step.teach}</p>
      <fieldset className="space-y-2" disabled={state === 'right'}>
        <legend className="font-bold">想一想:{step.ask.prompt}</legend>
        {step.ask.options.map((o, k) => (
          <label key={k} className={`flex items-start gap-2 rounded-xl border-2 p-2 min-h-11 ${sel === k ? 'border-teal-600 bg-sun-100' : 'border-navy-800/30'}`}>
            <input type="radio" name={itemId} className="mt-1.5" checked={sel === k} onChange={() => { setSel(k); setState('idle') }} />
            <span>{o}</span>
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-primary" disabled={sel === null || state === 'right'} onClick={submit}>確認</button>
        {state === 'wrong' && <span role="status" className="text-sm">差一點點,看看提示再想想。</span>}
      </div>
      {state !== 'right' && (
        <div className="space-y-1">
          {step.hints.slice(0, hints).map((h, k) => <p key={k} className="rounded-xl bg-mist px-3 py-1 text-sm"><b>提示 {k + 1}:</b>{h}</p>)}
          {hints < 3 && <button className="btn btn-ghost text-sm" onClick={() => setHints(hints + 1)}>{hints === 0 ? '給我提示 1' : `再多一點(提示 ${hints + 1})`}</button>}
        </div>
      )}
      {state === 'right' && (
        <div className="space-y-2">
          <p role="status" className="rounded-xl bg-teal-100 px-3 py-2 text-sm"><b>答對了!</b>{step.ask.why}</p>
          <Mistake text={step.commonMistake} />
          <MathHelp step={step} />
          <button className="btn btn-primary w-full" onClick={onNext}>下一步:{STEP_NAMES[i + 1]}</button>
        </div>
      )}
    </article>
  )
}

/* STEP 7:遷移練習 — 同概念的變化題,數字由固定演算法產生,答案由計算核心算出 */
function Transfer({ q, stepNo }: { q: Question; stepNo: number }) {
  const attempts = useAttempts()
  const used = attempts.filter((a) => a.itemId.startsWith(`V:${q.id}:`)).map((a) => a.itemId)
  const [seed, setSeed] = useState(() => new Set(used).size)
  const [val, setVal] = useState('')
  const [sel, setSel] = useState<number | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [tries, setTries] = useState(0)
  if (!q.variant) return null
  const v = q.variant.make(seed)
  const itemId = `V:${q.id}:${seed}`
  const kind = tries === 0 ? 'firstIndependent' : 'hinted'
  const next = () => { setSeed(seed + 1); setVal(''); setSel(null); setMsg(null); setDone(false); setTries(0) }
  const checkNum = () => {
    if (!('part' in v)) return
    const r = judgeNumeric(val, v.part)
    const unitProblem = !r.ok && (r.reason === 'missingUnit' || r.reason === 'wrongUnit')
    addAttempt({ itemId, source: 'question', kps: q.kps, correct: r.ok, kind, at: Date.now(), errorType: unitProblem ? 'unit' : undefined })
    setTries(tries + 1)
    if (r.ok) { setDone(true); fx.complete(); setMsg('答對了!這題是新數字,你已經會自己做同一類的題目了 🎉'); return }
    fx.wrong()
    if (unitProblem) setMsg('單位有問題(漏寫或單位不對),再檢查一次。')
    else if (r.reason === 'unparsable') setMsg('看不懂你寫的數字,請寫成像 70.7 V 的樣子。')
    else setMsg('數值還不對。回到前面的步驟,對照看看是哪一步不一樣。')
  }
  const checkMc = () => {
    if (!('options' in v) || sel === null) return
    const ok = sel === v.answer
    addAttempt({ itemId, source: 'question', kps: q.kps, correct: ok, kind, at: Date.now() })
    setTries(tries + 1)
    if (ok) { setDone(true); fx.complete(); setMsg(`答對了!${v.why}`) } else { fx.wrong(); setMsg('還不是這個。回到前面的步驟,想想關鍵的判斷依據。') }
  }
  return (
    <article className="card space-y-2">
      <StepHeader i={stepNo - 1} title="遷移練習:換個題目,自己做" />
      <p>{v.stem}</p>
      {'part' in v ? (
        <label className="block">
          <span className="text-sm">{v.part.label}</span>
          <input autoComplete="off" disabled={done} className="block w-full rounded-lg border-2 border-navy-800/40 px-3 py-2 min-h-11" value={val} onChange={(e) => setVal(e.target.value)} />
        </label>
      ) : (
        <fieldset className="space-y-2" disabled={done}>
          <legend className="sr-only">選項</legend>
          {v.options.map((o, k) => (
            <label key={k} className={`flex items-start gap-2 rounded-xl border-2 p-2 min-h-11 ${sel === k ? 'border-teal-600 bg-sun-100' : 'border-navy-800/30'}`}>
              <input type="radio" name={itemId} className="mt-1.5" checked={sel === k} onChange={() => setSel(k)} /><span>{o}</span>
            </label>
          ))}
        </fieldset>
      )}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" disabled={done || ('part' in v ? val.trim() === '' : sel === null)} onClick={'part' in v ? checkNum : checkMc}>確認</button>
        {done && <button className="btn btn-sun" onClick={next}>再來一題</button>}
      </div>
      {msg && <p role="status" className="rounded-xl bg-sun-100 px-3 py-2 text-sm">{msg}</p>}
    </article>
  )
}
