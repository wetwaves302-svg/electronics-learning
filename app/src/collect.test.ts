import { describe, expect, it } from 'vitest'
import { BATCH, decodeBatch, encodeBatch, validConfig } from './collect'
import { parseCsv } from './csv'
import { buildBoard, boardAnalytics, studentDetail } from './board'
import type { Attempt } from './core/progress'

const A = (itemId: string, correct: boolean, kind: Attempt['kind'], at: number, extra: Partial<Attempt> = {}): Attempt => ({ itemId, source: 'question', kps: ['KP-12-03'], correct, kind, at, ...extra })

describe('紀錄編碼', () => {
  it('編碼後可以完整還原(含遊戲、教學檢核、多個知識點、錯誤類型)', () => {
    const list: Attempt[] = [A('WB1-MC-07', false, 'firstIndependent', 1_800_000_000_000, { errorType: 'formulaChoice' }), { itemId: 'G:g12-wave:L1:i0', source: 'game', kps: ['KP-12-09', 'KP-12-01'], correct: true, kind: 'hinted', at: 1_800_000_001_000 }, { itemId: 'LC-12-3', source: 'lesson', kps: [], correct: true, kind: 'delayedReview', at: 1_800_000_002_000 }]
    expect(decodeBatch(encodeBatch(list))).toEqual(list)
  })
  it('壞資料不會讓程式出錯:略過壞列', () => {
    expect(decodeBatch('not json')).toEqual([])
    expect(decodeBatch('{"a":1}')).toEqual([])
    expect(decodeBatch(JSON.stringify([['x', 'q', '', 1, 0, 5], ['y', 'zz', '', 1, 0, 5], ['z', 'q', '', 1, 9, 5], 'bad', ['ok', 'q', 'KP-1', 0, 1, 7, 'unit']]))).toEqual([{ itemId: 'ok', source: 'question', kps: ['KP-1'], correct: false, kind: 'hinted', at: 7, errorType: 'unit' }, { itemId: 'x', source: 'question', kps: [], correct: true, kind: 'firstIndependent', at: 5 }].reverse())
  })
  it('一批的大小在表單欄位可承受範圍內(每批約 20 筆,不到 5 KB)', () => {
    const list = Array.from({ length: BATCH }, (_, i) => A('G:g23-circuit:L3:i4:12', true, 'firstIndependent', 1_800_000_000_000 + i, { kps: ['KP-23-02', 'KP-23-07'], errorType: 'comprehension' }))
    expect(encodeBatch(list).length).toBeLessThan(5000)
  })
  it('設定檔驗證:只接受 Google 表單的 formResponse 網址與 entry.數字', () => {
    const ok = { formAction: 'https://docs.google.com/forms/d/e/1FAIpQLSdAbC_123-xyz/formResponse', entryStudent: 'entry.123456', entryData: 'entry.789012' }
    expect(validConfig(ok)).toBe(true)
    expect(validConfig({ ...ok, formAction: 'https://evil.example.com/forms/d/e/abc/formResponse' })).toBe(false)
    expect(validConfig({ ...ok, formAction: 'http://docs.google.com/forms/d/e/abc/formResponse' })).toBe(false)
    expect(validConfig({ ...ok, entryData: 'x' })).toBe(false)
    expect(validConfig(null)).toBe(false)
    expect(validConfig({})).toBe(false)
  })
})

describe('CSV 解析', () => {
  it('引號、逗號、換行、雙引號跳脫、BOM、CRLF', () => {
    const t = '﻿時間,學生,紀錄\r\n"2026/10/9 上午 9:00:00","二甲 05 王,小明","[[""a"",""q"",""""]]"\r\n"t2","第二位","line1\nline2"\r\n'
    expect(parseCsv(t)).toEqual([['時間', '學生', '紀錄'], ['2026/10/9 上午 9:00:00', '二甲 05 王,小明', '[["a","q",""]]'], ['t2', '第二位', 'line1\nline2']])
  })
  it('空行被略過;沒有結尾換行也能解析', () => {
    expect(parseCsv('a,b\n\nc,d')).toEqual([['a', 'b'], ['c', 'd']])
  })
})

