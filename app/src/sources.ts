import type { Question } from './data/types'

/** 教材來源。書名與出版者以講義投影片頁尾與習作頁面所載為準。 */
export const SOURCES = {
  slides: { title: '《電子學 I》講義(教學投影片)', publisher: '勁園文化事業股份有限公司、台科大圖書股份有限公司', year: '2013', note: '共 226 頁;本平台使用 1-1~2-3 的內容,其中整流與濾波取自講義 3-1、3-2' },
  workbook: { title: '《電子學(上)習作本詳解》', code: '書號 AC20110', note: '第 1 章、第 2 章;含「歷屆試題」(各題標示統測年度)' },
} as const

/** 題目出處:例如「《電子學(上)習作本詳解》第 1 章 選擇題 7(第 2 頁)」 */
export function sourceLine(q: Question): string {
  if (q.source.file === '教師新增') return `教師自編題(${q.source.label})`
  const ch = q.source.file.match(/第(\d)章/)?.[1]
  return `${SOURCES.workbook.title}第 ${ch ?? '?'} 章 ${q.source.label}(第 ${q.source.page} 頁)`
}

/** 各單元對應的講義頁碼(PDF 頁碼)與習作編號 */
export const UNIT_SOURCES: Record<string, { slides: string; workbook: string }> = {
  '1-1': { slides: '講義 1-1,第 2~10 頁', workbook: '習作第 1 章 1-1' },
  '1-2': { slides: '講義 1-2,第 11~22 頁', workbook: '習作第 1 章 1-2' },
  '2-1': { slides: '講義 2-1,第 23~34 頁', workbook: '習作第 2 章 2-1' },
  '2-2': { slides: '講義 2-2,第 35~52 頁', workbook: '習作第 2 章 2-2' },
  '2-3': { slides: '講義 3-1、3-2(整流與濾波),第 64~99 頁', workbook: '習作第 2 章 2-3(整流濾波)' },
}
