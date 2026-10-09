import { Link, useSearchParams } from 'react-router-dom'
import { WRONG_REASON_LABEL } from '../core/progress'
import { useQuestions } from '../data/bank'
import { ERROR_LABEL } from '../errors'
import { units } from '../units'
import { useWrongBook } from '../wrongbook'

const REASON_STYLE = { never: 'bg-red-100 text-red-800', relapse: 'bg-amber-100 text-amber-900', hintOnly: 'bg-sky-100 text-navy-800' } as const

export default function WrongBook() {
  const wrong = useWrongBook()
  const qs = useQuestions()
  const [params] = useSearchParams()
  const first = wrong[0]
  return (
    <div className="space-y-4">
      <h1 className="inline-block rounded-2xl bg-white/90 px-3 text-2xl font-extrabold text-navy-900">我的錯題本</h1>
      <p className="rounded-2xl bg-white/90 p-3 text-sm">
        不用自己收藏!系統會<b>自動</b>把你答錯的題目收在這裡。只要之後<b>獨立答對一次</b>(不用提示、不看解析),它就會自動移出去。
      </p>
      {params.get('done') && wrong.length === 0 && <p role="status" className="card border-teal-500 bg-teal-100 font-bold">🎉 錯題都練完了!太棒了。</p>}
      {params.get('done') && wrong.length > 0 && <p role="status" className="card bg-sun-100">這一輪練完了,還有 {wrong.length} 題剛答完需要隔一下再練,或還沒獨立答對。休息一下再來吧。</p>}
      {wrong.length === 0 ? (
        <div className="card space-y-2">
          <p className="font-bold">目前沒有錯題。</p>
          <p className="text-sm">答錯的題目會自動出現在這裡。去做幾題習作吧!</p>
          <Link to="/practice" className="btn btn-sun inline-block">去練習</Link>
        </div>
      ) : (
        <>
          <div className="card flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg"><b className="text-3xl text-coral-500">{wrong.length}</b> 題待練習</p>
            <Link to={`/practice/${first.itemId}?review=1&wb=1`} className="btn btn-sun text-lg">開始練習我的錯題</Link>
          </div>
          {units.map((u) => {
            const items = wrong.filter((w) => qs.find((q) => q.id === w.itemId)?.unit === u.id)
            if (items.length === 0) return null
            return (
              <section key={u.id} className="space-y-2">
                <h2 className="inline-block rounded-xl bg-white/90 px-3 font-bold"><span className="mr-2 rounded-lg bg-grape-500 px-2 text-white">{u.id}</span>{u.title}</h2>
                <ul className="grid gap-2">
                  {items.map((w) => {
                    const q = qs.find((x) => x.id === w.itemId)!
                    return (
                      <li key={w.itemId}>
                        <Link to={`/practice/${w.itemId}?review=1&wb=1`} className="card block hover:border-teal-500">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold">{q.source.label}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs ${REASON_STYLE[w.reason]}`}>{WRONG_REASON_LABEL[w.reason]}</span>
                            {w.errorType && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">卡關:{ERROR_LABEL[w.errorType] ?? w.errorType}</span>}
                            <span className="text-xs text-slate-500">答錯 {w.wrongCount} 次</span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm">{q.stem}</p>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
          <p className="text-xs text-slate-600">剛答完的題目,要隔 10 分鐘才會算「獨立答對」(避免剛看完答案馬上重答就算會了)。</p>
        </>
      )}
    </div>
  )
}
