import { useSyncExternalStore } from 'react'
import type { Attempt } from './core/progress'

/**
 * 學習紀錄儲存(本機)。未登入時存在 'electronics-attempts-v1';登入後每個帳號有自己的一份,
 * 避免共用裝置時紀錄混在一起。登入的學生會把紀錄同步到伺服器(見 sync.ts)。
 */
const ANON_KEY = 'electronics-attempts-v1'
let key = ANON_KEY
let cache: Attempt[] | null = null
const listeners = new Set<() => void>()
const changeHooks = new Set<() => void>()

function load(): Attempt[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(key)
    cache = raw ? (JSON.parse(raw) as Attempt[]) : []
  } catch {
    cache = []
  }
  return cache
}

const persist = () => {
  try { localStorage.setItem(key, JSON.stringify(cache)) } catch { /* 儲存失敗時仍保留於記憶體 */ }
  listeners.forEach((l) => l())
  changeHooks.forEach((h) => h())
}

export function addAttempt(a: Attempt) { cache = [...load(), a]; persist() }

/** 為最近一筆紀錄補上錯誤類型(學生自述卡關原因後) */
export function tagLastAttempt(errorType: string) {
  const list = load()
  if (list.length === 0) return
  cache = [...list.slice(0, -1), { ...list[list.length - 1], errorType }]
  persist()
}

export function clearAttempts() { cache = []; persist() }

export const getAttempts = () => load()
export const onAttemptsChange = (h: () => void) => { changeHooks.add(h); return () => { changeHooks.delete(h) } }

/** 切換使用者:改用該帳號自己的本機紀錄 */
export function switchStore(userId: number | null) {
  key = userId === null ? ANON_KEY : `${ANON_KEY}:u${userId}`
  cache = null
  listeners.forEach((l) => l())
}

/** 把未登入時的紀錄移到目前帳號(並清掉未登入紀錄) */
export function adoptAnonymousAttempts(): number {
  let anon: Attempt[] = []
  try { anon = JSON.parse(localStorage.getItem(ANON_KEY) ?? '[]') as Attempt[] } catch { /* ignore */ }
  if (anon.length === 0) return 0
  mergeAttempts(anon)
  try { localStorage.removeItem(ANON_KEY) } catch { /* ignore */ }
  return anon.length
}
export const anonymousAttemptCount = () => { try { return (JSON.parse(localStorage.getItem(ANON_KEY) ?? '[]') as Attempt[]).length } catch { return 0 } }

/** 合併外來紀錄(依 itemId + at 去重) */
export function mergeAttempts(incoming: Attempt[]) {
  const have = new Set(load().map((a) => `${a.itemId}|${a.at}`))
  const add = incoming.filter((a) => !have.has(`${a.itemId}|${a.at}`))
  if (add.length === 0) return
  cache = [...load(), ...add].sort((a, b) => a.at - b.at)
  persist()
}

export function useAttempts(): Attempt[] {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => { listeners.delete(cb) } }, load)
}
