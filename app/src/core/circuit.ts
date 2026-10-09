/**
 * 理想二極體電路求解器(節點分析法 MNA + 開關迭代)。
 * 用於整流電路的動畫、PIV、平均值與有效值驗證。節點 0 為接地。
 * 二極體為理想開關:導通時以極小電阻 RON、截止時以極大電阻 ROFF 近似。
 */

export type Element =
  | { type: 'R'; id: string; a: number; b: number; r: number }
  | { type: 'V'; id: string; a: number; b: number; v: number } // a 為正端
  | { type: 'D'; id: string; a: number; k: number } // 陽極 a、陰極 k

export interface Solution {
  /** 節點電壓(索引 = 節點編號,0 為接地) */
  v: number[]
  /** 各元件電流:R 由 a→b、V 由 a(正端)經電源內部流向 b 的相反方向請見註、D 由陽極→陰極 */
  i: Record<string, number>
  /** 二極體是否導通 */
  on: Record<string, boolean>
  /** 二極體陽極對陰極電壓 V_AK(負值=承受逆向電壓) */
  vak: Record<string, number>
}

const RON = 1e-3
const ROFF = 1e8

function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    if (Math.abs(M[p][c]) < 1e-18) throw new Error('矩陣奇異:電路可能有浮接節點')
    ;[M[c], M[p]] = [M[p], M[c]]
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c]
      if (f === 0) continue
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]
    }
  }
  const x = new Array<number>(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n]
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]
    x[r] = s / M[r][r]
  }
  return x
}

function solveWithStates(els: Element[], nNodes: number, on: Record<string, boolean>) {
  const vs = els.filter((e): e is Extract<Element, { type: 'V' }> => e.type === 'V')
  const nv = nNodes - 1 // 不含接地
  const size = nv + vs.length
  const A = Array.from({ length: size }, () => new Array<number>(size).fill(0))
  const z = new Array<number>(size).fill(0)
  const idx = (n: number) => n - 1 // 節點 n → 列(0 為接地,回傳 -1)
  const stamp = (a: number, b: number, g: number) => {
    if (a > 0) A[idx(a)][idx(a)] += g
    if (b > 0) A[idx(b)][idx(b)] += g
    if (a > 0 && b > 0) { A[idx(a)][idx(b)] -= g; A[idx(b)][idx(a)] -= g }
  }
  for (const e of els) {
    if (e.type === 'R') stamp(e.a, e.b, 1 / e.r)
    else if (e.type === 'D') stamp(e.a, e.k, 1 / (on[e.id] ? RON : ROFF))
  }
  vs.forEach((e, j) => {
    const row = nv + j
    if (e.a > 0) { A[idx(e.a)][row] += 1; A[row][idx(e.a)] += 1 }
    if (e.b > 0) { A[idx(e.b)][row] -= 1; A[row][idx(e.b)] -= 1 }
    z[row] = e.v
  })
  const x = solveLinear(A, z)
  const v = [0, ...x.slice(0, nv)]
  const i: Record<string, number> = {}
  for (const e of els) {
    if (e.type === 'R') i[e.id] = (v[e.a] - v[e.b]) / e.r
    else if (e.type === 'D') i[e.id] = (v[e.a] - v[e.k]) / (on[e.id] ? RON : ROFF)
  }
  // MNA 的電源電流變數定義為「由正端 a 流入電源、從 b 流出」,取負號後為「電源對外供給的電流(由正端流出)」
  vs.forEach((e, j) => { i[e.id] = -x[nv + j] })
  return { v, i }
}

export function solveCircuit(els: Element[], nNodes: number): Solution {
  const diodes = els.filter((e): e is Extract<Element, { type: 'D' }> => e.type === 'D')
  const on: Record<string, boolean> = Object.fromEntries(diodes.map((d) => [d.id, false]))
  let sol = solveWithStates(els, nNodes, on)
  for (let iter = 0; iter < 60; iter++) {
    // 找違反條件最嚴重的二極體:導通但電流為負、或截止但 VAK > 0
    let worst: { id: string; amount: number } | null = null
    for (const d of diodes) {
      const vak = sol.v[d.a] - sol.v[d.k]
      const amount = on[d.id] ? (sol.i[d.id] < -1e-12 ? -sol.i[d.id] * RON : 0) : vak > 1e-9 ? vak : 0
      if (amount > 0 && (!worst || amount > worst.amount)) worst = { id: d.id, amount }
    }
    if (!worst) break
    on[worst.id] = !on[worst.id]
    sol = solveWithStates(els, nNodes, on)
  }
  const vak: Record<string, number> = {}
  for (const d of diodes) vak[d.id] = sol.v[d.a] - sol.v[d.k]
  return { v: sol.v, i: sol.i, on: { ...on }, vak }
}
