import { useState, type ReactNode } from 'react'
import WaveChart from '../components/WaveChart'
import Slider from '../components/Slider'
import Formula from '../components/Formula'
import QuickCheck from '../components/QuickCheck'
import { checks12 } from './checks12'
import { makePulse, makeWave, type WaveFn, type WaveKind } from '../core/waveform'
import { mixedRms, pulseAverage, sineRms, symmetricWave } from '../core/physics'

const r = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d
const chk = (id: string) => checks12.find((c) => c.id === id)!

function Block({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="card space-y-3" aria-labelledby={`b${n}`}>
      <h2 id={`b${n}`} className="text-lg font-extrabold text-navy-900">
        <span className="mr-2 rounded-lg bg-grape-500 px-2 text-white">{n}</span>{title}
      </h2>
      {children}
    </section>
  )
}

const Note = ({ children }: { children: ReactNode }) => (
  <p className="rounded-xl bg-sun-100 px-3 py-2 text-sm">{children}</p>
)

/* ① 直流、脈動直流、交流 */
function B1() {
  const dc: WaveFn = () => 3
  const ac = makeWave('sine', 4, 1)
  const items: { name: string; fn: WaveFn; why: string }[] = [
    { name: '純直流', fn: dc, why: '大小不變、極性不變' },
    { name: '脈動直流', fn: (t) => Math.abs(makeWave('sine', 4, 1)(t)), why: '大小會變、極性不變(都在 0 以上)' },
    { name: '交流', fn: ac, why: '極性會正負交替(會穿過 0 V)' },
  ]
  return (
    <Block n={1} title="電壓怎麼隨時間變?先分三種">
      <p>看一個波形,先問兩件事:<b>大小有沒有改變?極性(正負)有沒有改變?</b></p>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.name}>
            <WaveChart ariaLabel={`${it.name}波形`} series={[{ fn: it.fn }]} t0={0} t1={2} yMin={-5} yMax={5} />
            <p className="mt-1 text-center font-bold">{it.name}</p>
            <p className="text-center text-xs">{it.why}</p>
          </div>
        ))}
      </div>
      <QuickCheck c={chk('LC-12-1')} />
    </Block>
  )
}

/* ② 週期與頻率 */
function B2() {
  const [T, setT] = useState(20)
  const f = 1000 / T
  return (
    <Block n={2} title="週期與頻率:一圈要多久?一秒轉幾圈?">
      <p>波形重複一次所需的時間叫<b>週期 T</b>;一秒鐘重複幾次叫<b>頻率 f</b>。兩者互為倒數。</p>
      <Formula block tex="f=\dfrac{1}{T}\qquad T=\dfrac{1}{f}" />
      <Slider label="週期 T" value={T} min={5} max={100} step={5} unit=" ms" onChange={setT} />
      <WaveChart ariaLabel={`週期 ${T} 毫秒的弦波`} series={[{ fn: makeWave('sine', 1, 1 / (T / 1000)) }]} t0={0} t1={0.1} yMin={-1.3} yMax={1.3} xLabel="t(0~100 ms)">
        {({ sx, sy }) => (
          <g stroke="#e5383b" strokeWidth={2}>
            <line x1={sx(0)} x2={sx(T / 1000)} y1={sy(-1.15)} y2={sy(-1.15)} />
            <text x={sx(T / 2000)} y={sy(-1.15) - 4} textAnchor="middle" fill="#e5383b" stroke="none" fontSize={12} fontWeight={700}>T = {T} ms</text>
          </g>
        )}
      </WaveChart>
      <Note>
        T = {T} ms = {r(T / 1000, 3)} s,所以 f = 1 / {r(T / 1000, 3)} s = <b>{r(f, 1)} Hz</b>。
        換單位的提醒:1 ms = 10⁻³ s,1 μs = 10⁻⁶ s;50 μs 的週期就是 f = 1 / (50×10⁻⁶ s) = 20,000 Hz = 20 kHz。
      </Note>
      <QuickCheck c={chk('LC-12-2')} />
    </Block>
  )
}

