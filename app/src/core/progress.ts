/**
 * 學習紀錄邏輯(純函式,可測試)。
 * 重點:區分「曾經答對」與「不依賴提示即可答對」,閱讀解析後的答對不算精熟。
 */

export type AttemptKind =
  | 'firstIndependent' // 第一次獨立作答(未用提示、未看解析)
  | 'hinted' // 使用提示後作答
  | 'afterSolution' // 閱讀解析後重新作答
  | 'delayedReview' // 延宕複習作答(未用提示)

export interface Attempt {
  /** 題目 ID 或遊戲題 ID */
  itemId: string
  /** 'question' 或 'game' */
  source: 'question' | 'game' | 'lesson'
  kps: string[]
  correct: boolean
  kind: AttemptKind
  /** 毫秒時間戳 */
  at: number
  /** 錯誤時的錯誤類型 */
  errorType?: string
}

export type Mastery = 'unseen' | 'attempted' | 'everCorrect' | 'independent' | 'retained'

export const MASTERY_LABEL: Record<Mastery, string> = {
  unseen: '尚未練習',
  attempted: '練習中(尚未答對)',
  everCorrect: '曾經答對(需提示或看過解析)',
  independent: '能獨立答對',
  retained: '隔一段時間仍答對',
}

const DAY = 86_400_000
/** 延宕複習間隔(天)。答對進入下一級,答錯退回第一級 */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14]

/** 單一項目(題目)的狀態 */
export function itemMastery(attempts: Attempt[]): Mastery {
  if (attempts.length === 0) return 'unseen'
  const sorted = [...attempts].sort((a, b) => a.at - b.at)
  const independentCorrect = sorted.find((a) => a.correct && (a.kind === 'firstIndependent' || a.kind === 'delayedReview'))
  if (independentCorrect) {
    const retained = sorted.some(
      (a) => a.correct && a.kind === 'delayedReview' && a.at - independentCorrect.at >= DAY,
    )
    return retained ? 'retained' : 'independent'
  }
  if (sorted.some((a) => a.correct)) return 'everCorrect'
  return 'attempted'
}

export interface KpStats {
  kp: string
  mastery: Mastery
  items: number
  /** 首次獨立作答次數與答對次數 */
  firstTotal: number
  firstCorrect: number
  /** 曾經答對的項目數 */
  everCorrectItems: number
  independentItems: number
}

/** 知識點掌握度:以「不同項目」的獨立答對數判斷,避免同一題重複刷 */
export function kpStats(kp: string, attempts: Attempt[]): KpStats {
  const rel = attempts.filter((a) => a.kps.includes(kp))
  const byItem = new Map<string, Attempt[]>()
  for (const a of rel) byItem.set(a.itemId, [...(byItem.get(a.itemId) ?? []), a])
  const masteries = [...byItem.values()].map(itemMastery)
  const independentItems = masteries.filter((m) => m === 'independent' || m === 'retained').length
  const everCorrectItems = masteries.filter((m) => m !== 'attempted' && m !== 'unseen').length
  const firsts = rel.filter((a) => a.kind === 'firstIndependent')
  let mastery: Mastery = 'unseen'
  if (rel.length > 0) mastery = 'attempted'
  if (everCorrectItems > 0) mastery = 'everCorrect'
  if (independentItems >= 2) mastery = 'independent'
  if (masteries.some((m) => m === 'retained') && independentItems >= 2) mastery = 'retained'
  return {
    kp,
    mastery,
    items: byItem.size,
    firstTotal: firsts.length,
    firstCorrect: firsts.filter((a) => a.correct).length,
    everCorrectItems,
    independentItems,
  }
}

/** 下一次複習時間:依連續答對的獨立/複習次數決定間隔;最近一次答錯則 1 天後再來 */
export function nextReviewAt(attempts: Attempt[]): number | null {
  const sorted = [...attempts].sort((a, b) => a.at - b.at)
  if (sorted.length === 0) return null
  const last = sorted[sorted.length - 1]
  // 只有獨立型作答(首次或延宕複習)的正確才累計間隔級數
  let level = -1
  for (const a of sorted) {
    if (a.kind === 'firstIndependent' || a.kind === 'delayedReview') {
      level = a.correct ? Math.min(level + 1, REVIEW_INTERVALS_DAYS.length - 1) : -1
    } else if (!a.correct) {
      level = -1
    }
  }
  const days = REVIEW_INTERVALS_DAYS[Math.max(level, 0)]
  return last.at + days * DAY
}

