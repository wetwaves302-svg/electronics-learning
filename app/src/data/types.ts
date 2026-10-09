/** 題庫與教學資料結構。內容皆為資料,不寫死在元件裡。 */

export type UnitId = '1-1' | '1-2' | '2-1' | '2-2' | '2-3'

/** 審核狀態:第一版不自動標為 published */
export type ReviewStatus = 'pending' | 'calcVerified' | 'teacherChecked' | 'needsFix' | 'published'

export interface KnowledgePoint {
  id: string
  unit: UnitId
  title: string
  /** 簡短說明,用於遊戲與診斷 */
  summary: string
  /** 先修知識點 */
  prereq: string[]
}

export interface Source {
  file: string
  /** 習作印刷頁碼 */
  page: number
  /** 原始題號,如「選擇題 7」「歷屆 108 年統測 1」 */
  label: string
}

export type ErrorType =
  | 'concept' | 'component' | 'direction' | 'formulaChoice' | 'substitution'
  | 'arithmetic' | 'unit' | 'comprehension' | 'unknown'

export interface McOption {
  text: string
  /** 選此項時最可能的錯誤類型;不確定則省略,由系統追問 */
  errorType?: ErrorType
}

export interface NumericPart {
  label: string
  /** 標準答案(基本單位) */
  value: number
  unit: string
  relTol?: number
}

export type StepId = 'read' | 'analyze' | 'principle' | 'formula' | 'compute' | 'verify' | 'transfer'

export interface CoachAsk {
  prompt: string
  options: string[]
  answer: number
  /** 為什麼這樣選(也說明其他選項錯在哪) */
  why: string
}

/** 七步驟中前六步;第 7 步「遷移練習」由 variant 產生器提供 */
export interface CoachStep {
  id: Exclude<StepId, 'transfer'>
  title: string
  teach: string
  ask: CoachAsk
  commonMistake: string
  hints: [string, string, string]
  /** 可展開的數學輔助(KaTeX 或純文字),說明為什麼這樣運算 */
  math?: { title: string; tex?: string; text: string }[]
}

export type VariantQ =
  | { stem: string; part: NumericPart }
  | { stem: string; options: string[]; answer: number; why: string }

export interface Variant {
  /** 由種子決定題目(固定演算法,非隨機),答案由計算核心算出或由資料池指定 */
  make: (seed: number) => VariantQ
}

interface QBase {
  id: string
  unit: UnitId
  source: Source
  kps: string[]
  stem: string
  /** 電路圖或波形圖的元件 ID(由 figures 註冊);沒有則省略 */
  figure?: string
  /** 原圖需對照的說明 */
  figureNote?: string
  solution: string
  review: ReviewStatus
  /** 相似題 ID */
  related?: string[]
  /** 該題的解析是否由我方補寫(非原習作提供) */
  solutionAuthoredByUs?: boolean
  /** 教師修訂過(含新增題)的版本號;未修訂為 undefined */
  teacherVersion?: number
  coach?: CoachStep[]
  variant?: Variant
}

export interface McQuestion extends QBase {
  type: 'mc'
  options: McOption[]
  answer: number
}

export interface NumericQuestion extends QBase {
  type: 'numeric'
  parts: NumericPart[]
}

/** 開放式作答(寫瞬時式、分類說明等):不自動評分,使用自評對照 */
export interface OpenQuestion extends QBase {
  type: 'open'
  modelAnswer: string
  /** 自評檢核項 */
  checklist: string[]
}

export type Question = McQuestion | NumericQuestion | OpenQuestion
