import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../../api'
import { Err, RequireTeacher, useApiData } from './common'

interface Cls { id: number; name: string; code: string; students: number }

export default function TeacherHome() {
  return <RequireTeacher><Inner /></RequireTeacher>
}

function Inner() {
  const { data, error, reload } = useApiData<{ classes: Cls[] }>('/api/classes')
  const [name, setName] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const create = async (e: FormEvent) => {
    e.preventDefault(); setErr(null)
    try { await api('POST', '/api/classes', { name }); setName(''); reload() } catch (x) { setErr(x instanceof ApiError ? x.message : '失敗') }
  }
  return (
    <div className="space-y-4">
      <h1 className="inline-block rounded-2xl bg-white/90 px-3 text-2xl font-extrabold text-navy-900">教師後台</h1>
      <Err msg={error} />
      <section className="grid gap-3 sm:grid-cols-2">
        {data?.classes.map((c) => (
          <Link key={c.id} to={`/teacher/class/${c.id}`} className="card block hover:border-teal-500">
            <h2 className="text-lg font-extrabold">{c.name}</h2>
            <p className="text-sm">學生 {c.students} 人</p>
            <p className="mt-1 text-sm">班級代碼:<b className="rounded-md bg-sun-400 px-2 font-mono tracking-widest">{c.code}</b></p>
          </Link>
        ))}
        {data && data.classes.length === 0 && <p className="card sm:col-span-2">還沒有班級。先在下面建立一個班級。</p>}
      </section>
      <form onSubmit={create} className="card space-y-2">
        <h2 className="font-bold">建立班級</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} placeholder="例如:技高二甲" className="block w-full rounded-xl border-2 border-navy-800/40 px-3 py-2 min-h-11" />
        <Err msg={err} />
        <button className="btn btn-primary">建立</button>
        <p className="text-xs text-slate-600">建立後會得到「班級代碼」,學生用它自行註冊;你也可以批次建立學生帳號。</p>
      </form>
      <div className="flex flex-wrap gap-2"><Link className="btn btn-ghost" to="/teacher/questions">題目審核與編輯</Link></div>
    </div>
  )
}
