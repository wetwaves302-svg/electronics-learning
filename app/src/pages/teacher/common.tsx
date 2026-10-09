import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../../api'
import { useAuth } from '../../auth'

export function RequireTeacher({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="card">載入中…</p>
  if (!user || user.role !== 'teacher') return <p className="card">這個頁面只給教師使用。<Link className="underline" to="/login">請先以教師帳號登入</Link></p>
  return <>{children}</>
}

export function useApiData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!path) return
    let alive = true
    setError(null)
    api<T>('GET', path).then((d) => { if (alive) setData(d) }).catch((e) => { if (alive) setError(e instanceof ApiError ? e.message : '載入失敗') })
    return () => { alive = false }
  }, [path, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, error, reload }
}

export const pct = (x: number | null | undefined) => (x === null || x === undefined ? '—' : `${Math.round(x * 100)}%`)
export const when = (t: number | null) => (t ? new Date(t).toLocaleString('zh-TW', { hour12: false, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
export const Err = ({ msg }: { msg: string | null }) => (msg ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{msg}</p> : null)
export const Wrap = ({ children }: { children: ReactNode }) => <div className="overflow-x-auto">{children}</div>
export const Th = ({ children }: { children?: ReactNode }) => <th className="whitespace-nowrap bg-sun-100 px-2 py-1 text-left text-xs">{children}</th>
export const Td = ({ children, className = '' }: { children: ReactNode; className?: string }) => <td className={`whitespace-nowrap border-t border-navy-800/10 px-2 py-1 text-sm ${className}`}>{children}</td>
export const STATUS_LABEL: Record<string, string> = { pending: '待檢查', calcVerified: '我方計算已驗證', teacherChecked: '教師已檢查', needsFix: '需要修正', published: '已正式發布' }
export const STATUS_COLOR: Record<string, string> = { pending: 'bg-slate-100 text-slate-700', calcVerified: 'bg-sky-100 text-navy-800', teacherChecked: 'bg-teal-100 text-green-900', needsFix: 'bg-red-100 text-red-800', published: 'bg-green-200 text-green-900' }
export const Badge = ({ s }: { s: string }) => <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[s] ?? ''}`}>{STATUS_LABEL[s] ?? s}</span>
export const Back = ({ to, children }: { to: string; children: ReactNode }) => <Link to={to} className="inline-block rounded-full border-2 border-navy-800 bg-white px-3 py-1 text-sm font-bold text-navy-800">← {children}</Link>