/* ③ 峰值與有效值 */
function B3() {
  const [vm, setVm] = useState(10)
  const vrms = sineRms(vm)
  return (
    <Block n={3} title="峰值與有效值:電源上標的 110 V 是哪一個?">
      <p>
        <b>峰值 V<sub>m</sub></b> 是波形最高點。<b>有效值 V<sub>rms</sub></b> 是「在同一個電阻上,產生的熱和多少伏特的直流一樣」。
        弦波的有效值是峰值的 1/√2,約 0.707 倍。
      </p>
      <Formula block tex="V_{rms}=\dfrac{V_m}{\sqrt{2}}\approx 0.707\,V_m\qquad V_m=\sqrt{2}\,V_{rms}\approx 1.414\,V_{rms}" />
      <Slider label="峰值 Vm" value={vm} min={1} max={20} step={0.5} unit=" V" onChange={setVm} />
      <WaveChart ariaLabel="弦波與其峰值、有效值水平線" series={[{ fn: makeWave('sine', vm, 1) }]} t0={0} t1={2} yMin={-21} yMax={21}
        hLines={[{ y: vm, label: `Vm = ${vm} V`, color: '#e5383b' }, { y: vrms, label: `Vrms = ${r(vrms)} V`, color: '#35b84a' }]} />
      <Note>V<sub>rms</sub> = {vm} ÷ 1.414 ≈ <b>{r(vrms)} V</b>。反過來:AC 110 V 的峰值是 110 × 1.414 ≈ 155.6 V。</Note>
      <QuickCheck c={chk('LC-12-3')} />
    </Block>
  )
}

/* ④ 脈波與工作週期 */
function B4() {
  const [vh, setVh] = useState(10)
  const [vl, setVl] = useState(-2)
  const [d, setD] = useState(60)
  const avg = pulseAverage(vh, vl, d / 100)
  return (
    <Block n={4} title="脈波的工作週期:高電位佔了多少比例?">
      <p><b>工作週期 D</b> = 高電位時間 ÷ 整個週期。平均值就是「高低位準依時間比例加權」。</p>
      <Formula block tex="D=\dfrac{t_H}{t_H+t_L}\qquad V_{av}=V_H\cdot D+V_L\cdot(1-D)" />
      <div className="grid gap-2 sm:grid-cols-3">
        <Slider label="高位準 VH" value={vh} min={0} max={12} unit=" V" onChange={setVh} />
        <Slider label="低位準 VL" value={vl} min={-6} max={0} unit=" V" onChange={setVl} />
        <Slider label="工作週期 D" value={d} min={10} max={90} step={10} unit=" %" onChange={setD} />
      </div>
      <WaveChart ariaLabel="脈波與平均值水平線" series={[{ fn: makePulse(vh, vl, d / 100, 1) }]} t0={0} t1={3} yMin={-7} yMax={13}
        hLines={[{ y: avg, label: `Vav = ${r(avg)} V`, color: '#7a4fd6' }]} />
      <Note>
        V<sub>av</sub> = {vh} × {r(d / 100)} + ({vl}) × {r(1 - d / 100)} = <b>{r(avg)} V</b>。
        對照習作:VH = 10 V、VL = −2 V、Vav = 5.2 V 時,D = 60%。把滑桿調調看!
      </Note>
      <QuickCheck c={chk('LC-12-4')} />
    </Block>
  )
}