describe('教師看板:由 CSV 還原並分析', () => {
  const row = (who: string, list: Attempt[]) => `"2026/10/9",${JSON.stringify(who)},"${encodeBatch(list).replace(/"/g, '""')}"`
  const csv = ['時間戳記,學生,紀錄',
    row('二甲 05 王小明', [A('WB1-MC-07', false, 'firstIndependent', 1000), A('WB1-MC-08', true, 'firstIndependent', 2000)]),
    row('二甲 05 王小明', [A('WB1-MC-08', true, 'firstIndependent', 2000), A('WB1-MC-07', true, 'hinted', 3000)]), // 重送:應去重
    row('二甲 05 王小明', [A('WB1-MC-07', false, 'firstIndependent', 1000, { errorType: 'unit' })]), // 後補錯誤類型:應採用有類型的那筆
    row('二甲 06 李小華', [A('WB1-MC-07', true, 'firstIndependent', 1500)]),
    '"t","壞列","not json"',
  ].join('\n')
  const q = [{ id: 'WB1-MC-07', unit: '1-2', label: '選擇題 7' }, { id: 'WB1-MC-08', unit: '1-2', label: '選擇題 8' }]
  it('依「項目+時間」去重、保留錯誤類型、計算壞列數', () => {
    const d = buildBoard(csv)
    expect(d.students.map((s) => s.name)).toEqual(['二甲 05 王小明', '二甲 06 李小華'])
    expect(d.rows).toBe(5)
    expect(d.badRows).toBe(1)
    const a = d.attempts.get(1)!
    expect(a).toHaveLength(3)
    expect(a.find((x) => x.itemId === 'WB1-MC-07' && x.at === 1000)!.errorType).toBe('unit')
  })
  it('分析數字與手算一致', () => {
    const d = buildBoard(csv)
    const an = boardAnalytics(d, q)
    const s1 = an.students[0]
    expect([s1.tried, s1.firstTotal, s1.firstCorrect, s1.independent, s1.stuck]).toEqual([2, 2, 1, 1, 0])
    expect(an.students[1].firstRate).toBe(1)
    const q7 = an.questions.find((x) => x.id === 'WB1-MC-07')!
    expect([q7.firstTotal, q7.firstCorrect, q7.topError]).toEqual([2, 1, 'unit'])
    expect(an.commonErrors).toEqual([['unit', 1]])
    const det = studentDetail(d, 1, q)
    expect(det.perQuestion.find((x) => x.id === 'WB1-MC-07')).toMatchObject({ tries: 2, firstCorrect: false, everCorrect: true })
  })
  it('欄位順序不同時,用標題找「學生」「紀錄」欄', () => {
    const d = buildBoard(`紀錄,時間戳記,學生\n"${encodeBatch([A('WB1-MC-07', true, 'firstIndependent', 5)]).replace(/"/g, '""')}",t,小花`)
    expect(d.students[0].name).toBe('小花')
    expect(d.attempts.get(1)).toHaveLength(1)
  })
  it('空檔案、只有標題:不報錯', () => {
    expect(buildBoard('').students).toEqual([])
    expect(buildBoard('時間戳記,學生,紀錄').students).toEqual([])
  })
})

import { configFromPrefilled } from './collect'
describe('設定小幫手', () => {
  const link = 'https://docs.google.com/forms/d/e/1FAIpQLSdAbC_123-xyz/viewform?usp=pp_url&entry.1234567890=STUDENT&entry.987654321=DATA'
  it('由預先填入的連結算出設定', () => {
    expect(configFromPrefilled(link)).toEqual({ formAction: 'https://docs.google.com/forms/d/e/1FAIpQLSdAbC_123-xyz/formResponse', entryStudent: 'entry.1234567890', entryData: 'entry.987654321' })
    expect(configFromPrefilled(link.replace('STUDENT', 'X'))).toBeNull() // 沒填 STUDENT
  })
  it('不是 Google 表單、或欄位順序顛倒也能正確對應', () => {
    expect(configFromPrefilled('https://evil.example.com/forms/d/e/abc/viewform?entry.1=STUDENT&entry.2=DATA')).toBeNull()
    expect(configFromPrefilled('not a url')).toBeNull()
    const swapped = 'https://docs.google.com/forms/d/e/abc123/viewform?entry.2=DATA&entry.1=STUDENT'
    expect(configFromPrefilled(swapped)).toMatchObject({ entryStudent: 'entry.1', entryData: 'entry.2' })
  })
})
