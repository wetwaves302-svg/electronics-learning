import { Link } from 'react-router-dom'
import { units } from '../units'
import { useQuestions } from '../data/bank'
import { itemMastery } from '../core/progress'
import { useAttempts } from '../store'
import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import { useWrongBook } from '../wrongbook'
import ShareCard from '../components/ShareCard'

interface Assign { id: number; title: string; questionIds: string[]; due: number | null; progress: { done: number; independent: number; total: number } }

/** 老師指定的練習(登入的學生才會看到) */
function Assignments() {
  const { user } = useAuth()
  const attempts = useAttempts()
  const [list, setList] = useState<Assign[]>([])
  useEffect(() => {
    if (user?.role !== 'student') return
    let alive = true
    api<{ assignments: Assign[] }>('GET', '/api/assignments/mine').then((r) => { if (alive) setList(r.assignments) }).catch(() => undefined)
    return () => { alive = false }
  }, [user, attempts.length])
  if (user?.role !== 'student' || list.length === 0) return null
  return (
    <section className="card space-y-2" aria-label="老師指定的練習">
      <h2 className="text-lg font-extrabold text-navy-900">老師指定的練習</h2>
      {list.map((a) => {
        // 進度以本機最新紀錄即時計算(伺服器的進度在同步後才更新)
        const done = a.questionIds.filter((id) => attempts.some((x) => x.itemId === id && x.correct)).length
        const next = a.questionIds.find((id) => !attempts.some((x) => x.itemId === id && x.correct)) ?? a.questionIds[0]
        return (
          <div key={a.id} className="rounded-xl border-2 border-navy-800/20 bg-white p-2">
            <p className="font-bold">{a.title}</p>
            <p className="text-sm">已答對過 {done} / {a.questionIds.length} 題{a.due ? `,截止 ${new Date(a.due).toLocaleDateString('zh-TW')}` : ''}</p>
            <div className="mt-1 h-3 rounded-full bg-sun-100"><div className="h-3 rounded-full bg-teal-500" style={{ width: `${(done / a.questionIds.length) * 100}%` }} /></div>
            <Link className="btn btn-sun mt-2 inline-block text-sm" to={`/practice/${next}`}>{done === a.questionIds.length ? '再複習一次' : '繼續練習'}</Link>
          </div>
        )
      })}
    </section>
  )
}

export default function Home() {
  const attempts = useAttempts()
  const wrong = useWrongBook()
  const questions = useQuestions()
  const stat = (unit: string) => {
    const qs = questions.filter((q) => q.unit === unit)
    const ms = qs.map((q) => itemMastery(attempts.filter((a) => a.itemId === q.id)))
    return {
      total: qs.length,
      tried: ms.filter((m) => m !== 'unseen').length,
      independent: ms.filter((m) => m === 'independent' || m === 'retained').length,
    }
  }
  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-teal-600 text-white p-6 border-4 border-navy-800 shadow-[0_6px_0_rgba(23,64,122,.85)]">
        <h1 className="text-2xl font-extrabold">一步一步來,你一定學得會!<span className="text-sun-400"> ★</span></h1>
        <p className="mt-2 text-white/95">電子學 I 第一次段考(1-1 ～ 2-3)。不用一次懂全部,每答對一題、每認得一個符號,都是進步。</p>
        <div className="mt-4 flex gap-2 flex-wrap">
          <Link to="/practice" className="btn btn-sun">開始練習</Link>
          <Link to="/games" className="btn btn-ghost">玩知識遊戲</Link>
          <Link to="/progress" className="btn bg-white/25 text-white hover:bg-white/35">看看我的進步</Link>
        </div>
      </section>
      {wrong.length > 0 && (
        <section className="card flex flex-wrap items-center justify-between gap-3 border-coral-500" aria-label="我的錯題">
          <div>
            <h2 className="text-lg font-extrabold text-navy-900">我的錯題本</h2>
            <p className="text-sm">你有 <b className="text-2xl text-coral-500">{wrong.length}</b> 題錯題。系統已經自動幫你收好了,點下去就能連續練習。</p>
          </div>
          <Link to={`/practice/${wrong[0].itemId}?review=1&wb=1`} className="btn btn-sun">練習我的錯題</Link>
        </section>
      )}
      <ShareCard />
      <Assignments />
      <section className="grid gap-3 sm:grid-cols-2" aria-label="單元">
        {units.map((u) => {
          const s = stat(u.id)
          return (
            <Link key={u.id} to={`/unit/${u.id}`} className="card block hover:border-teal-500">
              <div className="flex items-baseline gap-2">
                <span className="rounded-lg bg-grape-500 text-white font-bold px-2 text-sm">{u.id}</span>
                <h2 className="font-bold">{u.title}</h2>
              </div>
              <p className="text-sm text-navy-800 mt-1">{u.blurb}</p>
              <p className="text-sm mt-3">
                共 {s.total} 題 · 練習過 {s.tried} 題 · 已能獨立答對 <b>{s.independent}</b> 題
              </p>
              <div className="mt-2 h-4 rounded-full bg-sun-100 border-2 border-navy-800/60 overflow-hidden" role="img" aria-label={`能獨立答對 ${s.independent} / ${s.total}`}>
                <div className="h-full rounded-full bg-teal-500" style={{ width: `${(s.independent / s.total) * 100}%` }} />
              </div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
