import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError, download } from '../../api'
import { useQuestions } from '../../data/bank'
import { ERROR_LABEL } from '../../errors'
import { units } from '../../units'
import { Back, Err, RequireTeacher, Td, Th, Wrap, pct, useApiData, when } from './common'

interface StudentSum { id: number; username: string; name: string; tried: number; coverage: number; firstTotal: number; firstCorrect: number; firstRate: number | null; independent: number; stuck: number; gameAttempts: number; lastActive: number | null; topErrors: [string, number][]; needsHelp: boolean; helpReasons: string[] }
interface QStat { id: string; unit: string; label: string; students: number; firstTotal: number; firstCorrect: number; firstRate: number | null; topError: string | null }
interface Analytics {
  class: { id: number; name: string; code: string }
  students: StudentSum[]; questions: QStat[]
  units: { unit: string; questions: number; avgIndependentRatio: number; studentsDone: number }[]
  commonErrors: [string, number][]
  needHelp: { id: number; name: string; reasons: string[] }[]
  hardest: QStat[]
}
type Tab = 'overview' | 'students' | 'questions' | 'assign' | 'export'

export default function ClassPage() { return <RequireTeacher><Inner /></RequireTeacher> }

function Inner() {
  const { id } = useParams()
  const { data, error, reload } = useApiData<Analytics>(`/api/classes/${id}/analytics`)
  const [tab, setTab] = useState<Tab>('overview')
  const tabBtn = (t: Tab, label: string) => <button role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`btn text-sm ${tab === t ? 'btn-sun' : 'btn-ghost'}`}>{label}</button>
  return (
    <div className="space-y-4">
      <Back to="/teacher">所有班級</Back>
      <Err msg={error} />
      {data && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="rounded-2xl bg-white/90 px-3 text-2xl font-extrabold text-navy-900">{data.class.name}</h1>
            <span className="rounded-xl bg-white/90 px-3 py-1 text-sm">班級代碼 <b className="rounded-md bg-sun-400 px-2 font-mono tracking-widest">{data.class.code}</b></span>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist">{tabBtn('overview', '總覽')}{tabBtn('students', '學生')}{tabBtn('questions', '題目分析')}{tabBtn('assign', '指定練習')}{tabBtn('export', '匯出')}</div>
          {tab === 'overview' && <Overview a={data} />}
          {tab === 'students' && <Students a={data} classId={Number(id)} reload={reload} />}
          {tab === 'questions' && <QuestionStats a={data} />}
          {tab === 'assign' && <Assign classId={Number(id)} />}
          {tab === 'export' && <Export classId={Number(id)} name={data.class.name} />}
        </>
      )}
    </div>
  )
}

const avg = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x !== null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null }

