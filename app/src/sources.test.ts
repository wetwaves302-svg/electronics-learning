import { describe, expect, it } from 'vitest'
import { questions } from './data/questions'
import { UNIT_SOURCES, sourceLine } from './sources'
import { units } from './units'

describe('教材來源標註', () => {
  it('每一道題都有完整出處(書名、章、頁、題號)', () => {
    for (const q of questions) {
      const line = sourceLine(q)
      expect(line, q.id).toContain('《電子學(上)習作本詳解》')
      expect(line, q.id).toMatch(/第 [12] 章/)
      expect(line, q.id).toMatch(/第 \d+ 頁/)
      expect(line, q.id).toContain(q.source.label)
    }
  })
  it('章號與題目 ID 一致(WB1 → 第 1 章,WB2 → 第 2 章)', () => {
    for (const q of questions) expect(sourceLine(q)).toContain(q.id.startsWith('WB1') ? '第 1 章' : '第 2 章')
  })
  it('歷屆題的出處含統測年度', () => {
    for (const q of questions.filter((x) => x.id.includes('-PY-'))) expect(q.source.label, q.id).toMatch(/\d{3} 年統測/)
  })
  it('每個單元都有對應的講義與習作來源', () => {
    for (const u of units) { expect(UNIT_SOURCES[u.id].slides).toContain('講義'); expect(UNIT_SOURCES[u.id].workbook).toContain('習作') }
  })
})
