import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { addAttempt } from '../store'
import { fx } from '../feedback'
import type { AttemptKind } from '../core/progress'
import { subCount, type GameDef, type GameItem } from './types'
import { CalcView, ChoiceView, ClassifyView, MatchView, PuzzleView, type HintLevel, type Rec } from './Items'

interface Result { first: boolean; can: string }

/** 一關遊戲:沒有計時、沒有扣命。答錯可以重試,結果以「學會了什麼」呈現。 */
export default function Session({ game, level, onRestart }: { game: GameDef; level: 1 | 2 | 3; onRestart: () => void }) {
  const lv = game.levels[level - 1]
  const [idx, setIdx] = useState(0)
  const [results, setResults] = useState<Record<string, Result>>({})
  const [solved, setSolved] = useState<string[]>([])
  const tries = useRef<Record<string, number>>({})
  const total = lv.items.reduce((s, it) => s + subCount(it), 0)

  const rec: Rec = (key, kp, can, correct, hl: HintLevel) => {
    const first = tries.current[key] === undefined
    tries.current[key] = (tries.current[key] ?? 0) + 1
    const kind: AttemptKind = hl === 2 ? 'afterSolution' : hl === 1 || !first ? 'hinted' : 'firstIndependent'
    addAttempt({ itemId: `G:${game.id}:L${level}:${key}`, source: 'game', kps: [kp], correct, kind, at: Date.now() })
    if (correct) { setSolved((x) => (x.includes(key) ? x : [...x, key])); fx.correct(kind === 'firstIndependent') } else fx.wrong()
    setResults((r) => (r[key] ? r : { ...r, [key]: { first: first && correct && kind === 'firstIndependent', can } }))
  }

  if (idx >= lv.items.length) return <Result game={game} level={level} results={results} total={total} onRestart={onRestart} />

  const item: GameItem = lv.items[idx]
  const id = `i${idx}`
  const next = () => setIdx(idx + 1)
  const common = { id, rec, onDone: next }
  const done = solved.length
  return (
    <div className="space-y-3">
      <div className="card">
        <p className="text-sm font-bold">第 {level} 關 · {lv.goal}</p>
        <div className="mt-1 h-3 overflow-hidden rounded-full border-2 border-navy-800/50 bg-sun-100" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
          <div className="h-full bg-teal-500" style={{ width: `${(done / total) * 100}%` }} />
        </div>
        <p className="mt-1 text-xs text-slate-600">已完成 {done} / {total} 小題 · 沒有時間限制</p>
      </div>
      <div className="card">
        {item.kind === 'choice' && <ChoiceView key={id} item={item} {...common} />}
        {item.kind === 'calc' && <CalcView key={id} item={item} {...common} />}
        {item.kind === 'puzzle' && <PuzzleView key={id} item={item} {...common} />}
        {item.kind === 'match' && <MatchView key={id} item={item} {...common} />}
        {item.kind === 'classify' && <ClassifyView key={id} item={item} {...common} />}
      </div>
    </div>
  )
}

function Result({ game, level, results, total, onRestart }: { game: GameDef; level: 1 | 2 | 3; results: Record<string, Result>; total: number; onRestart: () => void }) {
  useEffect(() => { fx.complete() }, [])
  const all = Object.values(results)
  const first = all.filter((r) => r.first)
  const cans = [...new Set(first.map((r) => r.can))]
  const practice = [...new Set(all.filter((r) => !r.first).map((r) => r.can))].filter((c) => !cans.includes(c))
  return (
    <div className="card space-y-3 text-center">
      <h2 className="text-2xl font-extrabold text-navy-900">完成第 {level} 關!🎉</h2>
      {cans.length > 0 ? (
        <p className="text-lg">你已經能{game.outcomeVerb}:<b>{cans.join('、')}</b>(共 {cans.length} 項)</p>
      ) : (
        <p className="text-lg">你把這一關全部做完了,這就是進步。再玩一次會更熟。</p>
      )}
      <p className="text-sm">{total} 小題中,第一次就答對 <b>{first.length}</b> 題;其餘題目是靠提示或重試完成的,這很正常,再玩一次看看。</p>
      {practice.length > 0 && <p className="rounded-xl bg-sun-100 px-3 py-2 text-sm">還可以再練習:{practice.join('、')}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <button className="btn btn-sun" onClick={onRestart}>再玩一次</button>
        {level < 3 && <Link className="btn btn-primary" to={`/games/${game.id}/${level + 1}`}>挑戰第 {level + 1} 關</Link>}
        <Link className="btn btn-ghost" to="/games">回遊戲選單</Link>
      </div>
    </div>
  )
}
