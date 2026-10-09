import { useState } from 'react'
import { Link } from 'react-router-dom'
import { knowledgePoints } from '../data/knowledgePoints'
import { useQuestions } from '../data/bank'
import { useWrongBook } from '../wrongbook'
import { clearAttempts, useAttempts } from '../store'
import { errorCounts, isDue, kpStats } from '../core/progress'
import MasteryBadge from '../components/MasteryBadge'
import { ERROR_LABEL } from '../errors'

export default function Progress() {
  const attempts = useAttempts()
  const questions = useQuestions()
  const [now] = useState(() => Date.now())
  const qAttempts = attempts.filter((a) => a.source === 'question')
  const firsts = qAttempts.filter((a) => a.kind === 'firstIndependent')
  const firstRate = firsts.length ? Math.round((firsts.filter((a) => a.correct).length / firsts.length) * 100) : null
  const tried = questions.filter((q) => qAttempts.some((a) => a.itemId === q.id)).length
  const wrong = useWrongBook()
  const due = questions.filter((q) => isDue(attempts.filter((a) => a.itemId === q.id), now))
  const errs = Object.entries(errorCounts(attempts)).sort((a, b) => b[1] - a[1])
  const weakKps = knowledgePoints
    .map((k) => kpStats(k.id, attempts))
    .filter((s) => s.mastery === 'attempted' || s.mastery === 'everCorrect')

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">我的學習紀錄</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="習作題覆蓋" value={`${tried} / ${questions.length}`} />
        <Stat label="首次獨立答對率" value={firstRate === null ? '—' : `${firstRate}%`} note={`${firsts.length} 次首次作答`} />
        <Link to="/wrongbook" className="block"><Stat label="待加強題目(點我練習)" value={String(wrong.length)} /></Link>
        <Stat label="該複習了" value={String(due.length)} />
      </div>
      <p className="text-sm text-navy-800/80">
        「曾經答對」與「不依賴提示就答對」分開計算:用了提示或看過解析後的答對,不會被算成已經學會。
      </p>

      <section>
        <h2 className="font-bold mb-2">還沒穩的觀念</h2>
        {weakKps.length === 0 ? <p className="text-sm text-slate-600">目前沒有。先去練習幾題吧。</p> : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {weakKps.map((s) => {
              const k = knowledgePoints.find((x) => x.id === s.kp)!
              return <li key={s.kp} className="card flex items-center justify-between gap-2"><span>{k.title}</span><MasteryBadge m={s.mastery} /></li>
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-bold mb-2">常見錯誤類型</h2>
        {errs.length === 0 ? <p className="text-sm text-slate-600">還沒有錯誤紀錄。</p> : (
          <ul className="space-y-1">
            {errs.map(([k, n]) => <li key={k} className="card py-2 flex justify-between"><span>{ERROR_LABEL[k] ?? k}</span><b>{n} 次</b></li>)}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-bold mb-2">待複習題目</h2>
        {due.length === 0 ? <p className="text-sm text-slate-600">目前沒有到期的複習。</p> : (
          <ul className="grid gap-2">
            {due.map((q) => <li key={q.id}><Link className="card block hover:border-teal-500" to={`/practice/${q.id}?review=1`}>{q.source.label}:{q.stem.slice(0, 40)}…</Link></li>)}
          </ul>
        )}
      </section>

      <section className="text-sm text-slate-600">
        <p>紀錄只存在這台裝置的瀏覽器裡。換手機或清除瀏覽器資料就會消失。</p>
        <button className="btn btn-ghost mt-2" onClick={() => { if (confirm('確定要清除這台裝置上的所有學習紀錄?')) clearAttempts() }}>清除我的紀錄</button>
      </section>
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="card text-center">
      <div className="text-2xl font-bold text-navy-800">{value}</div>
      <div className="text-sm">{label}</div>
      {note && <div className="text-xs text-slate-500">{note}</div>}
    </div>
  )
}