export const isDue = (attempts: Attempt[], now: number) => {
  const n = nextReviewAt(attempts)
  return n !== null && n <= now
}

/** 常見錯誤類型統計 */
export function errorCounts(attempts: Attempt[]) {
  const out: Record<string, number> = {}
  for (const a of attempts) if (!a.correct && a.errorType) out[a.errorType] = (out[a.errorType] ?? 0) + 1
  return out
}

/* ───────── 錯題本(自動蒐集,學生不需要手動收藏) ───────── */

export type WrongReason = 'never' | 'hintOnly' | 'relapse'
export interface WrongItem {
  itemId: string
  reason: WrongReason
  /** 最近一次答錯的時間 */
  lastWrongAt: number
  /** 最近一次答錯的錯誤類型(若有) */
  errorType?: string
  wrongCount: number
}
export const WRONG_REASON_LABEL: Record<WrongReason, string> = {
  never: '還沒答對過',
  hintOnly: '用了提示或看過解析才答對,還沒獨立答對',
  relapse: '之前會了,但後來又答錯',
}

const INDEPENDENT_KINDS = ['firstIndependent', 'delayedReview']
/** 複習冷卻:剛答完(或剛看完解析)不久就立刻重答,不算獨立答對 */
export const REVIEW_COOLDOWN_MS = 10 * 60 * 1000

/**
 * 錯題判定:這題曾經答錯,而且「答錯之後」還沒有一次獨立(未用提示、未看解析)的答對。
 * 自評題(selfCheckIds)無法客觀判定獨立答對,答錯後只要有一次較晚的答對就移出。
 * 只看「習作題」(itemIds 限定在題庫內),不含教練步驟、遊戲、教學檢核與變化題。
 */
export function wrongBook(attempts: Attempt[], questionIds: Set<string>, selfCheckIds: Set<string> = new Set()): WrongItem[] {
  const by = new Map<string, Attempt[]>()
  for (const a of attempts) if (a.source === 'question' && questionIds.has(a.itemId)) (by.get(a.itemId) ?? by.set(a.itemId, []).get(a.itemId)!).push(a)
  const out: WrongItem[] = []
  for (const [itemId, list] of by) {
    const as = [...list].sort((x, y) => x.at - y.at)
    const wrongs = as.filter((a) => !a.correct)
    if (wrongs.length === 0) continue
    const lastWrong = wrongs[wrongs.length - 1]
    const clears = (a: Attempt) => a.correct && a.at > lastWrong.at && (INDEPENDENT_KINDS.includes(a.kind) || selfCheckIds.has(itemId))
    if (as.some(clears)) continue
    const correctBefore = as.some((a) => a.correct && INDEPENDENT_KINDS.includes(a.kind) && a.at < lastWrong.at)
    const anyCorrect = as.some((a) => a.correct)
    out.push({ itemId, reason: correctBefore ? 'relapse' : anyCorrect ? 'hintOnly' : 'never', lastWrongAt: lastWrong.at, errorType: lastWrong.errorType, wrongCount: wrongs.length })
  }
  return out
}

/** 錯題練習的出題順序:沒答對過 → 後來又錯 → 靠提示答對;同類型依最近答錯優先。冷卻中的題目排到最後。 */
export function orderWrongBook(items: WrongItem[], lastAttemptAt: Map<string, number>, now: number): WrongItem[] {
  const rank: Record<WrongReason, number> = { never: 0, relapse: 1, hintOnly: 2 }
  const cooling = (i: WrongItem) => now - (lastAttemptAt.get(i.itemId) ?? 0) < REVIEW_COOLDOWN_MS
  return [...items].sort((a, b) => Number(cooling(a)) - Number(cooling(b)) || rank[a.reason] - rank[b.reason] || b.lastWrongAt - a.lastWrongAt)
}
