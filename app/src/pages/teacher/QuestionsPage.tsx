import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { units } from '../../units'
import { Back, Badge, Err, RequireTeacher, STATUS_LABEL, Td, Th, Wrap, useApiData } from './common'

interface Row { id: string; unit: string; label: string; stem: string; status: string; version: number; custom: boolean }

export default function QuestionsPage() { return <RequireTeacher><Inner /></RequireTeacher> }

function Inner() {
  const { data, error } = useApiData<{ questions: Row[] }>('/api/teacher/questions')
  const [unit, setUnit] = useState('all')
  const [status, setStatus] = useState('all')
  const [text, setText] = useState('')
  const rows = useMemo(() => (data?.questions ?? []).filter((q) => (unit === 'all' || q.unit === unit) && (status === 'all' || q.status === status) && (!text || (q.id + q.label + q.stem).includes(text))), [data, unit, status, text])
  const counts = useMemo(() => { const m: Record<string, number> = {}; for (const q of data?.questions ?? []) m[q.status] = (m[q.status] ?? 0) + 1; return m }, [data])
  return (
    <div className="space-y-4">
      <Back to="/teacher">教師後台</Back>
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="inline-block rounded-2xl bg-white/90 px-3 text-2xl font-extrabold text-navy-900">題目審核與編輯</h1><Link className="btn btn-sun text-sm" to="/teacher/questions/new">新增題目</Link></div>
      <Err msg={error} />
      <div className="flex flex-wrap gap-2 text-sm">{Object.entries(STATUS_LABEL).map(([k, v]) => <span key={k} className="rounded-xl bg-white/90 px-3 py-1">{v}:<b>{counts[k] ?? 0}</b></span>)}</div>
      <div className="card flex flex-wrap items-center gap-2">
        <select aria-label="單元" value={unit} onChange={(e) => setUnit(e.target.value)} className="rounded-lg border-2 border-navy-800/40 px-2 py-1"><option value="all">全部單元</option>{units.map((u) => <option key={u.id} value={u.id}>{u.id} {u.title}</option>)}</select>
        <select aria-label="狀態" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border-2 border-navy-800/40 px-2 py-1"><option value="all">全部狀態</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input aria-label="搜尋" value={text} onChange={(e) => setText(e.target.value)} placeholder="搜尋題號或文字" className="min-w-0 flex-1 rounded-lg border-2 border-navy-800/40 px-2 py-1" />
      </div>
      <Wrap><table className="w-full"><thead><tr><Th>題目</Th><Th>單元</Th><Th>狀態</Th><Th>版本</Th><Th>內容</Th></tr></thead>
        <tbody>{rows.map((q) => <tr key={q.id}><Td><Link className="font-bold underline" to={`/teacher/questions/${q.id}`}>{q.label}</Link><span className="ml-1 text-xs text-slate-500">{q.id}{q.custom ? '(新增)' : ''}</span></Td><Td>{q.unit}</Td><Td><Badge s={q.status} /></Td><Td>{q.version || '原始'}</Td><Td className="max-w-xs truncate">{q.stem.slice(0, 30)}…</Td></tr>)}</tbody></table></Wrap>
      <p className="text-xs text-slate-600">所有內建題目一開始都是「待檢查」或「我方計算已驗證」。請老師逐題檢查後標為「教師已檢查」,確認可以給學生用再標「已正式發布」。</p>
    </div>
  )
}
