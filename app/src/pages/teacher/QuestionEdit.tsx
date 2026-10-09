import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../../api'
import { getQuestion } from '../../data/bank'
import { questionById as baseQuestion } from '../../data/questions'
import { Back, Badge, Err, RequireTeacher, STATUS_LABEL, Td, Th, Wrap, useApiData, when } from './common'

interface Row { id: string; unit: string; label: string; stem: string; status: string; solution: string; version: number; custom: boolean }
interface Ver { version: number; solution: string | null; stem: string | null; status: string; editedAt: number; note: string; editedBy: string }

export default function QuestionEdit() { return <RequireTeacher><Inner /></RequireTeacher> }

function Inner() {
  const { qid } = useParams()
  const list = useApiData<{ questions: Row[] }>('/api/teacher/questions')
  const vers = useApiData<{ versions: Ver[] }>(`/api/teacher/questions/${qid}/versions`)
  const row = list.data?.questions.find((q) => q.id === qid)
  const [solution, setSolution] = useState('')
  const [stem, setStem] = useState('')
  const [status, setStatus] = useState('pending')
  const [note, setNote] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  useEffect(() => { if (row) { setSolution(row.solution); setStem(row.stem); setStatus(row.status) } }, [row?.id, row?.version]) // eslint-disable-line react-hooks/exhaustive-deps
  const q = qid ? getQuestion(qid) ?? baseQuestion(qid) : undefined

  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr(null); setOk(null)
    try {
      const r = await api<{ version: number }>('PUT', `/api/teacher/questions/${qid}`, { solution, stem, status, note })
      setOk(`已儲存為版本 ${r.version}。`); setNote(''); list.reload(); vers.reload()
    } catch (x) { setErr(x instanceof ApiError ? x.message : '儲存失敗') }
  }
  const restore = async (v: number) => {
    if (!confirm(`還原成版本 ${v} 的內容?(會新增一個版本,不會刪除任何歷史)`)) return
    try { await api('POST', `/api/teacher/questions/${qid}/restore`, { version: v }); list.reload(); vers.reload() } catch (x) { setErr(x instanceof ApiError ? x.message : '失敗') }
  }
  return (
    <div className="space-y-4">
      <Back to="/teacher/questions">題目列表</Back>
      <Err msg={list.error} />
      {row && q && (
        <>
          <h1 className="rounded-2xl bg-white/90 px-3 text-xl font-extrabold text-navy-900">{row.label} <span className="text-sm font-normal">{row.id}</span> <Badge s={row.status} /></h1>
          <section className="card space-y-1 text-sm">
            <h2 className="font-bold">題目內容(供審核對照)</h2>
            <p>{q.stem}</p>
            {q.type === 'mc' && <ul>{q.options.map((o, i) => <li key={i} className={i === q.answer ? 'font-bold text-green-800' : ''}>({'ABCDEF'[i]}) {o.text}{i === q.answer ? ' ← 標準答案' : ''}</li>)}</ul>}
            {q.type === 'numeric' && <ul>{q.parts.map((p, i) => <li key={i}>{p.label}:{p.value} {p.unit}(容許誤差 {((p.relTol ?? 0.01) * 100).toFixed(1)}%)</li>)}</ul>}
            {q.type === 'open' && <p>參考答案:{q.modelAnswer}</p>}
            <p className="text-xs text-slate-600">來源:{q.source.file} 第 {q.source.page} 頁 {q.source.label}{q.solutionAuthoredByUs ? ';解析由本平台補寫' : ''}</p>
          </section>
          <form onSubmit={save} className="card space-y-2">
            <h2 className="font-bold">編輯</h2>
            <label className="block text-sm font-medium">題幹<textarea value={stem} onChange={(e) => setStem(e.target.value)} rows={3} className="mt-1 block w-full rounded-xl border-2 border-navy-800/40 px-3 py-2" /></label>
            <label className="block text-sm font-medium">解析<textarea value={solution} onChange={(e) => setSolution(e.target.value)} rows={7} className="mt-1 block w-full rounded-xl border-2 border-navy-800/40 px-3 py-2" /></label>
            <label className="block text-sm font-medium">審核狀態<select value={status} onChange={(e) => setStatus(e.target.value)} className="ml-2 rounded-lg border-2 border-navy-800/40 px-2 py-1">{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="block text-sm font-medium">修改說明(選填)<input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="mt-1 block w-full rounded-xl border-2 border-navy-800/40 px-3 py-2" /></label>
            <Err msg={err} />{ok && <p role="status" className="rounded-xl bg-teal-100 px-3 py-2 text-sm">{ok}</p>}
            <button className="btn btn-primary">儲存(新增一個版本)</button>
            <p className="text-xs text-slate-600">每次儲存都會保留版本紀錄,原始內容一律保留為「版本 0」,不會被覆蓋。選擇題的選項與標準答案若有誤,請告知開發者修改資料檔;這裡可編輯題幹、解析與狀態。</p>
          </form>
          <section className="card space-y-1">
            <h2 className="font-bold">版本紀錄</h2>
            {vers.data && vers.data.versions.length === 0 ? <p className="text-sm">尚未修改過(目前是內建的原始內容)。</p> : (
              <Wrap><table className="w-full"><thead><tr><Th>版本</Th><Th>時間</Th><Th>編輯者</Th><Th>狀態</Th><Th>說明</Th><Th>解析開頭</Th><Th></Th></tr></thead>
                <tbody>{vers.data?.versions.map((v) => <tr key={v.version}><Td>{v.version === 0 ? '0(原始)' : v.version}</Td><Td>{when(v.editedAt)}</Td><Td>{v.editedBy}</Td><Td><Badge s={v.status} /></Td><Td>{v.note}</Td><Td className="max-w-xs truncate">{(v.solution ?? '').slice(0, 24)}</Td><Td><button className="text-xs underline" onClick={() => restore(v.version)}>還原此版</button></Td></tr>)}</tbody></table></Wrap>
            )}
          </section>
        </>
      )}
    </div>
  )
}