function Overview({ a }: { a: Analytics }) {
  const active = a.students.filter((s) => s.tried > 0).length
  const maxErr = Math.max(1, ...a.commonErrors.map(([, n]) => n))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="學生人數" value={String(a.students.length)} note={`${active} 人開始練習`} />
        <Stat label="平均題庫覆蓋率" value={pct(avg(a.students.map((s) => s.coverage)))} />
        <Stat label="平均首次獨立答對率" value={pct(avg(a.students.map((s) => s.firstRate)))} note="只算有作答的學生" />
        <Stat label="需要補救" value={`${a.needHelp.length} 人`} />
      </div>
      <section className="card space-y-2">
        <h2 className="font-bold">需要補救的學生</h2>
        {a.needHelp.length === 0 ? <p className="text-sm">目前沒有符合條件的學生。</p> : (
          <ul className="space-y-1">{a.needHelp.map((s) => <li key={s.id} className="text-sm"><Link className="font-bold underline" to={`/teacher/student/${s.id}`}>{s.name}</Link>:{s.reasons.join(';')}</li>)}</ul>
        )}
        <p className="text-xs text-slate-600">條件:首次獨立作答 ≥ 5 次且答對率 &lt; 50%,或有 ≥ 3 題一直沒答對。</p>
      </section>
      <section className="card space-y-2">
        <h2 className="font-bold">各單元完成情形</h2>
        <Wrap><table className="w-full"><thead><tr><Th>單元</Th><Th>題數</Th><Th>全班平均「能獨立答對」</Th><Th>達 80% 的人數</Th></tr></thead>
          <tbody>{a.units.map((u) => <tr key={u.unit}><Td>{u.unit}</Td><Td>{u.questions}</Td><Td>{pct(u.avgIndependentRatio)}</Td><Td>{u.studentsDone} / {a.students.length}</Td></tr>)}</tbody></table></Wrap>
      </section>
      <section className="card space-y-2">
        <h2 className="font-bold">最需要再講解的題目(首次答對率最低)</h2>
        {a.hardest.length === 0 ? <p className="text-sm">每題至少要有 3 筆首次作答才會列入。</p> : (
          <ul className="space-y-1">{a.hardest.map((q) => <li key={q.id} className="text-sm"><b>{q.label}</b>({q.id}):首次答對 {q.firstCorrect}/{q.firstTotal}({pct(q.firstRate)}){q.topError ? `,最常見錯誤:${ERROR_LABEL[q.topError] ?? q.topError}` : ''}</li>)}</ul>
        )}
      </section>
      <section className="card space-y-2">
        <h2 className="font-bold">全班最常見的錯誤類型</h2>
        {a.commonErrors.length === 0 ? <p className="text-sm">還沒有錯誤紀錄。</p> : a.commonErrors.map(([k, n]) => (
          <div key={k} className="text-sm"><div className="flex justify-between"><span>{ERROR_LABEL[k] ?? k}</span><b>{n} 次</b></div><div className="h-2 rounded-full bg-sun-100"><div className="h-2 rounded-full bg-teal-500" style={{ width: `${(n / maxErr) * 100}%` }} /></div></div>
        ))}
      </section>
    </div>
  )
}

const Stat = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <div className="card text-center"><div className="text-2xl font-bold text-navy-800">{value}</div><div className="text-sm">{label}</div>{note && <div className="text-xs text-slate-500">{note}</div>}</div>
)

