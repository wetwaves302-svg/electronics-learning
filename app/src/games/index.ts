import { games11 } from './data/game11'
import { games12 } from './data/game12'
import { games21 } from './data/game21'
import { games22 } from './data/game22'
import { games23 } from './data/game23'
import type { GameDef } from './types'

/** 新增章節的遊戲:建立資料檔後加進這裡即可 */
export const games: GameDef[] = [...games11, ...games12, ...games21, ...games22, ...games23]
export const gameById = (id: string) => games.find((g) => g.id === id)
