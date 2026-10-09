import WaveChart from '../components/WaveChart'
import { makePulse, makeWave, type WaveFn } from '../core/waveform'
import type { WaveSpec } from './types'

export function waveFn(s: WaveSpec): WaveFn {
  const f = s.f ?? 1
  switch (s.type) {
    case 'sine': return makeWave('sine', s.vm, f)
    case 'cosine': return makeWave('sine', s.vm, f, 90)
    case 'square': return makeWave('square', s.vm, f)
    case 'triangle': return makeWave('triangle', s.vm, f)
    case 'sawtooth': return makeWave('sawtooth', s.vm, f)
    case 'dc': return () => s.vm
    case 'pdc': { const g = makeWave('sine', s.vm, f); return (t) => Math.abs(g(t)) }
    case 'pulse': return makePulse(s.vm, 0, s.duty ?? 0.3, f)
  }
}

const NAME: Record<WaveSpec['type'], string> = {
  sine: '弦波', cosine: '餘弦波', square: '方波', triangle: '三角波', sawtooth: '鋸齒波', dc: '直流', pdc: '脈動直流', pulse: '矩形脈波',
}

/** 依 WaveSpec 繪製波形(不顯示答案名稱,避免洩漏) */
export default function WaveVisual({ wave }: { wave: WaveSpec }) {
  const f = wave.f ?? 1
  const g = wave.grid
  const t1 = g ? g.tPerDiv * g.xDiv : 2 / f
  const y = g ? (g.vPerDiv * g.yDiv) / 2 : wave.vm * 1.4
  return (
    <WaveChart
      ariaLabel={g ? '示波器方格上的波形' : '一個波形圖'}
      series={[{ fn: waveFn(wave) }]}
      t0={0} t1={t1}
      yMin={wave.type === 'dc' || wave.type === 'pdc' || wave.type === 'pulse' ? -y * 0.25 : -y}
      yMax={y}
      grid={g ? { xDiv: g.xDiv, yDiv: g.yDiv } : undefined}
      axes={!g}
      samples={g ? 700 : 500}
    />
  )
}

export const waveName = (t: WaveSpec['type']) => NAME[t]
