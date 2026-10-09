import { Link } from 'react-router-dom'

/** 三種學習模式:A 老師帶著做、B 一起想一想、C 換你自己做 */
export default function ModeTabs({ qid, mode, hasCoach }: { qid: string; mode: 'a' | 'b' | 'c'; hasCoach: boolean }) {
  const tab = (m: 'a' | 'b' | 'c', label: string, to: string) => (
    <Link key={m} to={to} aria-current={mode === m ? 'page' : undefined}
      className={`btn text-center text-sm ${mode === m ? 'btn-sun' : 'btn-ghost'}`}>{label}</Link>
  )
  if (!hasCoach) return <p className="rounded-xl bg-white/90 px-3 py-2 text-xs">這題的「老師帶著做」與「一起想一想」還在製作中,先用「換你自己做」。</p>
  return (
    <nav className="grid grid-cols-3 gap-2" aria-label="學習模式">
      {tab('a', 'A 老師帶著做', `/coach/${qid}?mode=a`)}
      {tab('b', 'B 一起想一想', `/coach/${qid}?mode=b`)}
      {tab('c', 'C 換你自己做', `/practice/${qid}`)}
    </nav>
  )
}
