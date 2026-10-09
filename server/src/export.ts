import ExcelJS from 'exceljs'
import type { Attempt } from '../../app/src/core/progress'
import { ERROR_LABELS } from './labels.ts'
import type { BankQ } from './qbank.ts'
import type { StudentRef, classAnalytics, AssignmentProgress } from './analytics.ts'

type Analytics = ReturnType<typeof classAnalytics>
const fmt = (t: number | null) => (t === null ? '' : new Date(t).toLocaleString('zh-TW', { hour12: false, timeZone: 'Asia/Taipei' }))
const pct = (x: number | null) => (x === null ? '' : Math.round(x * 100) / 100)

/** 匯出班級學習紀錄(Excel)。 */
export async function buildWorkbook(opts: {
  className: string; students: StudentRef[]; analytics: Analytics; attempts: Map<number, Attempt[]>; bank: BankQ[]
  assignments: { title: string; questionIds: string[]; due: number | null; progress: AssignmentProgress[] }[]
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = '電子學 I 互動學習平台'
  wb.created = new Date()
  const head = (ws: ExcelJS.Worksheet) => { ws.getRow(1).font = { bold: true }; ws.views = [{ state: 'frozen', ySplit: 1 }] }

  const s1 = wb.addWorksheet('學生總表')
  s1.columns = [
    { header: '姓名', width: 12 }, { header: '帳號', width: 14 }, { header: '已練習題數', width: 12 }, { header: '題庫覆蓋率', width: 12 },
    { header: '首次獨立作答次數', width: 16 }, { header: '首次獨立答對率', width: 14 }, { header: '能獨立答對題數', width: 14 }, { header: '尚未答對題數', width: 14 },
    { header: '遊戲作答次數', width: 12 }, { header: '最後作答時間', width: 20 }, { header: '需補救', width: 8 }, { header: '補救原因', width: 36 }, { header: '常見錯誤', width: 30 },
  ]
  for (const s of opts.analytics.students) {
    s1.addRow([s.name, s.username, s.tried, pct(s.coverage), s.firstTotal, pct(s.firstRate), s.independent, s.stuck, s.gameAttempts, fmt(s.lastActive), s.needsHelp ? '是' : '否', s.helpReasons.join(';'), s.topErrors.map(([k, n]) => `${ERROR_LABELS[k] ?? k} ${n}`).join('、')])
  }
  s1.getColumn(4).numFmt = '0%'; s1.getColumn(6).numFmt = '0%'
  head(s1)

  const s2 = wb.addWorksheet('單元完成率')
  s2.columns = [{ header: '單元', width: 8 }, { header: '題數', width: 8 }, { header: '全班平均「能獨立答對」比例', width: 26 }, { header: '達 80% 的學生數', width: 16 }]
  for (const u of opts.analytics.units) s2.addRow([u.unit, u.questions, pct(u.avgIndependentRatio), u.studentsDone])
  s2.getColumn(3).numFmt = '0%'; head(s2)

  const s3 = wb.addWorksheet('題目分析')
  s3.columns = [{ header: '題目ID', width: 12 }, { header: '單元', width: 8 }, { header: '原始題號', width: 22 }, { header: '作答人數', width: 10 }, { header: '首次作答人次', width: 12 }, { header: '首次答對人次', width: 12 }, { header: '首次答對率', width: 12 }, { header: '最常見錯誤', width: 14 }, { header: '審核狀態', width: 12 }]
  const stat = new Map(opts.analytics.questions.map((x) => [x.id, x]))
  for (const q of opts.bank) { const x = stat.get(q.id)!; s3.addRow([q.id, q.unit, q.label, x.students, x.firstTotal, x.firstCorrect, pct(x.firstRate), x.topError ? (ERROR_LABELS[x.topError] ?? x.topError) : '', STATUS_LABELS[q.status] ?? q.status]) }
  s3.getColumn(7).numFmt = '0%'; head(s3)

  const s4 = wb.addWorksheet('指定練習')
  s4.columns = [{ header: '練習名稱', width: 24 }, { header: '截止', width: 18 }, { header: '姓名', width: 12 }, { header: '帳號', width: 14 }, { header: '題數', width: 8 }, { header: '已答對過', width: 10 }, { header: '能獨立答對', width: 12 }]
  for (const a of opts.assignments) for (const p of a.progress) { const st = opts.students.find((x) => x.id === p.studentId)!; s4.addRow([a.title, fmt(a.due), st.name, st.username, p.total, p.done, p.independent]) }
  head(s4)

  const s5 = wb.addWorksheet('作答紀錄')
  s5.columns = [{ header: '姓名', width: 12 }, { header: '帳號', width: 14 }, { header: '時間', width: 20 }, { header: '類型', width: 8 }, { header: '項目', width: 22 }, { header: '作答方式', width: 16 }, { header: '對錯', width: 6 }, { header: '錯誤類型', width: 14 }]
  const KIND: Record<string, string> = { firstIndependent: '第一次獨立作答', hinted: '使用提示後作答', afterSolution: '閱讀解析後作答', delayedReview: '延宕複習' }
  const SRC: Record<string, string> = { question: '習作題', game: '遊戲', lesson: '教學檢核' }
  let rows = 0
  for (const s of opts.students) for (const a of (opts.attempts.get(s.id) ?? []).slice().sort((x, y) => x.at - y.at)) {
    if (rows++ >= 100000) break
    s5.addRow([s.name, s.username, fmt(a.at), SRC[a.source] ?? a.source, a.itemId, KIND[a.kind] ?? a.kind, a.correct ? '對' : '錯', a.errorType ? (ERROR_LABELS[a.errorType] ?? a.errorType) : ''])
  }
  head(s5)

  const s6 = wb.addWorksheet('說明')
  s6.columns = [{ width: 100 }]
  for (const line of [`班級:${opts.className}`, `匯出時間:${fmt(Date.now())}`, '「首次獨立答對率」只計算第一次獨立作答(未使用提示、未看解析)的結果。', '「能獨立答對」代表曾在不依賴提示與解析的情況下答對。', '需補救條件:首次獨立作答 ≥ 5 次且答對率 < 50%,或有 ≥ 3 題一直沒答對。', '題目審核狀態:待檢查、我方計算已驗證、教師已檢查、需要修正、已正式發布。']) s6.addRow([line])

  return Buffer.from(await wb.xlsx.writeBuffer())
}

export const STATUS_LABELS: Record<string, string> = { pending: '待檢查', calcVerified: '我方計算已驗證', teacherChecked: '教師已檢查', needsFix: '需要修正', published: '已正式發布' }