function Students({ a, classId, reload }: { a: Analytics; classId: number; reload: () => void }) {
  const [lines, setLines] = useState('')
  const [result, setResult] = useState<{ created: { username: string; name: string; password: string }[]; errors: { line: string; error: string }[] } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const add = async (e: FormEvent) => {
    e.preventDefault(); setErr(null)
    try { setResult(await api('POST', `/api/classes/${classId}/students`, { lines })); setLines(''); reload() } catch (x) { setErr(x instanceof ApiError ? x.message : '失敗') }
  }
  const reset = async (s: StudentSum) => {
    if (!confirm(`重設「${s.name || s.username}」的密碼?`)) return
    try { const r = await api<{ username: string; password: string }>('POST', `/api/students/${s.id}/reset-password`); setNote(`${r.username} 的新密碼:${r.password}(只會顯示這一次)`) } catch (x) { setErr(x instanceof ApiError ? x.message : '失敗') }
  }
  const disable = async (s: StudentSum) => {
    if (!confirm(`停用「${s.name || s.username}」的帳號?停用後無法登入,紀錄會保留。`)) return
    try { await api('POST', `/api/students/${s.id}/disable`, { disabled: true }); reload() } catch (x) { setErr(x instanceof ApiError ? x.message : '失敗') }
  }
  return (
    <div className="space-y-4">
      <Err msg={err} />
      {note && <p role="status" className="rounded-xl bg-sun-100 px-3 py-2 text-sm">{note}</p>}
      <Wrap><table className="w-full"><thead><tr><Th>姓名</Th><Th>帳號</Th><Th>覆蓋率</Th><Th>首次獨立答對率</Th><Th>能獨立答對</Th><Th>尚未答對</Th><Th>最後作答</Th><Th>狀態</Th><Th>操作</Th></tr></thead>
        <tbody>{a.students.map((s) => (
          <tr key={s.id}>
            <Td><Link className="font-bold underline" to={`/teacher/student/${s.id}`}>{s.name || s.username}</Link></Td><Td>{s.username}</Td><Td>{pct(s.coverage)}</Td><Td>{pct(s.firstRate)}{s.firstTotal ? `(${s.firstCorrect}/${s.firstTotal})` : ''}</Td><Td>{s.independent}</Td><Td>{s.stuck}</Td><Td>{when(s.lastActive)}</Td>
            <Td>{s.needsHelp ? <span className="rounded-full bg-red-100 px-2 text-xs text-red-800">需補救</span> : s.tried === 0 ? <span className="text-xs text-slate-500">尚未開始</span> : <span className="text-xs text-green-800">正常</span>}</Td>
            <Td><button className="text-xs underline" onClick={() => reset(s)}>重設密碼</button> · <button className="text-xs underline" onClick={() => disable(s)}>停用</button></Td>
          </tr>))}
        </tbody></table></Wrap>
      <form onSubmit={add} className="card space-y-2">
        <h2 className="font-bold">批次新增學生</h2>
        <p className="text-sm">每行一位:<code>帳號,姓名,密碼</code>(密碼可省略,系統會產生 6 位數字)。學生也可以用班級代碼自己註冊。</p>
        <textarea value={lines} onChange={(e) => setLines(e.target.value)} rows={5} required placeholder={'s01,王小明\ns02,李小華,mypass88'} className="block w-full rounded-xl border-2 border-navy-800/40 px-3 py-2" />
        <button className="btn btn-primary">新增</button>
        {result && (
          <div className="space-y-2" role="status">
            {result.created.length > 0 && <div className="rounded-xl bg-teal-100 p-2 text-sm"><b>已建立 {result.created.length} 位。初始密碼只會顯示這一次,請抄下來或列印:</b><ul className="mt-1 font-mono text-xs">{result.created.map((c) => <li key={c.username}>{c.username}　{c.name}　{c.password}</li>)}</ul></div>}
            {result.errors.length > 0 && <div className="rounded-xl bg-red-50 p-2 text-sm text-red-800"><b>下列行沒有建立:</b><ul>{result.errors.map((x, i) => <li key={i}>{x.line} → {x.error}</li>)}</ul></div>}
          </div>
        )}
      </form>
    </div>
  )
}

function QuestionStats({ a }: { a: Analytics }) {
  const [unit, setUnit] = useState('all')
  const rows = a.questions.filter((q) => unit === 'all' || q.unit === unit).sort((x, y) => (x.firstRate ?? 2) - (y.firstRate ?? 2))
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2"><button className={`btn text-sm ${unit === 'all' ? 'btn-sun' : 'btn-ghost'}`} onClick={() => setUnit('all')}>全部</button>{units.map((u) => <button key={u.id} className={`btn text-sm ${unit === u.id ? 'btn-sun' : 'btn-ghost'}`} onClick={() => setUnit(u.id)}>{u.id}</button>)}</div>
      <Wrap><table className="w-full"><thead><tr><Th>題目</Th><Th>單元</Th><Th>作答人數</Th><Th>首次作答</Th><Th>首次答對率</Th><Th>最常見錯誤</Th></tr></thead>
        <tbody>{rows.map((q) => <tr key={q.id}><Td>{q.label}<span className="ml-1 text-xs text-slate-500">{q.id}</span></Td><Td>{q.unit}</Td><Td>{q.students}</Td><Td>{q.firstCorrect}/{q.firstTotal}</Td><Td>{pct(q.firstRate)}</Td><Td>{q.topError ? (ERROR_LABEL[q.topError] ?? q.topError) : '—'}</Td></tr>)}</tbody></table></Wrap>
      <p className="text-xs text-slate-600">按「首次答對率」由低到高排序;還沒有人作答的排在最後。</p>
    </div>
  )
}

