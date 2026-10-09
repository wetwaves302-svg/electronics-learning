import type { Question } from './data/types'
import { kpById } from './data/knowledgePoints'

/**
 * 三層提示。第一版由知識點資料與解析自動組成;日後可在題目資料加入 hints 覆寫。
 * 第一層:提醒概念;第二層:指出適用原理或公式;第三層:帶出目前這一步的做法。
 */
export function hintsFor(q: Question): [string, string, string] {
  const kp = kpById(q.kps[0])
  const firstStep = q.solution.split(/[。;]/).map((x) => x.trim()).filter(Boolean)[0] ?? q.solution
  return [
    `先想一想:這題考的是「${kp?.title ?? '本單元觀念'}」。題目給了哪些已知條件?要求的是什麼?`,
    kp ? `可用的原理:${kp.summary}` : '回想本單元的公式與定義。',
    `第一步可以這樣做:${firstStep}。`,
  ]
}
