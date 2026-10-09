import { useState } from 'react'
import type { Check } from '../lessons/checks12'
import { addAttempt, useAttempts } from '../store'
import { fx } from '../feedback'

/** 教學區塊的小檢核:答錯不給答案,可重試;第一次選擇才算「獨立作答」。 */
export default function QuickCheck({ c }: { c: Check }) {
  const attempts = useAttempts()
  const [sel, setSel] = useState<number | null>(null)
  const [tries, setTries] = useState(0)
  const [state, setState] = useState<'idle' | 'wrong' | 'right'>('idle')
  const prior = attempts.filter((a) => a.itemId === c.id).length

  const submit = () => {
    if (sel === null) return
    const ok = sel === c.answer
    addAttempt({
      itemId: c.id, source: 'lesson', kps: c.kps, correct: ok,
      kind: tries === 0 && prior === 0 ? 'firstIndependent' : 'hinted', at: Date.now(),
    })
    setTries(tries + 1)
    setState(ok ? 'right' : 'wrong')
    if (ok) fx.correct(tries === 0 && prior === 0); else fx.wrong()
  }

  return (
    <div className="mt-3 rounded-xl border-2 border-dashed border-grape-500/60 bg-white p-3">
      <p className="text-sm font-bold text-grape-500">小檢核</p>
      <p className="mt-1">{c.q}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {c.options.map((o, i) => (
          <button key={i} type="button" disabled={state === 'right'} aria-pressed={sel === i}
            onClick={() => { setSel(i); setState('idle') }}
            className={`rounded-xl border-2 px-3 py-2 text-left min-h-11 ${sel === i ? 'border-teal-600 bg-sun-100 font-bold' : 'border-navy-800/30 bg-white'}`}>
            {o}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3 flex-wrap">
        <button type="button" className="btn btn-primary" disabled={sel === null || state === 'right'} onClick={submit}>確認</button>
        {state === 'wrong' && <span role="status" className="text-sm">差一點點,再想想看(上面的實驗可以幫你)。</span>}
        {state === 'right' && <span role="status" className="text-sm font-bold text-green-800">答對了!{c.explain}</span>}
      </div>
    </div>
  )
}
