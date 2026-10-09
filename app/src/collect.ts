import type { Attempt, AttemptKind } from './core/progress'
import { getAttempts, onAttemptsChange } from './store'

/**
 * 免伺服器的紀錄收集:學生同意後,練習紀錄會自動送到老師的 Google 表單(再存進老師的 Google 試算表)。
 * 老師把試算表下載成 CSV,拖進「教師看板」就能看到分析。設定檔是 public/config.json。
 */
export interface CollectConfig { formAction: string; entryStudent: string; entryData: string }

const SRC: Record<string, string> = { question: 'q', game: 'g', lesson: 'l' }
const SRC_BACK: Record<string, Attempt['source']> = { q: 'question', g: 'game', l: 'lesson' }
const KINDS: AttemptKind[] = ['firstIndependent', 'hinted', 'afterSolution', 'delayedReview']
export const BATCH = 20

/** 編碼成精簡的 JSON 陣列(欄位順序固定),一批放進表單的一個欄位 */
export function encodeBatch(list: Attempt[]): string {
  return JSON.stringify(list.map((a) => [a.itemId, SRC[a.source] ?? 'q', a.kps.join('+'), a.correct ? 1 : 0, KINDS.indexOf(a.kind), a.at, a.errorType ?? '']))
}

export function decodeBatch(text: string): Attempt[] {
  let raw: unknown
  try { raw = JSON.parse(text) } catch { return [] }
  if (!Array.isArray(raw)) return []
  const out: Attempt[] = []
  for (const r of raw) {
    if (!Array.isArray(r) || r.length < 6) continue
    const [itemId, src, kps, c, k, at, err] = r as [unknown, unknown, unknown, unknown, unknown, unknown, unknown]
    if (typeof itemId !== 'string' || typeof at !== 'number' || !SRC_BACK[String(src)] || typeof k !== 'number' || !KINDS[k]) continue
    out.push({ itemId, source: SRC_BACK[String(src)], kps: typeof kps === 'string' && kps ? kps.split('+') : [], correct: c === 1, kind: KINDS[k], at, ...(typeof err === 'string' && err ? { errorType: err } : {}) })
  }
  return out
}

/* ───────── 學生端:身分、同意、傳送 ───────── */
const ID_KEY = 'electronics-student-v1'
const IDX_KEY = 'electronics-collect-idx-v1'
let config: CollectConfig | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let started = false
const subs = new Set<() => void>()
const notify = () => subs.forEach((f) => f())
export const subscribeCollect = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }

export const getConfig = () => config
export const getIdentity = (): string | null => { try { return localStorage.getItem(ID_KEY) } catch { return null } }
export function setIdentity(label: string) {
  const v = label.trim().slice(0, 40)
  try { if (v) localStorage.setItem(ID_KEY, v); else localStorage.removeItem(ID_KEY) } catch { /* ignore */ }
  try { localStorage.removeItem(IDX_KEY) } catch { /* ignore */ } // 換身分:從頭重送
  notify()
  if (v) schedule(0)
}
const readIdx = () => { try { return Number(localStorage.getItem(IDX_KEY) ?? '0') || 0 } catch { return 0 } }
const writeIdx = (n: number) => { try { localStorage.setItem(IDX_KEY, String(n)) } catch { /* ignore */ } }

export function validConfig(c: unknown): c is CollectConfig {
  const x = c as Partial<CollectConfig> | null
  return !!x && typeof x.formAction === 'string' && /^https:\/\/docs\.google\.com\/forms\/d\/e\/[\w-]+\/formResponse$/.test(x.formAction) && /^entry\.\d+$/.test(x.entryStudent ?? '') && /^entry\.\d+$/.test(x.entryData ?? '')
}

export async function sendNow(): Promise<'ok' | 'offline' | 'none'> {
  const who = getIdentity()
  if (!config || !who) return 'none'
  const all = getAttempts()
  let idx = Math.max(0, Math.min(readIdx(), all.length) - 1) // 多送最後一筆,讓後補的錯誤類型也能更新
  while (idx < all.length) {
    const chunk = all.slice(idx, idx + BATCH)
    try {
      await fetch(config.formAction, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ [config.entryStudent]: who, [config.entryData]: encodeBatch(chunk) }) })
    } catch { return 'offline' }
    idx += chunk.length
    writeIdx(idx)
  }
  return 'ok'
}

function schedule(ms = 2500) { clearTimeout(timer); timer = setTimeout(() => { void sendNow() }, ms) }

export async function startCollect(baseUrl = './') {
  if (started) return
  started = true
  try {
    const res = await fetch(`${baseUrl}config.json`, { cache: 'no-store' })
    const c: unknown = res.ok ? await res.json() : null
    config = validConfig(c) ? c : null
  } catch { config = null }
  notify()
  if (!config) return
  onAttemptsChange(() => schedule())
  const flush = () => { if (document.visibilityState === 'hidden') { clearTimeout(timer); void sendNow() } }
  document.addEventListener('visibilitychange', flush)
  window.addEventListener('pagehide', flush)
  schedule(1000)
}

/**
 * 設定小幫手:老師在表單的「學生」欄填 STUDENT、「紀錄」欄填 DATA,取得「預先填入的連結」貼進來,
 * 就能算出 config.json 的內容。
 */
export function configFromPrefilled(link: string): CollectConfig | null {
  try {
    const u = new URL(link.trim())
    const id = u.pathname.match(/^\/forms\/d\/e\/([\w-]+)\//)?.[1]
    if (u.hostname !== 'docs.google.com' || !id) return null
    let entryStudent = '', entryData = ''
    for (const [k, v] of u.searchParams) {
      if (/^entry\.\d+$/.test(k) && v === 'STUDENT') entryStudent = k
      if (/^entry\.\d+$/.test(k) && v === 'DATA') entryData = k
    }
    const c = { formAction: `https://docs.google.com/forms/d/e/${id}/formResponse`, entryStudent, entryData }
    return validConfig(c) ? c : null
  } catch { return null }
}
