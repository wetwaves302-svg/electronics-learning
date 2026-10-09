import { api, ApiError } from './api'
import { getAttempts, mergeAttempts, onAttemptsChange } from './store'
import type { Attempt } from './core/progress'

/** 登入的學生:把本機紀錄同步到伺服器。伺服器以(帳號, 項目, 時間)去重,重複送出沒有關係。 */
const syncKey = (uid: number) => `electronics-synced-v1:u${uid}`
let uid: number | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let off: (() => void) | undefined
let offVis: (() => void) | undefined
export type SyncState = 'idle' | 'syncing' | 'ok' | 'offline' | 'error'
let state: SyncState = 'idle'
const subs = new Set<(s: SyncState) => void>()
const setState = (s: SyncState) => { state = s; subs.forEach((f) => f(s)) }
export const getSyncState = () => state
export const subscribeSync = (f: (s: SyncState) => void) => { subs.add(f); return () => { subs.delete(f) } }

const readIdx = (id: number) => { try { return Number(localStorage.getItem(syncKey(id)) ?? '0') || 0 } catch { return 0 } }
const writeIdx = (id: number, n: number) => { try { localStorage.setItem(syncKey(id), String(n)) } catch { /* ignore */ } }

export async function syncNow(): Promise<void> {
  if (uid === null) return
  const all = getAttempts()
  // 多送最後一筆已同步的紀錄,讓後補的錯誤類型也能更新
  const from = Math.max(0, Math.min(readIdx(uid), all.length) - 1)
  const pending = all.slice(from)
  if (pending.length === 0) { setState('ok'); return }
  setState('syncing')
  try {
    for (let i = 0; i < pending.length; i += 1000) await api('POST', '/api/attempts/sync', { attempts: pending.slice(i, i + 1000) })
    writeIdx(uid, all.length)
    setState('ok')
  } catch (e) {
    setState(e instanceof ApiError && e.status === 0 ? 'offline' : 'error')
  }
}

export function startSync(userId: number) {
  stopSync()
  uid = userId
  off = onAttemptsChange(() => { clearTimeout(timer); timer = setTimeout(() => { void syncNow() }, 1500) })
  // 分頁被隱藏或關閉時立刻同步,避免最後幾筆來不及送出
  const flush = () => { if (document.visibilityState === 'hidden') { clearTimeout(timer); void syncNow() } }
  document.addEventListener('visibilitychange', flush)
  window.addEventListener('pagehide', flush)
  offVis = () => { document.removeEventListener('visibilitychange', flush); window.removeEventListener('pagehide', flush) }
  // 先拉取伺服器上已有的紀錄(換裝置時),再把本機的送上去
  void api<{ attempts: Attempt[] }>('GET', '/api/attempts/mine')
    .then((r) => { mergeAttempts(r.attempts) })
    .catch(() => undefined)
    .finally(() => { writeIdx(userId, Math.max(0, readIdx(userId))); void syncNow() })
}

export function stopSync() { off?.(); off = undefined; offVis?.(); offVis = undefined; clearTimeout(timer); uid = null; setState('idle') }
