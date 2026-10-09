import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getQuestion, getQuestions, useQuestions } from '../data/bank'
import type { McQuestion, NumericQuestion, OpenQuestion, Question } from '../data/types'
import { addAttempt, tagLastAttempt, useAttempts } from '../store'
import { fx } from '../feedback'
import { type Attempt, type AttemptKind, REVIEW_COOLDOWN_MS, isDue, itemMastery } from '../core/progress'
import { computeWrong } from '../wrongbook'
import { judgeNumeric } from '../core/answer'
import { hintsFor } from '../hints'
import MasteryBadge from '../components/MasteryBadge'
import { ERROR_LABEL } from '../errors'
import { FIGURES } from '../figures'
import ModeTabs from '../components/ModeTabs'
import { sourceLine } from '../sources'

const DAY = 86_400_000
const REVIEW_LABEL: Record<string, string> = { pending: '待檢查', calcVerified: '我方計算已驗證', teacherChecked: '教師已檢查', needsFix: '需要修正', published: '已正式發布' }
const REASONS = ['concept', 'formulaChoice', 'substitution', 'arithmetic', 'unit', 'comprehension'] as const
const REASON_TEXT: Record<(typeof REASONS)[number], string> = {
  concept: '我不太懂這個觀念',
  formulaChoice: '我不知道該用哪個公式',
  substitution: '我知道公式,但不確定怎麼代入',
  arithmetic: '我算的過程出錯',
  unit: '單位換算讓我卡住',
  comprehension: '我沒看懂題目在問什麼',
}

/** 下一題:先到期複習 → 沒練過 → 還不穩的 → 其餘 */
function pickNext(attempts: Attempt[], exclude?: string) {
  const now = Date.now()
  const rank = (q: Question) => {
    const a = attempts.filter((x) => x.itemId === q.id)
    if (isDue(a, now)) return 0
    const m = itemMastery(a)
    return m === 'unseen' ? 1 : m === 'attempted' || m === 'everCorrect' ? 2 : 3
  }
  return getQuestions().filter((q) => q.id !== exclude).sort((a, b) => rank(a) - rank(b))[0]
}

export default function Practice() {
  const { qid } = useParams()
  const attempts = useAttempts()
  useQuestions() // 老師修訂後即時更新
  if (!qid) {
    const next = pickNext(attempts)
    return <Navigate to={`/practice/${next.id}`} replace />
  }
  const q = getQuestion(qid)
  if (!q) return <p>找不到這題。<Link className="underline" to="/practice">回練習</Link></p>
  return <Runner key={q.id} q={q} />
}

