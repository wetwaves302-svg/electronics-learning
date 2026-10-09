import WaveVisual from './WaveVisual'
import RectifierDiagram from '../components/circuit/RectifierDiagram'
import { AcSource, Capacitor, Coil, Diode, Ground, Resistor } from '../components/circuit/parts'
import { solveRectifier } from '../core/rectifier'
import type { SymbolName, Visual } from './types'

const SYMBOL_LABEL: Record<SymbolName, string> = {
  diode: '一個電子元件的符號', resistor: '一個電子元件的符號', capacitor: '一個電子元件的符號',
  transformer: '一個電子元件的符號', ground: '一個電路符號', acSource: '一個電路符號',
}

function Symbol({ name }: { name: SymbolName }) {
  return (
    <svg viewBox="0 0 140 90" role="img" aria-label={SYMBOL_LABEL[name]} className="mx-auto h-24 w-auto rounded-xl border-2 border-navy-800/30 bg-white">
      <g stroke="#17407a" strokeWidth={2}>
        {name === 'diode' && <><line x1={15} y1={45} x2={55} y2={45} /><line x1={85} y1={45} x2={125} y2={45} /><Diode plain x={70} y={45} on={false} label="" /></>}
        {name === 'resistor' && <Resistor x={70} y={45} label="" />}
        {name === 'capacitor' && <Capacitor x={70} y={45} />}
        {name === 'ground' && <><line x1={70} y1={15} x2={70} y2={40} /><Ground x={70} y={40} /></>}
        {name === 'acSource' && <AcSource x={70} y={45} v={1} label="" />}
        {name === 'transformer' && <><Coil x={55} y0={10} y1={80} side="left" /><Coil x={85} y0={10} y1={80} side="right" /><line x1={67} y1={10} x2={67} y2={80} /><line x1={73} y1={10} x2={73} y2={80} /></>}
      </g>
    </svg>
  )
}

/** 遊戲題目圖像:波形、電路符號或整流電路圖。不顯示答案文字。 */
export default function VisualView({ v }: { v: Visual }) {
  if (v.kind === 'wave') return <WaveVisual wave={v.wave} />
  if (v.kind === 'symbol') return <Symbol name={v.symbol} />
  const vv = v.v ?? 1
  return <RectifierDiagram plain={v.plain ?? true} kind={v.circuit} state={solveRectifier(v.circuit, vv, 100)} v={vv} iScale={0.1} />
}
