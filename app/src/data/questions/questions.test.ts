import { describe, expect, it } from 'vitest'
import { questions } from './index'
import { knowledgePoints } from '../knowledgePoints'
import answerKey from '../workbookAnswerKey.json'
import { judgeNumeric } from '../../core/answer'
import { games } from '../../games'

/** 習作範圍內題目清單(盤點報告 C):1-1～2-3 整流濾波,共 49 題 */
const IN_SCOPE = [
  ...Array.from({ length: 20 }, (_, i) => `WB1-MC-${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 5 }, (_, i) => `WB1-QA-0${i + 1}`),
  ...Array.from({ length: 4 }, (_, i) => `WB1-PY-0${i + 1}`),
  ...Array.from({ length: 12 }, (_, i) => `WB2-MC-${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 3 }, (_, i) => `WB2-QA-0${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `WB2-PY-0${i + 1}`),
]

describe('題庫完整性', () => {
  it('涵蓋範圍內全部 49 題,無缺漏、無範圍外題目', () => {
    expect(IN_SCOPE).toHaveLength(49)
    expect(questions.map((q) => q.id).sort()).toEqual([...IN_SCOPE].sort())
  })
  it('ID 唯一', () => expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length))
  it('每題都有來源頁碼與知識點,且知識點存在', () => {
    const kpIds = new Set(knowledgePoints.map((k) => k.id))
    for (const q of questions) {
      expect(q.source.page, q.id).toBeGreaterThan(0)
      expect(q.kps.length, q.id).toBeGreaterThan(0)
      for (const k of q.kps) expect(kpIds.has(k), `${q.id} → ${k}`).toBe(true)
    }
  })
  it('每個知識點的先修知識點存在,且不形成環', () => {
    const byId = new Map(knowledgePoints.map((k) => [k.id, k]))
    for (const k of knowledgePoints) for (const p of k.prereq) expect(byId.has(p), `${k.id} → ${p}`).toBe(true)
    const visiting = new Set<string>()
    const done = new Set<string>()
    const visit = (id: string) => {
      if (done.has(id)) return
      expect(visiting.has(id), `cycle at ${id}`).toBe(false)
      visiting.add(id)
      for (const p of byId.get(id)!.prereq) visit(p)
      visiting.delete(id)
      done.add(id)
    }
    knowledgePoints.forEach((k) => visit(k.id))
  })
  it('單元的每個知識點都被至少一題習作題或遊戲使用', () => {
    const gameKps = games.flatMap((g) => g.levels.flatMap((l) => l.items.flatMap((it) => (it.kind === 'match' ? it.pairs.map((p) => p.kp) : it.kind === 'classify' ? it.things.map((t) => t.kp) : [it.kp]))))
    const used = new Set([...questions.flatMap((q) => q.kps), ...gameKps])
    const unused = knowledgePoints.filter((k) => !used.has(k.id)).map((k) => k.id)
    // KP-12-… 全數應被題庫覆蓋;已知題庫未涵蓋者交由遊戲補足
    expect(unused).toEqual([])
  })
  it('範圍內 49 題全部都有七步驟教練(六步驟 + 遷移練習產生器)', () => {
    const missing = questions.filter((q) => !q.coach || !q.variant).map((q) => q.id)
    expect(missing).toEqual([])
    expect(questions.filter((q) => q.coach && q.variant)).toHaveLength(49)
  })
  it('有圖的題目都註明圖的 ID', () => {
    for (const q of questions) if (q.figure) expect(q.figure).toMatch(/^wb[12]-/)
  })
  it('第一版不得有任何題目標為 published 或 teacherChecked', () => {
    for (const q of questions) expect(['pending', 'calcVerified']).toContain(q.review)
  })
})

describe('標準答案與習作原書一致', () => {
  const key = answerKey as Record<string, number>
  it('選擇題答案與 PDF 文字層抽出的答案相同', () => {
    for (const q of questions) {
      if (q.type !== 'mc') continue
      expect(key[q.id], `${q.id} 無對照答案`).toBeDefined()
      expect(q.answer, q.id).toBe(key[q.id])
    }
  })
  it('選擇題答案索引在選項範圍內,且恰有 4 個選項', () => {
    for (const q of questions) {
      if (q.type !== 'mc') continue
      expect(q.options).toHaveLength(4)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(4)
    }
  })
  it('數值題的標準答案可被判定器接受', () => {
    for (const q of questions) {
      if (q.type !== 'numeric') continue
      for (const p of q.parts) {
        expect(judgeNumeric(`${p.value}${p.unit}`, p).ok, `${q.id} ${p.label}`).toBe(true)
      }
    }
  })
})
