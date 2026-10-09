import { useParams } from 'react-router-dom'
import { ERROR_LABEL } from '../../errors'
import { Back, RequireTeacher, Td, Th, Wrap, pct, useApiData, when, Err } from './common'

interface H {
  student: { id: number; username: string; name: string }
  summary: { tried: number; coverage: number; firstTotal: number; firstCorrect: number; firstRate: number | null; independent: number; stuck: number; needsHelp: boolean; helpReasons: string[]; topErrors: [string, number][]; weakKps: { id: string; title: string; mastery: string }[]; lastActive: number | null }
  perQuestion: { id: string; label: string; unit: string; tries: number; firstCorrect: boolean | null; everCorrect: boolean; lastAt: number }[]
  recent: { itemId: string; source: string; correct: boolean; kind: string; at: number; errorType?: string }[]
}
const KIND: Record<string, string> = { firstIndependent: '第一次獨立作答', hinted: '使用提示後作答', afterSolution: '閱讀解析後作答', delayedReview: '延宕複習' }
const SRC: Record<string, string> = { question: '習作題', game: '遊戲', lesson: '教學檢核' }
const MASTERY: Record<string, string> = { attempted: '練習中(尚未答對)', everCorrect: '曾經答對(需提示或看過解析)' }

export default function StudentPage() { return <RequireTeacher><Inner /></RequireTeacher> }

function Inner() {
  const { id } = useParams()
  const { data, error } = useApiData<H>(`/api/students/${id}/history`)
  return (
    <div className="space-y-4">
      <Back to="/teacher">所有班級</Back>
      <Err msg={error} />
      {data && (
        <>
          <h1 className="inline-block rounded-2xl bg-white/90 px-3 text-2xl font-extrabold text-navy-900">{data.student.name || data.student.username}<span className="ml-2 text-sm font-normal">({data.student.username})</span></h1>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['已練習題數', String(data.summary.tried)], ['題庫覆蓋率', pct(data.summary.coverage)], ['首次獨立答對率', `${pct(data.summary.firstRate)}${data.summary.firstTotal ? `(${data.summary.firstCorrect}/${data.summary.firstTotal})` : ''}`], ['能獨立答對 / 尚未答對', `${data.summary.independent} / ${data.summary.stuck}`]].map(([l, v]) => <div key={l} className="card text-center"><div className="text-xl font-bold text-navy-800">{v}</div><div className="text-sm">{l}</div></div>)}
          </div>
          {data.summary.needsHelp && <p role="status" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800"><b>需要補救:</b>{data.summary.helpReasons.join(';')}</p>}
          <section className="card space-y-1"><h2 className="font-bold">常見錯誤</h2>{data.summary.topErrors.length === 0 ? <p className="text-sm">沒有錯誤紀錄。</p> : <ul className="text-sm">{data.summary.topErrors.map(([k, n]) => <li key={k}>{ERROR_LABEL[k] ?? k}:{n} 次</li>)}</ul>}</section>
          <section className="card space-y-1"><h2 className="font-bold">還沒穩的觀念</h2>{data.summary.weakKps.length === 0 ? <p className="text-sm">沒有。</p> : <ul className="text-sm">{data.summary.weakKps.map((k) => <li key={k.id}>{k.title}:{MASTERY[k.mastery] ?? k.mastery}</li>)}</ul>}</section>
          <section className="card space-y-1"><h2 className="font-bold">逐題情形</h2>
            <Wrap><table className="w-full"><thead><tr><Th>題目</Th><Th>作答次數</Th><Th>第一次獨立作答</Th><Th>曾經答對</Th><Th>最後作答</Th></tr></thead>
              <tbody>{data.perQuestion.map((q) => <tr key={q.id}><Td>{q.label}</Td><Td>{q.tries}</Td><Td>{q.firstCorrect === null ? '—' : q.firstCorrect ? '答對' : '答錯'}</Td><Td>{q.everCorrect ? '是' : '否'}</Td><Td>{when(q.lastAt)}</Td></tr>)}</tbody></table></Wrap></section>
          <section className="card space-y-1"><h2 className="font-bold">最近的作答歷程(最多 300 筆)</h2>
            <Wrap><table className="w-full"><thead><tr><Th>時間</Th><Th>類型</Th><Th>項目</Th><Th>作答方式</Th><Th>對錯</Th><Th>錯誤類型</Th></tr></thead>
              <tbody>{data.recent.map((a, i) => <tr key={i}><Td>{when(a.at)}</Td><Td>{SRC[a.source] ?? a.source}</Td><Td>{a.itemId}</Td><Td>{KIND[a.kind] ?? a.kind}</Td><Td>{a.correct ? '對' : '錯'}</Td><Td>{a.errorType ? (ERROR_LABEL[a.errorType] ?? a.errorType) : ''}</Td></tr>)}</tbody></table></Wrap></section>
        </>
      )}
    </div>
  )
}
