import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { games, gameById } from '../games'
import Session from '../games/Session'
import { subCount } from '../games/types'
import { useAttempts } from '../store'

const KIND_LABEL: Record<string, string> = { symbol: '符號辨識', formulaMatch: '公式配對', termMatch: '名詞配對', classify: '分類', figure: '圖像判讀', puzzle: '公式拼圖', calc: '簡單計算' }

export function GamesHome() {
  const attempts = useAttempts()
  return (
    <div className="space-y-4">
      <h1 className="inline-block rounded-2xl bg-white/90 px-3 text-2xl font-extrabold text-navy-900">知識遊戲</h1>
      <p className="rounded-2xl bg-white/90 p-3 text-sm">每關 2~4 分鐘,沒有計時、答錯可以重試。玩完會告訴你「學會了什麼」。遊戲的成績會和習作題一起算進你的觀念掌握度。</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {games.map((g) => (
          <section key={g.id} className="card space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-grape-500 px-2 text-sm font-bold text-white">{g.unit}</span>
              <h2 className="font-extrabold">{g.title}</h2>
            </div>
            <p className="text-sm">{g.blurb}</p>
            <p className="text-xs text-slate-600">{g.kind.map((k) => KIND_LABEL[k]).join('、')}</p>
            <div className="grid grid-cols-3 gap-2">
              {g.levels.map((lv) => {
                const prefix = `G:${g.id}:L${lv.level}:`
                const total = lv.items.reduce((s, it) => s + subCount(it), 0)
                const keys = new Set(attempts.filter((a) => a.itemId.startsWith(prefix)).map((a) => a.itemId))
                const first = new Set(attempts.filter((a) => a.itemId.startsWith(prefix) && a.kind === 'firstIndependent' && a.correct).map((a) => a.itemId))
                return (
                  <Link key={lv.level} to={`/games/${g.id}/${lv.level}`} className="btn btn-ghost flex-col text-center text-sm leading-tight">
                    <span>第 {lv.level} 關</span>
                    <span className="text-xs font-normal">{lv.level === 1 ? '辨識' : lv.level === 2 ? '理解' : '應用'}</span>
                    {keys.size > 0 && <span className="text-xs text-green-800">首次答對 {first.size}/{total}</span>}
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export function GamePlay() {
  const { gid, lvl } = useParams()
  const [run, setRun] = useState(0)
  const game = gid ? gameById(gid) : undefined
  const level = Number(lvl)
  if (!game || ![1, 2, 3].includes(level)) return <p>找不到這個遊戲。<Link className="underline" to="/games">回遊戲選單</Link></p>
  return (
    <div className="space-y-3">
      <Link to="/games" className="inline-block rounded-full border-2 border-navy-800 bg-white px-3 py-1 text-sm font-bold text-navy-800">← 遊戲選單</Link>
      <h1 className="text-xl font-extrabold text-navy-900"><span className="rounded-lg bg-grape-500 px-2 text-white mr-2">{game.unit}</span>{game.title}</h1>
      <Session key={`${game.id}-${level}-${run}`} game={game} level={level as 1 | 2 | 3} onRestart={() => setRun(run + 1)} />
    </div>
  )
}
