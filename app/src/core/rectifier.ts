import { solveCircuit, type Element, type Solution } from './circuit'

export type RectifierKind = 'half' | 'centerTap' | 'bridge'

export const RECTIFIER_NAME: Record<RectifierKind, string> = {
  half: '半波整流', centerTap: '中心抽頭全波整流', bridge: '橋式全波整流',
}

/**
 * 以次級電壓瞬時值 v(相對於次級參考)建立整流電路:
 * - half:次級 v → 二極體 D1 → 負載 RL → 地
 * - centerTap:中心抽頭接地,上半邊 +v、下半邊 −v,D1、D2 陰極共接負載
 * - bridge:四個二極體,負載 + 端為 p、− 端為 q(接地);編號與習作選擇題 9 的圖相同
 *   D1:a→p、D2:b→p、D3:q→b、D4:q→a
 * centerTap 的 v 指「每半邊」電壓。
 */
export function rectifierNetlist(kind: RectifierKind, v: number, rl: number): { els: Element[]; nodes: number } {
  switch (kind) {
    case 'half':
      return {
        nodes: 3,
        els: [
          { type: 'V', id: 'Vs', a: 1, b: 0, v },
          { type: 'D', id: 'D1', a: 1, k: 2 },
          { type: 'R', id: 'RL', a: 2, b: 0, r: rl },
        ],
      }
    case 'centerTap':
      return {
        nodes: 4,
        els: [
          { type: 'V', id: 'Vs1', a: 1, b: 0, v },
          { type: 'V', id: 'Vs2', a: 0, b: 2, v },
          { type: 'D', id: 'D1', a: 1, k: 3 },
          { type: 'D', id: 'D2', a: 2, k: 3 },
          { type: 'R', id: 'RL', a: 3, b: 0, r: rl },
        ],
      }
    case 'bridge':
      // 節點:0=q(負載−、地) 1=a(次級上端) 2=b(次級下端) 3=p(負載+)
      return {
        nodes: 4,
        els: [
          { type: 'V', id: 'Vs', a: 1, b: 2, v },
          { type: 'D', id: 'D1', a: 1, k: 3 },
          { type: 'D', id: 'D2', a: 2, k: 3 },
          { type: 'D', id: 'D3', a: 0, k: 2 }, // 負載− → 次級下端 b(習作圖的 D3)
          { type: 'D', id: 'D4', a: 0, k: 1 }, // 負載− → 次級上端 a(習作圖的 D4)
          { type: 'R', id: 'RL', a: 3, b: 0, r: rl },
        ],
      }
  }
}

export interface RectifierState extends Solution {
  /** 負載電壓 Vo */
  vo: number
  /** 負載電流 Io(由 + 流向 −) */
  io: number
}

export function solveRectifier(kind: RectifierKind, v: number, rl = 100): RectifierState {
  const { els, nodes } = rectifierNetlist(kind, v, rl)
  const s = solveCircuit(els, nodes)
  return { ...s, vo: s.i.RL * rl, io: s.i.RL }
}

/** 一個週期內以 θ(度)掃描,v = vm·sinθ */
export function sweepRectifier(kind: RectifierKind, vm: number, rl = 100, n = 360) {
  const out: { theta: number; v: number; state: RectifierState }[] = []
  for (let k = 0; k < n; k++) {
    const theta = (k / n) * 360
    const v = vm * Math.sin((theta * Math.PI) / 180)
    out.push({ theta, v, state: solveRectifier(kind, v, rl) })
  }
  return out
}
