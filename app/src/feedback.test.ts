import { describe, expect, it } from 'vitest'
import { STREAK_IDLE_MS, nextStreak } from './feedback'

describe('連續答對的計算', () => {
  it('乾淨答對(沒用提示、沒看解析)累計;答錯歸零', () => {
    let s = 0, t = 1000
    for (let i = 1; i <= 4; i++) { s = nextStreak(s, t, t + 1000, true, true); t += 1000; expect(s).toBe(i) }
    expect(nextStreak(s, t, t + 1000, true, false)).toBe(0)
  })
  it('用提示後答對:不增加也不中斷連續', () => {
    expect(nextStreak(3, 1000, 2000, false, true)).toBe(3)
  })
  it('閒置超過 2 分鐘,連續從頭算', () => {
    expect(nextStreak(5, 0, STREAK_IDLE_MS + 1, true, true)).toBe(1)
    expect(nextStreak(5, 0, STREAK_IDLE_MS, true, true)).toBe(6)
  })
})
