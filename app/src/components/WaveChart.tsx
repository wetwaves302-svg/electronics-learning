import type { ReactNode } from 'react'
import { type WaveFn, samplePoints } from '../core/waveform'

export interface Series { fn: WaveFn; color?: string; dashed?: boolean; width?: number; label?: string }
export interface HLine { y: number; label: string; color?: string }
export interface Scale { sx: (t: number) => number; sy: (v: number) => number }

interface Props {
  series: Series[]
  t0: number
  t1: number
  yMin: number
  yMax: number
  /** 方格:xDiv × yDiv 格(像示波器螢幕) */
  grid?: { xDiv: number; yDiv: number }
  hLines?: HLine[]
  /** 顯示 0 軸與座標軸 */
  axes?: boolean
  xLabel?: string
  yLabel?: string
  ariaLabel: string
  samples?: number
  children?: (s: Scale) => ReactNode
}

const W = 420, H = 250, PL = 40, PR = 14, PT = 14, PB = 28

/** 通用波形圖:由函式取樣產生。同時用於習作重繪圖、互動實驗室與遊戲。 */
export default function WaveChart({ series, t0, t1, yMin, yMax, grid, hLines, axes = true, xLabel, yLabel, ariaLabel, samples = 700, children }: Props) {
  const sx = (t: number) => PL + ((t - t0) / (t1 - t0)) * (W - PL - PR)
  const sy = (v: number) => PT + ((yMax - v) / (yMax - yMin)) * (H - PT - PB)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="w-full h-auto bg-white rounded-xl border-2 border-navy-800/30">
      {grid && (
        <g stroke="#9db4cf" strokeWidth={0.8} strokeDasharray="4 3">
          {Array.from({ length: grid.xDiv + 1 }, (_, i) => {
            const x = PL + (i / grid.xDiv) * (W - PL - PR)
            return <line key={'x' + i} x1={x} x2={x} y1={PT} y2={H - PB} />
          })}
          {Array.from({ length: grid.yDiv + 1 }, (_, i) => {
            const y = PT + (i / grid.yDiv) * (H - PT - PB)
            return <line key={'y' + i} x1={PL} x2={W - PR} y1={y} y2={y} />
          })}
        </g>
      )}
      {axes && (
        <g stroke="#17407a" strokeWidth={1.4}>
          <line x1={PL} x2={W - PR} y1={sy(0)} y2={sy(0)} />
          <line x1={PL} x2={PL} y1={PT} y2={H - PB} />
        </g>
      )}
      {hLines?.map((h) => (
        <g key={h.label}>
          <line x1={PL} x2={W - PR} y1={sy(h.y)} y2={sy(h.y)} stroke={h.color ?? '#e5383b'} strokeWidth={1.3} strokeDasharray="6 4" />
          <text x={W - PR - 2} y={sy(h.y) - 4} textAnchor="end" fontSize={11} fill={h.color ?? '#e5383b'} fontWeight={700}>{h.label}</text>
        </g>
      ))}
      {series.map((s, i) => {
        const pts = samplePoints(s.fn, t0, t1, samples)
        const d = pts.map(([t, v], k) => `${k ? 'L' : 'M'}${sx(t).toFixed(2)},${sy(Math.max(yMin, Math.min(yMax, v))).toFixed(2)}`).join(' ')
        return <path key={i} d={d} fill="none" stroke={s.color ?? '#1b6fd1'} strokeWidth={s.width ?? 2.6} strokeDasharray={s.dashed ? '6 4' : undefined} strokeLinejoin="round" />
      })}
      {children?.({ sx, sy })}
      {xLabel && <text x={W - PR} y={H - 6} textAnchor="end" fontSize={11} fill="#17407a">{xLabel}</text>}
      {yLabel && <text x={4} y={PT + 6} fontSize={11} fill="#17407a">{yLabel}</text>}
    </svg>
  )
}