interface AssignData { students: { id: number; name: string }[]; assignments: { id: number; title: string; questionIds: string[]; due: number | null; progress: { studentId: number; done: number; independent: number; total: number }[] }[] }
function Assign({ classId }: { classId: number }) {
  const { data, reload } = useApiData<AssignData>(`/api/classes/${classId}/assignments`)
  const questions = useQuestions()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [sel, setSel] = useState<string[]>([])
  const [unit, setUnit] = useState('1-2')
  const [err, setErr] = useState<string | null>(null)
  const list = useMemo(() => questions.filter((q) => q.unit === unit), [questions, unit])
  const toggle = (id: string) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id])
  const create = async (e: FormEvent) => {
    e.preventDefault(); setErr(null)
    try { await api('POST', `/api/classes/${classId}/assignments`, { title, questionIds: sel, due: due ? new Date(due + 'T23:59:59').getTime() : null }); setTitle(''); setSel([]); setDue(''); reload() } catch (x) { setErr(x instanceof ApiError ? x.message : '失敗') }
  }
  const del = async (id: number) => { if (confirm('刪除這個指定練習?(學生的作答紀錄不受影響)')) { await api('DELETE', `/api/assignments/${id}`); reload() } }
  return (
    <div className="space-y-4">
      {data?.assignments.map((a) => (
        <section key={a.id} className="card space-y-2">
          <div className="flex items-start justify-between gap-2"><div><h3 className="font-bold">{a.title}</h3><p className="text-xs">{a.questionIds.length} 題{a.due ? `,截止 ${new Date(a.due).toLocaleDateString('zh-TW')}` : ''}</p></div><button className="text-xs underline" onClick={() => del(a.id)}>刪除</button></div>
          <Wrap><table className="w-full"><thead><tr><Th>學生</Th><Th>已答對過</Th><Th>能獨立答對</Th></tr></thead>
            <tbody>{a.progress.map((p) => <tr key={p.studentId}><Td>{data.students.find((s) => s.id === p.studentId)?.name}</Td><Td>{p.done} / {p.total}</Td><Td>{p.independent} / {p.total}</Td></tr>)}</tbody></table></Wrap>
        </section>
      ))}
      <form onSubmit={create} className="card space-y-2">
        <h2 className="font-bold">新增指定練習</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={60} placeholder="名稱,例如:第一次段考前複習" className="block w-full rounded-xl border-2 border-navy-800/40 px-3 py-2 min-h-11" />
        <label className="block text-sm">截止日期(選填)<input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="ml-2 rounded-lg border-2 border-navy-800/40 px-2 py-1" /></label>
        <div className="flex flex-wrap gap-2">{units.map((u) => <button type="button" key={u.id} className={`btn text-sm ${unit === u.id ? 'btn-sun' : 'btn-ghost'}`} onClick={() => setUnit(u.id)}>{u.id}</button>)}
          <button type="button" className="btn btn-ghost text-sm" onClick={() => setSel([...new Set([...sel, ...list.map((q) => q.id)])])}>全選此單元</button></div>
        <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border-2 border-navy-800/20 p-2">{list.map((q) => <li key={q.id}><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={sel.includes(q.id)} onChange={() => toggle(q.id)} className="mt-1 h-5 w-5" /><span><b>{q.source.label}</b> {q.stem.slice(0, 40)}…</span></label></li>)}</ul>
        <p className="text-sm">已選 {sel.length} 題</p>
        <Err msg={err} />
        <button className="btn btn-primary" disabled={sel.length === 0}>建立</button>
      </form>
    </div>
  )
}

function Export({ classId, name }: { classId: number; name: string }) {
  const [err, setErr] = useState<string | null>(null)
  return (
    <div className="card space-y-2">
      <h2 className="font-bold">匯出 Excel 學習紀錄</h2>
      <p className="text-sm">包含:學生總表、單元完成率、題目分析、指定練習完成狀況、完整作答紀錄與說明。</p>
      <Err msg={err} />
      <button className="btn btn-primary" onClick={() => download(`/api/classes/${classId}/export.xlsx`, `${name}-學習紀錄.xlsx`).catch(() => setErr('下載失敗'))}>下載 .xlsx</button>
    </div>
  )
}