/* ⑤ 波形因數與波峰因數 */
function B5() {
  const [kind, setKind] = useState<WaveKind>('sine')
  const names: Record<WaveKind, string> = { sine: '弦波', square: '方波', triangle: '三角波', sawtooth: '鋸齒波' }
  const w = symmetricWave(kind, 1)
  const absAvg = w.rms / w.formFactor
  return (
    <Block n={5} title="波形因數與波峰因數:幫波形取個「形狀指紋」">
      <p>
        不同波形的 V<sub>m</sub>、V<sub>rms</sub>、整流平均值 V<sub>av</sub> 比例不同。
        <b>波形因數 FF</b> 看有效值是平均值的幾倍;<b>波峰因數 CF</b> 看峰值是有效值的幾倍。
      </p>
      <Formula block tex="FF=\dfrac{V_{rms}}{V_{av}}\qquad CF=\dfrac{V_m}{V_{rms}}" />
      <div className="flex flex-wrap gap-2" role="group" aria-label="選擇波形">
        {(Object.keys(names) as WaveKind[]).map((k) => (
          <button key={k} className={`btn ${kind === k ? 'btn-sun' : 'btn-ghost'}`} aria-pressed={kind === k} onClick={() => setKind(k)}>{names[k]}</button>
        ))}
      </div>
      <WaveChart ariaLabel={`${names[kind]}與 Vm、Vrms、Vav`} series={[{ fn: makeWave(kind, 1, 1) }]} t0={0} t1={2} yMin={-1.3} yMax={1.3}
        hLines={[{ y: 1, label: 'Vm = 1', color: '#e5383b' }, { y: w.rms, label: `Vrms = ${r(w.rms, 3)}`, color: '#35b84a' }, { y: absAvg, label: `Vav = ${r(absAvg, 3)}`, color: '#7a4fd6' }]} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead><tr className="bg-sun-100"><th className="p-1">波形</th><th>Vrms/Vm</th><th>Vav/Vm</th><th>FF</th><th>CF</th></tr></thead>
          <tbody>
            {(Object.keys(names) as WaveKind[]).map((k) => {
              const x = symmetricWave(k, 1)
              return (
                <tr key={k} className={k === kind ? 'bg-teal-100 font-bold' : ''}>
                  <td className="p-1">{names[k]}</td><td>{r(x.rms, 3)}</td><td>{r(x.rms / x.formFactor, 3)}</td><td>{r(x.formFactor, 3)}</td><td>{r(x.crestFactor, 3)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Note>這裡的 V<sub>av</sub> 是「整流後(取絕對值)的平均」;一般對稱交流波的整個週期平均是 0,所以算 FF 才要用整流平均。</Note>
      <QuickCheck c={chk('LC-12-5')} />
    </Block>
  )
}

/* ⑥ 相位與交直流混合 */
function B6() {
  const [phi, setPhi] = useState(60)
  const [vdc, setVdc] = useState(4)
  const [vac, setVac] = useState(4.24)
  const vr = mixedRms(vdc, [vac])
  return (
    <Block n={6} title="相位差與交直流混合波">
      <p><b>相位差</b>:兩個同頻率波形,一個比另一個「早到(超前)」或「晚到(落後)」幾度。<b>只有頻率相同的波才談得出相位差。</b></p>
      <Slider label="v₂ 的相角 φ(v₁ 相角為 0°)" value={phi} min={-180} max={180} step={15} unit="°" onChange={setPhi} />
      <WaveChart ariaLabel="兩個同頻弦波的相位差" series={[{ fn: makeWave('sine', 1, 1, 0), color: '#1b6fd1' }, { fn: makeWave('sine', 1, 1, phi), color: '#ff7a59' }]} t0={0} t1={2} yMin={-1.3} yMax={1.3} />
      <Note>藍:v₁ = sin(ωt);橘:v₂ = sin(ωt + {phi}°)。相位差 = {phi}°{phi > 0 ? '(橘色超前藍色)' : phi < 0 ? '(橘色落後藍色)' : '(同相)'}。
        提醒:cos(x) = sin(x + 90°),比較前要先把 cos 換成 sin。</Note>
      <hr className="border-navy-800/20" />
      <p><b>交直流混合波</b>:直流與交流同時存在時,有效值要「先平方、再相加、再開根號」,<b>不能直接把有效值相加</b>。</p>
      <Formula block tex="V_{rms}=\sqrt{V_{dc}^{2}+\left(\dfrac{V_{m,ac}}{\sqrt{2}}\right)^{2}}" />
      <div className="grid gap-2 sm:grid-cols-2">
        <Slider label="直流 Vdc" value={vdc} min={0} max={8} step={0.5} unit=" V" onChange={setVdc} />
        <Slider label="交流峰值" value={vac} min={0} max={8} step={0.01} unit=" V" onChange={setVac} />
      </div>
      <WaveChart ariaLabel="交直流混合波" series={[{ fn: (t) => vdc + makeWave('sine', vac, 1)(t) }]} t0={0} t1={2} yMin={-10} yMax={16}
        hLines={[{ y: vdc, label: `Vdc = ${vdc} V`, color: '#7a4fd6' }, { y: vr, label: `Vrms = ${r(vr)} V`, color: '#35b84a' }]} />
      <Note>V<sub>rms</sub> = √({vdc}² + ({r(vac)}/1.414)²) = <b>{r(vr)} V</b>。把交流峰值設成 4.24 V(= 3√2)、直流 4 V 試試。</Note>
      <QuickCheck c={chk('LC-12-6')} />
    </Block>
  )
}

export default function Lesson12() {
  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-white/90 p-3 text-sm">
        每一段只學一個小觀念,拖拖看滑桿、做一題小檢核再往下。圖與數字都是用公式即時算出來的,不是示意動畫。
      </p>
      <B1 /><B2 /><B3 /><B4 /><B5 /><B6 />
    </div>
  )
}
