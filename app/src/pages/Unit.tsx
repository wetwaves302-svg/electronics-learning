import { Link, useParams } from 'react-router-dom'
import { units } from '../units'
import { knowledgePoints } from '../data/knowledgePoints'
import { useQuestions } from '../data/bank'
import { itemMastery, kpStats } from '../core/progress'
import { useAttempts } from '../store'
import MasteryBadge from '../components/MasteryBadge'
import { games } from '../games'

export default function Unit() {
  const { id } = useParams()
  const unit = units.find((u) => u.id === id)
  const attempts = useAttempts()
  const questions = useQuestions()
  if (!unit) return <p>找不到這個單元。<Link className="underline" to="/">回首頁</Link></p>
  const kps = knowledgePoints.filter((k) => k.unit === unit.id)
  const qs = questions.filter((q) => q.unit === unit.id)
  return (
    <div className="space-y-5">
      <Link to="/" className="inline-block rounded-full bg-white border-2 border-navy-800 px-3 py-1 text-sm font-bold text-navy-800">← 回首頁</Link>
      <h1 className="text-2xl font-extrabold text-navy-900"><span className="rounded-lg bg-grape-500 text-white px-2 mr-2">{unit.id}</span>{unit.title}</h1>
      {['1-1', '1-2', '2-1', '2-2', '2-3'].includes(unit.id) ? (
        <div className="flex flex-wrap gap-2">
          <Link to={`/learn/${unit.id}`} className="btn btn-sun">先學觀念:互動教學(6 個小單元)</Link>
          {games.some((g) => g.unit === unit.id) && <Link to="/games" className="btn btn-primary">玩知識遊戲({games.filter((g) => g.unit === unit.id).length} 款)</Link>}
        </div>
      ) : (
        <p className="rounded-2xl bg-white/90 p-3 text-sm">這個單元的互動教學還在製作中,可以先做下面的習作題。</p>
      )}
      <section>
        <h2 className="font-bold mb-2 rounded-xl bg-white/90 inline-block px-3">這個單元要學會的觀念</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {kps.map((k) => (
            <li key={k.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">{k.title}</h3>
                <MasteryBadge m={kpStats(k.id, attempts).mastery} />
              </div>
              <p className="text-sm text-navy-800/80 mt-1">{k.summary}</p>
              <p className="text-xs text-slate-500 mt-1">{k.id}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-bold mb-2 rounded-xl bg-white/90 inline-block px-3">習作題目({qs.length} 題)</h2>
        <ul className="grid gap-2">
          {qs.map((q) => (
            <li key={q.id}>
              <Link to={`/practice/${q.id}`} className="card flex items-center justify-between gap-2 hover:border-teal-500">
                <span>
                  <span className="text-xs text-slate-500">{q.source.label}</span>
                  <span className="block text-sm line-clamp-2">{q.stem}</span>
                </span>
                <MasteryBadge m={itemMastery(attempts.filter((a) => a.itemId === q.id))} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
