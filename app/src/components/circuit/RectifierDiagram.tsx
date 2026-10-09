import { AcSource, Coil, Diode, Ground, Resistor, Wire, COLORS, type Pt } from './parts'
import type { RectifierKind, RectifierState } from '../../core/rectifier'

interface Props {
  kind: RectifierKind
  state: RectifierState
  /** 次級瞬時電壓(圖上標示用) */
  v: number
  /** 電流顯示的參考比例(最大負載電流) */
  iScale: number
  electron?: boolean
  paused?: boolean
  /** 題目用:不顯示導通/截止與電流,讓學生自己判斷 */
  plain?: boolean
}

const { INK, CUR } = COLORS

function Pol({ x, y, plus }: { x: number; y: number; plus: boolean }) {
  return <text x={x} y={y} fontSize={15} fontWeight={800} fill={plus ? CUR : INK} textAnchor="middle">{plus ? '+' : '−'}</text>
}

/** 整流電路圖:元件狀態與電流由求解器結果決定,不是預先寫好的動畫。 */
export default function RectifierDiagram({ kind, state: st, v, iScale, electron = false, paused = false, plain = false }: Props) {
  const zero = Object.fromEntries(Object.keys(st.i).map((k) => [k, 0]))
  const s: RectifierState = plain ? { ...st, i: zero, on: Object.fromEntries(Object.keys(st.on).map((k) => [k, false])), vo: 0, io: 0 } : st
  const w = (pts: Pt[], current: number) => <Wire pts={pts} current={current} scale={iScale} electron={electron} paused={paused} />
  const pos = v >= 0
  return (
    <svg viewBox="0 0 420 270" role="img" aria-label={`${kind === 'half' ? '半波' : kind === 'centerTap' ? '中心抽頭全波' : '橋式全波'}整流電路圖`} className="w-full h-auto rounded-xl border-2 border-navy-800/30 bg-white">
      {kind === 'half' && (
        <g>
          {w([[70, 108], [70, 50], [125, 50]], s.i.Vs)}
          {w([[175, 50], [330, 50], [330, 90]], s.i.D1)}
          {w([[330, 130], [330, 230], [70, 230], [70, 152]], s.i.RL)}
          <AcSource x={70} y={130} v={v} label="Vs" />
          <Diode plain={plain} x={150} y={50} on={s.on.D1} label="D1" />
          <Resistor x={330} y={110} rot={90} label="RL" labelOffset={[24, 4]} />
          <Ground x={120} y={230} />
          {!plain && <text x={330} y={262} textAnchor="middle" fontSize={12} fill={INK} fontWeight={700}>Vo = {s.vo.toFixed(1)} V</text>}
        </g>
      )}
      {kind === 'centerTap' && (
        <g>
          <Coil x={90} y0={50} y1={210} side="left" />
          <Coil x={102} y0={50} y1={210} side="right" />
          <line x1={96} y1={46} x2={96} y2={214} stroke={INK} strokeWidth={0} />
          <Pol x={72} y={48} plus={pos} />
          <Pol x={72} y={222} plus={!pos} />
          {w([[90, 50], [140, 50]], s.i.D1)}
          {w([[180, 50], [260, 50]], s.i.D1)}
          {w([[90, 210], [140, 210]], s.i.D2)}
          {w([[180, 210], [260, 210], [260, 50]], s.i.D2)}
          {w([[260, 50], [340, 50], [340, 90]], s.i.RL)}
          {w([[340, 130], [340, 245], [30, 245], [30, 130], [88, 130]], s.i.RL)}
          <Diode plain={plain} x={160} y={50} on={s.on.D1} label="D1" />
          <Diode plain={plain} x={160} y={210} on={s.on.D2} label="D2" labelOffset={[0, 26]} />
          <Resistor x={340} y={110} rot={90} label="RL" labelOffset={[24, 4]} />
          <circle cx={90} cy={130} r={3} fill={INK} />
          <Ground x={30} y={248} />
          <text x={200} y={140} textAnchor="middle" fontSize={11} fill={INK} fontWeight={700}>中心抽頭接地</text>
        </g>
      )}
      {kind === 'bridge' && (
        <g>
          <Coil x={60} y0={40} y1={220} side="left" />
          <Coil x={72} y0={40} y1={220} side="right" />
          <Pol x={44} y={36} plus={pos} />
          <Pol x={44} y={236} plus={!pos} />
          {/* 上方節點 a、下方節點 b */}
          {w([[60, 40], [150, 40]], s.i.Vs)}
          {w([[150, 40], [300, 40]], -s.i.D4)}
          {w([[300, 220], [150, 220]], s.i.D3)}
          {w([[150, 220], [60, 220]], s.i.Vs)}
          {/* 左欄:D1(a→p)、D2(b→p) */}
          {w([[150, 40], [150, 70]], s.i.D1)}
          {w([[150, 100], [150, 130]], s.i.D1)}
          {w([[150, 220], [150, 190]], s.i.D2)}
          {w([[150, 160], [150, 130]], s.i.D2)}
          {/* 右欄:D4(q→a)、D3(q→b) */}
          {w([[300, 130], [300, 100]], s.i.D4)}
          {w([[300, 70], [300, 40]], s.i.D4)}
          {w([[300, 130], [300, 160]], s.i.D3)}
          {w([[300, 190], [300, 220]], s.i.D3)}
          {/* 負載 p → q */}
          {w([[150, 130], [195, 130]], s.i.RL)}
          {w([[255, 130], [300, 130]], s.i.RL)}
          <Diode plain={plain} x={150} y={85} rot={90} on={s.on.D1} label="D1" labelOffset={[-52, 4]} />
          <Diode plain={plain} x={150} y={175} rot={-90} on={s.on.D2} label="D2" labelOffset={[-52, 4]} />
          <Diode plain={plain} x={300} y={85} rot={-90} on={s.on.D4} label="D4" labelOffset={[52, 4]} />
          <Diode plain={plain} x={300} y={175} rot={90} on={s.on.D3} label="D3" labelOffset={[52, 4]} />
          <Resistor x={225} y={130} label="RL" labelOffset={[0, -16]} />
          <circle cx={150} cy={130} r={3} fill={INK} /><circle cx={300} cy={130} r={3} fill={INK} />
          <text x={150} y={118} textAnchor="end" fontSize={11} fontWeight={700} fill={INK}>+</text>
          <text x={288} y={124} fontSize={11} fontWeight={700} fill={INK} textAnchor="end">−</text>
          <line x1={300} y1={130} x2={350} y2={130} stroke={INK} strokeWidth={2} />
          <Ground x={350} y={130} />
        </g>
      )}
      <text x={8} y={16} fontSize={12} fontWeight={800} fill={INK}>{plain ? (v >= 0 ? '輸入 Vi > 0 V 的瞬間' : '輸入 Vi < 0 V 的瞬間') : `次級電壓 ${kind === 'centerTap' ? '(每半邊)' : ''}v = ${v.toFixed(1)} V`}</text>
    </svg>
  )
}
