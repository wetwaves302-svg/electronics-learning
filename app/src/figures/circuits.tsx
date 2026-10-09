import RectifierDiagram from '../components/circuit/RectifierDiagram'
import WaveChart from '../components/WaveChart'
import { Battery, Coil, AcSource, Diode, Dot, Ground, Line, Resistor } from '../components/circuit/parts'
import { solveRectifier } from '../core/rectifier'

const INK = '#17407a'
const frame = (label: string, children: React.ReactNode, h = 250) => (
  <svg viewBox={`0 0 420 ${h}`} role="img" aria-label={label} className="w-full h-auto rounded-xl border-2 border-navy-800/30 bg-white">{children}</svg>
)
const T = ({ x, y, children, anchor = 'middle' as const }: { x: number; y: number; children: React.ReactNode; anchor?: 'start' | 'middle' | 'end' }) => (
  <text x={x} y={y} textAnchor={anchor} fontSize={13} fontWeight={700} fill={INK}>{children}</text>
)

/** 習作 2-2 選擇題 7:12V─D1─3kΩ 與 2V─D2─1kΩ 並接到 Vo,Vo 對地接 1kΩ */
export const mc07 = () => frame('兩個理想二極體與電阻的電路:12 伏經 D1 與 3 千歐、2 伏經 D2 與 1 千歐接到輸出 Vo,輸出對地接 1 千歐', (
  <g>
    <Battery x={50} y={75} label="12V" /><Ground x={50} y={95} />
    <Line pts={[[50, 70], [50, 40], [100, 40]]} />
    <Diode plain x={115} y={40} on={false} label="D1" />
    <Line pts={[[130, 40], [160, 40]]} /><Resistor x={180} y={40} label="3kΩ" /><Line pts={[[200, 40], [300, 40]]} />
    <Battery x={50} y={165} label="2V" /><Ground x={50} y={185} />
    <Line pts={[[50, 160], [50, 130], [100, 130]]} />
    <Diode plain x={115} y={130} on={false} label="D2" />
    <Line pts={[[130, 130], [160, 130]]} /><Resistor x={180} y={130} label="1kΩ" /><Line pts={[[200, 130], [300, 130]]} />
    <Line pts={[[300, 40], [300, 125]]} /><Dot x={300} y={85} /><Line pts={[[300, 85], [350, 85]]} /><T x={365} y={90} anchor="start">Vo</T>
    <Line pts={[[300, 130], [300, 150]]} /><Resistor x={300} y={170} rot={90} label="1kΩ" labelOffset={[30, 4]} /><Line pts={[[300, 190], [300, 215]]} /><Ground x={300} y={215} />
  </g>
))

/** 習作 2-2 問答 2:12V─5kΩ─節點,節點對地 20kΩ,節點─D1─Vo,Vo 對地 20kΩ */
export const qa02 = () => frame('12 伏電源經 5 千歐到節點,節點對地接 20 千歐,節點經理想二極體 D1 到輸出 Vo,輸出對地接 20 千歐', (
  <g>
    <Battery x={40} y={95} label="12V" /><Ground x={40} y={115} />
    <Line pts={[[40, 90], [40, 40], [90, 40]]} /><Resistor x={110} y={40} label="5kΩ" /><Line pts={[[130, 40], [200, 40]]} />
    <Dot x={200} y={40} /><Line pts={[[200, 40], [200, 85]]} /><Resistor x={200} y={105} rot={90} label="20kΩ" labelOffset={[32, 4]} /><Line pts={[[200, 125], [200, 190]]} /><Ground x={200} y={190} />
    <Line pts={[[200, 40], [250, 40]]} /><Diode plain x={265} y={40} on={false} label="D1" />
    <Line pts={[[280, 40], [340, 40]]} /><Dot x={340} y={40} /><Line pts={[[340, 40], [390, 40]]} /><T x={402} y={44} anchor="start">Vo</T>
    <polygon points="-6,-5 6,0 -6,5" transform="translate(235,24)" fill={INK} /><T x={235} y={16}>I</T>
    <Line pts={[[340, 40], [340, 85]]} /><Resistor x={340} y={105} rot={90} label="20kΩ" labelOffset={[-32, 4]} /><Line pts={[[340, 125], [340, 190]]} /><Ground x={340} y={190} />
  </g>
), 230)

/** 習作 2-3 問答 3:半波整流,10:1 變壓器,Vi = 100V/50Hz,RL = 100Ω */
export const qa03 = () => frame('半波整流電路:交流 100 伏 50 赫茲,變壓器匝數比 10 比 1,次級接理想二極體 D1 與 100 歐姆負載', (
  <g>
    <AcSource x={50} y={130} v={1} label="Vi" />
    <T x={50} y={185}>100V / 50Hz</T>
    <Line pts={[[50, 108], [50, 60], [110, 60]]} /><Line pts={[[50, 152], [50, 200], [110, 200]]} />
    <Coil x={110} y0={60} y1={200} side="left" /><Coil x={124} y0={60} y1={200} side="right" />
    <T x={117} y={225}>10 : 1</T>
    <Line pts={[[124, 60], [180, 60]]} />
    <Diode plain x={195} y={60} on={false} label="D1" /><Line pts={[[210, 60], [330, 60], [330, 110]]} />
    <T x={150} y={50}>+</T><T x={150} y={190}>−</T><T x={215} y={90} anchor="start">Vs</T>
    <Resistor x={330} y={130} rot={90} label="RL = 100Ω" labelOffset={[-50, 4]} /><Line pts={[[330, 150], [330, 200], [124, 200]]} />
    <Ground x={230} y={200} />
    <Dot x={330} y={60} /><T x={375} y={95} anchor="start">Vo</T><T x={360} y={115} anchor="start">Io↓</T>
  </g>
))

