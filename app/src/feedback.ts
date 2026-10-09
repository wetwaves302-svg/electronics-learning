import { useSyncExternalStore } from 'react'

/**
 * 回饋系統:音效(WebAudio 合成,不需音檔)、震動、視覺慶祝(由 FeedbackLayer 負責)。
 * 設計原則:答對要有強烈的獎勵感;答錯要柔和,不做出「被懲罰」的感覺;不以速度計分;可一鍵靜音。
 */
const PREF = 'electronics-sound-v1'
const subs = new Set<() => void>()
let on = (() => { try { return localStorage.getItem(PREF) !== 'off' } catch { return true } })()
export const getSoundOn = () => on
export function setSoundOn(v: boolean) {
  on = v
  try { localStorage.setItem(PREF, v ? 'on' : 'off') } catch { /* ignore */ }
  subs.forEach((f) => f())
  if (v) beep(660, 0, 0.08, 'triangle', 0.12) // 開啟時給一個小聲回應
}
export const useSoundOn = () => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb) } }, getSoundOn)

/** 連續答對:只算「沒用提示、沒看解析」的答對;答錯歸零;閒置超過 2 分鐘歸零 */
export const STREAK_IDLE_MS = 120_000
export function nextStreak(prev: number, lastAt: number, now: number, clean: boolean, correct: boolean) {
  if (!correct) return 0
  if (!clean) return prev // 用提示答對:不增加也不中斷
  return (now - lastAt > STREAK_IDLE_MS ? 0 : prev) + 1
}
let streak = 0
let lastAt = 0

let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  if (!on) return null
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx ??= new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch { return null }
}

function beep(freq: number, at: number, dur: number, type: OscillatorType, gain: number, glideTo?: number) {
  const c = audio()
  if (!c) return
  const t0 = c.currentTime + at
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(c.destination)
  o.start(t0)
  o.stop(t0 + dur + 0.02)
}

const semis = (base: number, n: number) => base * Math.pow(2, n / 12)
const vibrate = (p: number | number[]) => { try { if (on) navigator.vibrate?.(p) } catch { /* ignore */ } }

export type FxKind = 'correct' | 'streak' | 'wrong' | 'complete'
export interface FxDetail { kind: FxKind; streak: number }
const emit = (d: FxDetail) => { try { window.dispatchEvent(new CustomEvent<FxDetail>('electronics-fx', { detail: d })) } catch { /* ignore */ } }

export const fx = {
  /** 答對。clean = 沒用提示、沒看解析(才算連續答對) */
  correct(clean = true) {
    const now = Date.now()
    streak = nextStreak(streak, lastAt, now, clean, true)
    lastAt = now
    const up = Math.min(Math.max(streak - 1, 0), 6) * 2 // 連續答對:音階一路升高
    const base = 523.25
    ;[0, 4, 7].forEach((n, i) => beep(semis(base, n + up), i * 0.075, 0.22, 'triangle', 0.2))
    beep(semis(base, 12 + up), 0.24, 0.35, 'sine', 0.16)
    if (streak >= 3) beep(semis(base, 19 + up), 0.34, 0.4, 'sine', 0.1) // 閃亮的高音
    vibrate(streak >= 3 ? [30, 40, 30] : 30)
    emit({ kind: streak >= 3 ? 'streak' : 'correct', streak })
  },
  /** 答錯:柔和的下滑音,不是蜂鳴;歸零連續答對 */
  wrong() {
    streak = nextStreak(streak, lastAt, Date.now(), true, false)
    beep(392, 0, 0.26, 'sine', 0.09, 311)
    vibrate(15)
    emit({ kind: 'wrong', streak: 0 })
  },
  /** 完成一關/一個任務 */
  complete() {
    ;[0, 4, 7, 12, 16].forEach((n, i) => beep(semis(523.25, n), i * 0.09, 0.3, 'triangle', 0.2))
    ;[0, 4, 7, 12].forEach((n) => beep(semis(523.25, n), 0.5, 0.7, 'sine', 0.09))
    vibrate([60, 40, 60, 40, 140])
    emit({ kind: 'complete', streak })
  },
  /** 供測試與重置 */
  _reset() { streak = 0; lastAt = 0 },
}