function Runner({ q }: { q: Question }) {
  const attempts = useAttempts()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [hintLevel, setHintLevel] = useState(0)
  const [solutionShown, setSolutionShown] = useState(false)
  const [tries, setTries] = useState(0)
  const [correct, setCorrect] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [askWhy, setAskWhy] = useState(false)
  const hints = useMemo(() => hintsFor(q), [q])
  const prior = attempts.filter((a) => a.itemId === q.id)

  const kindNow = (): AttemptKind => {
    if (solutionShown) return 'afterSolution'
    if (hintLevel > 0 || tries > 0) return 'hinted'
    if (prior.length === 0) return 'firstIndependent'
    const last = Math.max(...prior.map((a) => a.at))
    const gap = Date.now() - last
    return gap >= DAY || (params.get('review') && gap >= REVIEW_COOLDOWN_MS) ? 'delayedReview' : 'hinted'
  }

  const record = (ok: boolean, errorType?: string, kind: AttemptKind = kindNow()) => {
    addAttempt({ itemId: q.id, source: 'question', kps: q.kps, correct: ok, kind, at: Date.now(), errorType })
    setTries((t) => t + 1)
    if (ok) { setCorrect(true); setSolutionShown(true); fx.correct(kind === 'firstIndependent' || kind === 'delayedReview') } else fx.wrong()
  }

  const wrong = (msg: string, errorType?: string) => {
    setFeedback(tries === 0 ? `${msg} 這題已自動放進你的「錯題本」,不用自己收藏。` : msg)
    record(false, errorType)
    setAskWhy(!errorType)
  }

  const wb = params.get('wb') === '1'
  const next = () => {
    if (wb) {
      const rest = computeWrong(attempts, getQuestions()).filter((w) => w.itemId !== q.id)
      nav(rest.length ? `/practice/${rest[0].itemId}?review=1&wb=1` : '/wrongbook?done=1')
      return
    }
    nav(`/practice/${pickNext(attempts, q.id).id}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Link to={`/unit/${q.unit}`} className="inline-block rounded-full bg-white border-2 border-navy-800 px-3 py-1 text-sm font-bold text-navy-800">← {q.unit} 單元</Link>
        <MasteryBadge m={itemMastery(prior)} />
      </div>
      <ModeTabs qid={q.id} mode="c" hasCoach={!!q.coach} />
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <section className="card md:sticky md:top-4" aria-label="題目">
          <p className="text-xs text-slate-600">出處:{sourceLine(q)} · {q.id}</p>
          <p className="mt-2 text-lg leading-8">{q.stem}</p>
          {q.figure && (FIGURES[q.figure] ? (
            <div className="mt-3 space-y-1">
              {FIGURES[q.figure]()}
              {q.figureNote && <p className="text-xs text-slate-600">{q.figureNote}</p>}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-navy-800/30 bg-mist p-3 text-sm">
              <b>圖:</b>{q.figureNote ?? ''}
              <p className="text-xs text-slate-600 mt-1">原圖請對照習作第 {q.source.page} 頁(平台版重繪製作中)。</p>
            </div>
          ))}
          {q.type === 'mc' && <McView q={q} disabled={correct} onSubmit={(i) => {
            const ok = i === q.answer
            if (ok) { record(true); setFeedback('答對了!做得好 🎉') }
            else wrong('差一點點!先不用急著看解析,打開提示再想一想,你可以的。', q.options[i].errorType)
          }} />}
          {q.type === 'numeric' && <NumView q={q} disabled={correct} onSubmit={(vals) => {
            const rs = q.parts.map((p, i) => judgeNumeric(vals[i] ?? '', p))
            if (rs.every((r) => r.ok)) { record(true); setFeedback('全部答對!很棒 🎉'); return }
            const unitProblem = rs.some((r) => !r.ok && (r.reason === 'missingUnit' || r.reason === 'wrongUnit'))
            const bad = rs.map((r, i) => (r.ok ? null : q.parts[i].label)).filter(Boolean).join('、')
            wrong(unitProblem ? `「${bad}」的單位有問題(漏寫或單位不對),再檢查一次。` : `「${bad}」的數值還不對,可以打開提示。`, unitProblem ? 'unit' : undefined)
          }} />}
          {q.type === 'open' && <OpenView q={q} onDone={(ok) => { record(ok, undefined, 'afterSolution'); setFeedback(ok ? '做得好!' : '再對照一次參考答案,下次再試。') }} />}
        </section>

        <section className="space-y-3" aria-label="解題引導">
          {feedback && <div role="status" className={`card ${correct ? 'border-teal-500 bg-teal-100' : 'border-sun-400 bg-sun-100'}`}>{feedback}</div>}
          {askWhy && !correct && (
            <div className="card">
              <p className="font-medium">卡住很正常。你覺得是哪裡卡住了?(選一個,我幫你找對應的補強)</p>
              <div className="mt-2 grid gap-2">
                {REASONS.map((r) => (
                  <button key={r} className="btn btn-ghost text-left" onClick={() => { tagLastAttempt(r); setAskWhy(false) }}>{REASON_TEXT[r]}</button>
                ))}
                <button className="btn btn-ghost text-left" onClick={() => { tagLastAttempt('unknown'); setAskWhy(false) }}>不確定</button>
              </div>
            </div>
          )}
          {!correct && (
            <div className="card">
              <p className="font-medium">需要提示嗎?</p>
              {hints.slice(0, hintLevel).map((h, i) => <p key={i} className="mt-2 text-sm"><b>提示 {i + 1}:</b>{h}</p>)}
              {hintLevel < 3 && (
                <button className="btn btn-ghost mt-2" onClick={() => setHintLevel(hintLevel + 1)}>
                  {hintLevel === 0 ? '給我提示 1' : `再多一點(提示 ${hintLevel + 1})`}
                </button>
              )}
              <p className="text-xs text-slate-500 mt-2">用了提示後答對,會記為「使用提示後作答」。</p>
            </div>
          )}
          {!solutionShown && (
            <button className="btn btn-ghost w-full" onClick={() => { if (confirm('看完整解析後再答對,不會被算成能獨立答對。確定要看嗎?')) setSolutionShown(true) }}>看完整解析</button>
          )}
          {solutionShown && (
            <div className="card" aria-label="解析">
              <p className="font-bold">解析</p>
              {q.type === 'mc' && <p className="text-sm mt-1">正確答案:({'ABCD'[(q as McQuestion).answer]}) {(q as McQuestion).options[(q as McQuestion).answer].text}</p>}
              <p className="mt-1 text-sm whitespace-pre-line">{q.solution}</p>
              {q.solutionAuthoredByUs && <p className="mt-2 text-xs text-slate-500">這題的解析由本平台補寫,尚未經專業教師審核。</p>}
              {q.teacherVersion ? <p className="mt-1 text-xs text-slate-600">這題的內容經老師修訂(版本 {q.teacherVersion})。</p> : null}
              {q.review === 'needsFix' && <p className="mt-1 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-800">老師標示這題的內容需要修正,解析可能有誤,請以老師講解為準。</p>}
              <p className="mt-1 text-xs text-slate-500">審核狀態:{REVIEW_LABEL[q.review]}</p>
            </div>
          )}
          <button className="btn btn-primary w-full" onClick={next}>下一題</button>
          <p className="text-xs text-slate-500">錯誤類型對照:{Object.values(ERROR_LABEL).slice(0, 4).join('、')}…</p>
        </section>
      </div>
    </div>
  )
}

function McView({ q, onSubmit, disabled }: { q: McQuestion; onSubmit: (i: number) => void; disabled: boolean }) {
  const [sel, setSel] = useState<number | null>(null)
  return (
    <fieldset className="mt-3" disabled={disabled}>
      <legend className="sr-only">選項</legend>
      <div className="grid gap-2">
        {q.options.map((o, i) => (
          <label key={i} className={`flex gap-2 items-start rounded-lg border p-3 min-h-11 ${sel === i ? 'border-teal-500 bg-teal-100' : 'border-navy-800/20 bg-white'}`}>
            <input type="radio" name={q.id} checked={sel === i} onChange={() => setSel(i)} className="mt-1.5" />
            <span>({'ABCD'[i]}) {o.text}</span>
          </label>
        ))}
      </div>
      <button type="button" className="btn btn-primary mt-3" disabled={sel === null || disabled} onClick={() => sel !== null && onSubmit(sel)}>送出答案</button>
    </fieldset>
  )
}

function NumView({ q, onSubmit, disabled }: { q: NumericQuestion; onSubmit: (v: string[]) => void; disabled: boolean }) {
  const [vals, setVals] = useState<string[]>(q.parts.map(() => ''))
  return (
    <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); onSubmit(vals) }}>
      {q.parts.map((p, i) => (
        <label key={i} className="block">
          <span className="text-sm">{p.label}{p.unit ? '(請連同單位寫,例如 20 mA)' : '(沒有單位)'}</span>
          <input inputMode="text" autoComplete="off" disabled={disabled} className="block w-full rounded-lg border border-navy-800/30 px-3 py-2 min-h-11"
            value={vals[i]} onChange={(e) => setVals(vals.map((v, j) => (j === i ? e.target.value : v)))} />
        </label>
      ))}
      <button className="btn btn-primary" disabled={disabled}>送出答案</button>
    </form>
  )
}

function OpenView({ q, onDone }: { q: OpenQuestion; onDone: (ok: boolean) => void }) {
  const [text, setText] = useState('')
  const [reveal, setReveal] = useState(false)
  const [checks, setChecks] = useState<boolean[]>(q.checklist.map(() => false))
  const [done, setDone] = useState(false)
  return (
    <div className="mt-3 space-y-2">
      <label className="block">
        <span className="text-sm">先寫下你的答案(可寫在紙上):</span>
        <textarea className="block w-full rounded-lg border border-navy-800/30 px-3 py-2 min-h-24" value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      {!reveal && <button className="btn btn-primary" onClick={() => setReveal(true)}>對照參考答案</button>}
      {reveal && (
        <div className="space-y-2">
          <p className="text-sm"><b>參考答案:</b>{q.modelAnswer}</p>
          <p className="text-sm">自我檢查(誠實勾選):</p>
          {q.checklist.map((c, i) => (
            <label key={i} className="flex gap-2 items-start text-sm">
              <input type="checkbox" checked={checks[i]} onChange={() => setChecks(checks.map((v, j) => (j === i ? !v : v)))} className="mt-1.5" />{c}
            </label>
          ))}
          <button className="btn btn-primary" disabled={done} onClick={() => { setDone(true); onDone(checks.every(Boolean)) }}>完成自評</button>
          <p className="text-xs text-slate-500">看過參考答案後的自評,不會被算成「獨立答對」。</p>
        </div>
      )}
    </div>
  )
}
