import type { ReactNode } from 'react'

export type Pt = [number, number]

const INK = '#17407a'
const ON = '#35b84a'
const CUR = '#e5383b'

/** 導線:有電流時疊加流動虛線與箭頭。direction 以傳統電流(正值沿 pts 方向)為準。 */
export function Wire({ pts, current, scale, electron = false, paused = false }: { pts: Pt[]; current: number; scale: number; electron?: boolean; paused?: boolean }) {
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  const active = Math.abs(current) > 0.01 * scale
  // 傳統電流沿 sign(current) 方向;電子流與其相反
  const forward = (current > 0) !== electron
  const arrow = active ? midArrow(pts, forward) : null
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      {active && (
        <>
          <path d={d} fill="none" stroke={electron ? '#7a4fd6' : CUR} strokeWidth={4.5} strokeLinecap="round" strokeDasharray="2 10" strokeLinejoin="round"
            className={`${forward ? 'flow' : 'flow-rev'} ${paused ? 'flow-paused' : ''}`} />
          {arrow}
        </>
      )}
    </g>
  )
}

function midArrow(pts: Pt[], forward: boolean) {
  // 取最長線段的中點放箭頭(靜態,暫停時也看得出方向)
  let best = 0, bi = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
    if (l > best) { best = l; bi = i }
  }
  const [x0, y0] = pts[bi], [x1, y1] = pts[bi + 1]
  const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI + (forward ? 0 : 180)
  return <polygon points="-6,-5 6,0 -6,5" transform={`translate(${(x0 + x1) / 2},${(y0 + y1) / 2}) rotate(${ang})`} fill="#fff" stroke={INK} strokeWidth={1.2} />
}

/** 二極體:陽極在局部 −x、陰極在 +x。rot 為旋轉角(度)。 */
export function Diode({ x, y, rot = 0, on, label, labelOffset = [0, -16], plain = false }: { x: number; y: number; rot?: number; on: boolean; label: string; labelOffset?: Pt; plain?: boolean }) {
  return (
    <g>
      <g transform={`translate(${x},${y}) rotate(${rot})`}>
        <polygon points="-10,-10 -10,10 10,0" fill={on ? ON : '#fff'} stroke={INK} strokeWidth={2} />
        <line x1={10} y1={-11} x2={10} y2={11} stroke={INK} strokeWidth={3} />
      </g>
      <text x={x + labelOffset[0]} y={y + labelOffset[1]} textAnchor="middle" fontSize={12} fontWeight={700} fill={INK}>
        {label}{plain ? '' : on ? ' 導通' : ' 截止'}
      </text>
    </g>
  )
}

export function Resistor({ x, y, rot = 0, label, labelOffset = [0, -16] }: { x: number; y: number; rot?: number; label: string; labelOffset?: Pt }) {
  return (
    <g>
      <g transform={`translate(${x},${y}) rotate(${rot})`}>
        <polyline points="-20,0 -15,0 -12,-8 -6,8 0,-8 6,8 12,-8 15,0 20,0" fill="#fff" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      </g>
      <text x={x + labelOffset[0]} y={y + labelOffset[1]} textAnchor="middle" fontSize={12} fontWeight={700} fill={INK}>{label}</text>
    </g>
  )
}

export function Ground({ x, y }: { x: number; y: number }) {
  return (
    <g stroke={INK} strokeWidth={2}>
      <line x1={x} y1={y} x2={x} y2={y + 6} />
      <line x1={x - 10} y1={y + 6} x2={x + 10} y2={y + 6} />
      <line x1={x - 6} y1={y + 10} x2={x + 6} y2={y + 10} />
      <line x1={x - 2} y1={y + 14} x2={x + 2} y2={y + 14} />
    </g>
  )
}

/** 交流電源:圓內正弦,+ 號顯示在目前較高電位的那一端 */
export function AcSource({ x, y, v, label }: { x: number; y: number; v: number; label: string }) {
  const top = v >= 0
  return (
    <g>
      <circle cx={x} cy={y} r={22} fill="#fff" stroke={INK} strokeWidth={2} />
      <path d={`M${x - 13},${y} q6.5,-14 13,0 t13,0`} fill="none" stroke={INK} strokeWidth={2} />
      <text x={x + 28} y={y - 14} fontSize={14} fontWeight={800} fill={top ? CUR : INK}>{top ? '+' : '−'}</text>
      <text x={x + 28} y={y + 24} fontSize={14} fontWeight={800} fill={top ? INK : CUR}>{top ? '−' : '+'}</text>
      <text x={x - 30} y={y + 4} textAnchor="end" fontSize={12} fontWeight={700} fill={INK}>{label}</text>
    </g>
  )
}

/** 垂直線圈:x 為中心線,由 y0 到 y1。 */
export function Coil({ x, y0, y1, side = 'left' }: { x: number; y0: number; y1: number; side?: 'left' | 'right' }) {
  const n = 5
  const h = (y1 - y0) / n
  const r = h / 2
  const sweep = side === 'left' ? 0 : 1
  let d = `M${x},${y0}`
  for (let i = 0; i < n; i++) d += ` a${r},${r} 0 0 ${sweep} 0,${h}`
  return <path d={d} fill="none" stroke={INK} strokeWidth={2} />
}

export function Transformer({ children }: { children?: ReactNode }) {
  return <g>{children}</g>
}
export const COLORS = { INK, ON, CUR }

/** 電池:長線為正極。垂直放置,正極在上。 */
export function Battery({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <line x1={x - 14} y1={y - 5} x2={x + 14} y2={y - 5} stroke={INK} strokeWidth={3} />
      <line x1={x - 8} y1={y + 5} x2={x + 8} y2={y + 5} stroke={INK} strokeWidth={3} />
      <text x={x + 20} y={y - 6} fontSize={13} fontWeight={800} fill={CUR}>+</text>
      <text x={x - 22} y={y + 4} textAnchor="end" fontSize={12} fontWeight={700} fill={INK}>{label}</text>
    </g>
  )
}

export function Line({ pts }: { pts: Pt[] }) {
  return <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
}

export function Dot({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={3} fill={INK} />
}

/** 電容(濾波用):兩片平行板,水平導線進出 */
export function Capacitor({ x, y, rot = 0, label, labelOffset = [0, -22] }: { x: number; y: number; rot?: number; label?: string; labelOffset?: Pt }) {
  return (
    <g>
      <g transform={`translate(${x},${y}) rotate(${rot})`} stroke={INK} strokeWidth={2.5}>
        <line x1={-20} y1={0} x2={-4} y2={0} strokeWidth={2} />
        <line x1={-4} y1={-14} x2={-4} y2={14} />
        <line x1={4} y1={-14} x2={4} y2={14} />
        <line x1={4} y1={0} x2={20} y2={0} strokeWidth={2} />
      </g>
      {label && <text x={x + labelOffset[0]} y={y + labelOffset[1]} textAnchor="middle" fontSize={12} fontWeight={700} fill={INK}>{label}</text>}
    </g>
  )
}
