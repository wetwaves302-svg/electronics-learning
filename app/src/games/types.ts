/** 遊戲資料結構。新增章節只需新增資料,不用改引擎。 */
import type { NumericPart } from '../data/types'

export type WaveType = 'sine' | 'cosine' | 'square' | 'triangle' | 'sawtooth' | 'dc' | 'pdc' | 'pulse'

/** 可序列化的波形規格,由 WaveVisual 以公式繪製 */
export interface WaveSpec {
  type: WaveType
  /** 峰值(dc 為直流值;pulse 為高位準) */
  vm: number
  /** 頻率 Hz,預設 1 */
  f?: number
  /** pulse 的工作週期 */
  duty?: number
  /** 顯示方格(像示波器),用於讀圖題 */
  grid?: { tPerDiv: number; vPerDiv: number; xDiv: number; yDiv: number }
}

export type SymbolName = 'diode' | 'resistor' | 'capacitor' | 'transformer' | 'ground' | 'acSource'
export type CircuitName = 'half' | 'centerTap' | 'bridge'

export type Visual =
  | { kind: 'wave'; wave: WaveSpec; label?: string }
  | { kind: 'symbol'; symbol: SymbolName }
  /** 整流電路圖。plain=不顯示導通狀態;v 為輸入瞬時電壓(決定極性標示) */
  | { kind: 'circuit'; circuit: CircuitName; v?: number; plain?: boolean }

export interface ChoiceOption { text?: string; visual?: Visual }

interface ItemBase {
  /** 與習作共用的知識點編號 */
  kp: string
  /** 用於學習成果文字,如「弦波」。第一次不靠提示答對時列入。 */
  can: string
  hint: string
  explain: string
}

export interface ChoiceItem extends ItemBase {
  kind: 'choice'
  prompt: string
  visual?: Visual
  options: ChoiceOption[]
  answer: number
}

export interface CalcItem extends ItemBase {
  kind: 'calc'
  prompt: string
  visual?: Visual
  part: NumericPart
}

export interface PuzzleItem extends ItemBase {
  kind: 'puzzle'
  prompt: string
  /** 正確順序的 token(TeX 片段);畫面上會被固定規則打亂 */
  tokens: string[]
}

export interface MatchPair { left: string; right: string; kp: string; can: string; leftTex?: boolean; rightTex?: boolean }
export interface MatchItem {
  kind: 'match'
  prompt: string
  pairs: MatchPair[]
  hint: string
  explain: string
}

export interface ClassifyThing { text?: string; visual?: Visual; bucket: number; kp: string; can: string }
export interface ClassifyItem {
  kind: 'classify'
  prompt: string
  buckets: string[]
  things: ClassifyThing[]
  hint: string
  explain: string
}

export type GameItem = ChoiceItem | CalcItem | PuzzleItem | MatchItem | ClassifyItem

export type GameKind = 'symbol' | 'formulaMatch' | 'termMatch' | 'classify' | 'figure' | 'puzzle' | 'calc'

export interface GameLevel {
  level: 1 | 2 | 3
  /** 這一關在練什麼(給學生看) */
  goal: string
  items: GameItem[]
}

export interface GameDef {
  id: string
  unit: string
  title: string
  kind: GameKind[]
  blurb: string
  /** 完成後的成果句:例如「能正確辨識」 */
  outcomeVerb: string
  levels: [GameLevel, GameLevel, GameLevel]
}

/** 一關內的「小題」數:配對與分類以配對數/項目數計 */
export function subCount(item: GameItem): number {
  if (item.kind === 'match') return item.pairs.length
  if (item.kind === 'classify') return item.things.length
  return 1
}
