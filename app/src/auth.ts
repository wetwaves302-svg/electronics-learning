import { useSyncExternalStore } from 'react'
import { api, ApiError, getToken, setToken } from './api'
import { adoptAnonymousAttempts, anonymousAttemptCount, switchStore } from './store'
import { startSync, stopSync, syncNow } from './sync'

export interface User { id: number; username: string; name: string; role: 'teacher' | 'student'; classId: number | null }
interface AuthState { user: User | null; loading: boolean }
let state: AuthState = { user: null, loading: !!getToken() }
const subs = new Set<() => void>()
const set = (s: AuthState) => { state = s; subs.forEach((f) => f()) }

function enter(user: User) {
  switchStore(user.id)
  set({ user, loading: false })
  if (user.role === 'student') startSync(user.id)
}

/** 啟動時用已存的 token 還原登入狀態 */
export async function restoreSession() {
  if (!getToken()) { set({ user: null, loading: false }); return }
  try {
    const r = await api<{ user: User }>('GET', '/api/me')
    enter(r.user)
  } catch (e) {
    if (e instanceof ApiError && e.status === 0) { set({ user: null, loading: false }); return } // 伺服器連不上:保留 token,以未登入的純前端模式使用
    setToken(null)
    set({ user: null, loading: false })
  }
}

export async function login(username: string, password: string): Promise<User> {
  const r = await api<{ token: string; user: User }>('POST', '/api/auth/login', { username, password })
  setToken(r.token)
  enter(r.user)
  return r.user
}

export async function registerStudent(input: { classCode: string; username: string; password: string; name: string }): Promise<User> {
  const r = await api<{ token: string; user: User }>('POST', '/api/auth/register-student', input)
  setToken(r.token)
  enter(r.user)
  return r.user
}

export async function logout() {
  try { await syncNow() } catch { /* 離線時略過 */ }
  try { await api('POST', '/api/auth/logout') } catch { /* ignore */ }
  setToken(null)
  stopSync()
  switchStore(null)
  set({ user: null, loading: false })
}

/** 登入後詢問是否把這台裝置上登入前的紀錄加入帳號 */
export function offerAdoptAnonymous() {
  const n = anonymousAttemptCount()
  if (n > 0 && confirm(`這台裝置上有 ${n} 筆登入前的練習紀錄。要加入你的帳號嗎?(選「取消」則保留在這台裝置,不加入)`)) adoptAnonymousAttempts()
}

export const useAuth = () => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb) } }, () => state)
