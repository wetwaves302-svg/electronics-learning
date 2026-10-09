import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, offerAdoptAnonymous, registerStudent, useAuth } from '../auth'
import { ApiError } from '../api'

type Mode = 'student' | 'register' | 'teacher'

export default function Login() {
  if (import.meta.env.VITE_STATIC === '1') return <p className="card">這個版本是單機版,不需要登入。你的練習紀錄只會存在這台裝置的瀏覽器裡。</p>
  return <LoginForm />
}

function LoginForm() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [mode, setMode] = useState<Mode>('student')
  const [f, setF] = useState({ username: '', password: '', classCode: '', name: '' })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  if (user) return <p className="card">已登入為 <b>{user.name || user.username}</b>。<button className="underline" onClick={() => nav(user.role === 'teacher' ? '/teacher' : '/')}>前往</button></p>

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null); setBusy(true)
    try {
      const u = mode === 'register' ? await registerStudent({ classCode: f.classCode.trim(), username: f.username.trim(), password: f.password, name: f.name.trim() }) : await login(f.username.trim(), f.password)
      if (u.role === 'student') offerAdoptAnonymous()
      nav(u.role === 'teacher' ? '/teacher' : '/')
    } catch (e2) {
      setErr(e2 instanceof ApiError ? (e2.status === 0 ? '連不到伺服器。目前仍可不登入使用,紀錄只會存在這台裝置。' : e2.message) : '發生錯誤')
    } finally { setBusy(false) }
  }

  const tab = (m: Mode, label: string) => <button type="button" aria-pressed={mode === m} onClick={() => { setMode(m); setErr(null) }} className={`btn text-sm flex-1 ${mode === m ? 'btn-sun' : 'btn-ghost'}`}>{label}</button>
  const input = (label: string, k: keyof typeof f, type = 'text', hint?: string) => (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input type={type} value={f[k]} onChange={set(k)} autoComplete={k === 'password' ? (mode === 'register' ? 'new-password' : 'current-password') : 'username'} required className="block w-full rounded-xl border-2 border-navy-800/40 px-3 py-2 min-h-11" />
      {hint && <span className="text-xs text-slate-600">{hint}</span>}
    </label>
  )
  return (
    <div className="mx-auto max-w-md space-y-3">
      <h1 className="inline-block rounded-2xl bg-white/90 px-3 text-2xl font-extrabold text-navy-900">登入</h1>
      <div className="flex gap-2" role="tablist">{tab('student', '學生登入')}{tab('register', '學生註冊')}{tab('teacher', '教師登入')}</div>
      <form onSubmit={submit} className="card space-y-3">
        {mode === 'register' && input('班級代碼', 'classCode', 'text', '由老師提供,6 個英數字')}
        {input('帳號', 'username')}
        {mode === 'register' && input('姓名(選填)', 'name')}
        {input('密碼', 'password', 'password', mode === 'register' ? '至少 6 個字元' : undefined)}
        {err && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? '請稍候…' : mode === 'register' ? '建立帳號' : '登入'}</button>
      </form>
      <p className="rounded-2xl bg-white/90 p-3 text-xs">不登入也可以使用全部的教學、遊戲與練習,紀錄只會存在這台裝置。登入後紀錄會同步到伺服器,老師可以看到你的學習情形,換裝置也不會不見。</p>
    </div>
  )
}