/** 習作歷屆 108 年 PY-05:110:24 中心抽頭全波 */
export const py05 = () => frame('中心抽頭全波整流電路:AC 110 伏 60 赫茲,變壓器 110 比 24,次級中心抽頭接地,兩個二極體的陰極共接負載 R', (
  <g>
    <AcSource x={45} y={125} v={1} label="AC" />
    <T x={45} y={175}>110V / 60Hz</T>
    <Line pts={[[45, 103], [45, 40], [100, 40]]} /><Line pts={[[45, 147], [45, 210], [100, 210]]} />
    <Coil x={100} y0={40} y1={210} side="left" /><Coil x={114} y0={40} y1={210} side="right" />
    <T x={107} y={235}>110 : 24</T>
    <Line pts={[[114, 40], [150, 40]]} /><Diode plain x={170} y={40} on={false} label="D1" /><Line pts={[[185, 40], [260, 40]]} />
    <Line pts={[[114, 210], [150, 210]]} /><Diode plain x={170} y={210} on={false} label="D2" labelOffset={[0, 26]} /><Line pts={[[185, 210], [260, 210], [260, 40]]} />
    <Line pts={[[260, 40], [340, 40], [340, 85]]} /><Dot x={260} y={40} /><Dot x={340} y={40} /><Line pts={[[340, 40], [385, 40]]} /><T x={395} y={44} anchor="start">Vo</T>
    <Resistor x={340} y={105} rot={90} label="R" labelOffset={[22, 4]} /><Line pts={[[340, 125], [340, 160]]} /><Ground x={340} y={160} />
    <Line pts={[[114, 125], [150, 125]]} /><Dot x={114} y={125} /><Ground x={150} y={125} />
  </g>
))

/** 習作 2-1 問答 1 圖 (7):A~E 五種材料的載子示意,符號數量依答案嚴格設定 */
function lcg(seed: number) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296) }
function boxes(minus: number, plus: number, seed: number) {
  const r = lcg(seed)
  const pts: { x: number; y: number; m: boolean }[] = []
  const total = minus + plus
  const cols = 6, rows = Math.ceil(total / cols)
  const kinds = [...Array(minus).fill(true), ...Array(plus).fill(false)].sort(() => r() - 0.5)
  for (let i = 0; i < total; i++) {
    const cx = (i % cols), cy = Math.floor(i / cols)
    pts.push({ x: 12 + cx * 14 + r() * 6, y: 14 + cy * (48 / Math.max(rows, 1)) + r() * 5, m: kinds[i] })
  }
  return pts
}
export const QA01_SPECS: { k: string; minus: number; plus: number }[] = [
  { k: 'A', minus: 0, plus: 0 }, { k: 'B', minus: 24, plus: 0 }, { k: 'C', minus: 21, plus: 5 }, { k: 'D', minus: 4, plus: 26 }, { k: 'E', minus: 12, plus: 12 },
]
export const qa01 = () => frame('五種材料 A 到 E 的載子示意圖,負號代表自由電子,正號代表電洞', (
  <g>
    {QA01_SPECS.map((sp, i) => {
      const x0 = 6 + i * 82
      const pts = boxes(sp.minus, sp.plus, 7 + i * 13)
      return (
        <g key={sp.k} transform={`translate(${x0},30)`}>
          <rect width={76} height={76} rx={6} fill="#eef3f8" stroke={INK} strokeWidth={1.6} />
          {pts.map((p, j) => (
            <text key={j} x={p.x * 0.8 + 2} y={p.y * 1.1 + 8} fontSize={12} fontWeight={800} fill={INK} textAnchor="middle">{p.m ? '−' : '+'}</text>
          ))}
          <text x={38} y={98} textAnchor="middle" fontSize={14} fontWeight={800} fill={INK}>{sp.k}</text>
        </g>
      )
    })}
  </g>
), 150)

/** 歷屆 108 年 PY-02:兩條二極體 I-V 曲線 */
const iv = (vg: number) => {
  const nvt = 0.0259
  const is = 1e-3 / Math.exp(vg / nvt)
  return (v: number) => (v >= 0 ? is * (Math.exp(v / nvt) - 1) * 1e3 : -is * 1e3 * 5)
}
export const py02 = () => (
  <figure>
    <WaveChart ariaLabel="兩條二極體 I-V 曲線,橫軸為二極體電壓 VD,縱軸為電流 ID(毫安),曲線 1 的導通電壓較曲線 2 低"
      series={[{ fn: iv(0.3), color: '#1b6fd1' }, { fn: iv(0.7), color: '#e5383b' }]}
      t0={-0.5} t1={1} yMin={-1} yMax={10} xLabel="VD(V)" yLabel="ID(mA)" samples={900}>
      {({ sx, sy }) => (
        <g fontSize={13} fontWeight={800}>
          <text x={sx(0.38)} y={sy(8.5)} fill="#1b6fd1">(1)</text>
          <text x={sx(0.8)} y={sy(8.5)} fill="#e5383b">(2)</text>
        </g>
      )}
    </WaveChart>
  </figure>
)

const bridgePlain = () => <RectifierDiagram plain kind="bridge" state={solveRectifier('bridge', 1, 100)} v={1} iScale={0.01} />
export const mc09 = bridgePlain
