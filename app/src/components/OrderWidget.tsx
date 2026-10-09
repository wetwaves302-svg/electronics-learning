import { useMemo, useState } from 'react'
import { scramble } from '../games/Items'
import { addAttempt } from '../store'
import { fx } from '../feedback'

interface Item { id: string; label: string; sub?: string }

/** 排序小遊戲:依序點選,答錯不重來,提示下一個的範圍;紀錄以「首次是否一路正確」計為獨立作答。 */
export default function OrderWidget({ items, prompt, attemptId, kp }: { items: Item[]; prompt: string; attemptId: string; kp: string }) {
  const order = useMemo(() => scramble(items.length), [items.length])
  const [picked, setPicked] = useState<string[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [msg, setMsg] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const done = picked.length === items.length
  const tap = (id: string) => {
    if (done || picked.includes(id)) return
    const ok = id === items[picked.length].id
    if (ok) {
      const next = [...picked, id]
      setPicked(next)
      setMsg(null)
      if (next.length === items.length) fx.complete(); else fx.correct(mistakes === 0)
      if (next.length === items.length) addAttempt({ itemId: `${attemptId}:${round}`, source: 'lesson', kps: [kp], correct: true, kind: mistakes === 0 && round === 0 ? 'firstIndependent' : 'hinted', at: Date.now() })
    } else {
      setMistakes(mistakes + 1)
      fx.wrong()
      setMsg(`還不是這個。已經排好 ${picked.length} 個,想想「下一個」該是誰。`)
    }
  }
  return (
    <div className="space-y-2">
      <p className="font-medium">{prompt}</p>
      <ol className="flex min-h-12 flex-wrap gap-1 rounded-xl border-2 border-dashed border-navy-800/40 bg-white p-2" aria-label="你排好的順序">
        {picked.length === 0 && <li className="text-sm text-slate-500">從下面點選,依序排進來</li>}
        {picked.map((id, i) => <li key={id} className="rounded-lg bg-teal-100 px-2 py-1 text-sm font-bold text-green-900">{i + 1}. {items.find((x) => x.id === id)!.label}</li>)}
      </ol>
      <div className="flex flex-wrap gap-2" aria-label="待排列的項目">
        {order.map((o) => {
          const it = items[o]
          return (
            <button key={it.id} disabled={picked.includes(it.id)} onClick={() => tap(it.id)} className="rounded-xl border-2 border-navy-800/50 bg-white px-3 py-2 min-h-11 text-sm font-medium disabled:opacity-30">
              {it.label}{it.sub && <span className="block text-xs font-normal text-slate-600">{it.sub}</span>}
            </button>
          )
        })}
      </div>
      {msg && <p role="status" className="text-sm">{msg}</p>}
      {done && <p role="status" className="rounded-xl bg-teal-100 px-3 py-2 text-sm"><b>全部排對了!</b>{mistakes === 0 ? '一次就成功。' : `中間試了 ${mistakes} 次,沒關係,再玩一次會更熟。`}</p>}
      {(done || picked.length > 0) && <button className="btn btn-ghost text-sm" onClick={() => { setPicked([]); setMistakes(0); setMsg(null); setRound(round + 1) }}>重新排一次</button>}
    </div>
  )
}
