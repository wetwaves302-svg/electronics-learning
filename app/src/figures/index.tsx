import type { ReactNode } from 'react'
import WaveChart from '../components/WaveChart'
import { makePulse, makeTriangularPulse, makeWave } from '../core/waveform'
import * as C from './circuits'

/** 習作圖的重繪版。波形由公式產生,與題目數值一致。 */
export const FIGURES: Record<string, () => ReactNode> = {
  'wb2-mc07': C.mc07,
  'wb2-mc09': C.mc09,
  'wb2-qa01': C.qa01,
  'wb2-qa02': C.qa02,
  'wb2-qa03': C.qa03,
  'wb2-py02': C.py02,
  'wb2-py05': C.py05,
  // 習作 1-2 問答 3:水平 5ms/格、垂直 2V/格;波形自 0 向下,振幅 4 格(8V),週期 4 格(20ms)
  'wb1-qa03': () => (
    <figure>
      <WaveChart
        ariaLabel="弦波波形,方格螢幕,水平每格 5 毫秒、垂直每格 2 伏特"
        series={[{ fn: makeWave('sine', 8, 50, 180) }]}
        t0={0} t1={0.05} yMin={-10} yMax={10} grid={{ xDiv: 10, yDiv: 10 }} axes={false}
      />
      <figcaption className="text-xs mt-1">水平每格 5 ms,垂直每格 2 V</figcaption>
    </figure>
  ),
  // 習作 1-2 問答 4:每週期一個三角脈波,寬 T/3,峰值 Vm
  'wb1-qa04': () => (
    <figure>
      <WaveChart
        ariaLabel="每個週期一個三角脈波,寬度為週期的三分之一,峰值 Vm"
        series={[{ fn: makeTriangularPulse(1, 1 / 3, 1) }]}
        t0={0} t1={2} yMin={-0.15} yMax={1.3} xLabel="t"
      >
        {({ sx, sy }) => (
          <g fontSize={12} fill="#17407a" fontWeight={700}>
            <text x={sx(0) - 6} y={sy(1) + 4} textAnchor="end">Vm</text>
            <text x={sx(1 / 3)} y={sy(0) + 16} textAnchor="middle">T/3</text>
            <text x={sx(1)} y={sy(0) + 16} textAnchor="middle">T</text>
            <text x={sx(4 / 3)} y={sy(0) + 16} textAnchor="middle">T+T/3</text>
          </g>
        )}
      </WaveChart>
    </figure>
  ),
  // 106 年統測:Vp 高電位持續 T1,低電位(0)持續 T2
  'wb1-py02': () => (
    <figure>
      <WaveChart
        ariaLabel="週期性方波,高電位為 Vp,持續時間 T1,低電位持續時間 T2"
        series={[{ fn: makePulse(1, 0, 0.6, 1 / 5) }]}
        t0={0} t1={10} yMin={-0.2} yMax={1.35} xLabel="t(s)"
      >
        {({ sx, sy }) => (
          <g fontSize={12} fill="#17407a" fontWeight={700} stroke="#17407a" strokeWidth={1.2}>
            <text x={sx(0) - 6} y={sy(1) + 4} textAnchor="end" stroke="none">Vp</text>
            <line x1={sx(0)} x2={sx(3)} y1={sy(1.15)} y2={sy(1.15)} />
            <text x={sx(1.5)} y={sy(1.15) - 4} textAnchor="middle" stroke="none">T1</text>
            <line x1={sx(3)} x2={sx(5)} y1={sy(1.15)} y2={sy(1.15)} />
            <text x={sx(4)} y={sy(1.15) - 4} textAnchor="middle" stroke="none">T2</text>
          </g>
        )}
      </WaveChart>
    </figure>
  ),
}
