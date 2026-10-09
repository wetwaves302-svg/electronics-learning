import { useMemo, useState } from 'react'
import { Block, Note, sci } from './ui'
import QuickCheck from '../components/QuickCheck'
import Slider from '../components/Slider'
import Formula from '../components/Formula'
import WaveChart from '../components/WaveChart'
import { checks21 } from './checks21'
import { MATERIALS, dopedCarriers, kT, niAt } from '../core/semiconductor'
import { EV_TO_JOULE, dopantConcentration } from '../core/physics'

const chk = (id: string) => checks21.find((c) => c.id === id)!
const INK = '#17407a'

/* ① 矽原子(概念示意) */
function AtomView() {
  const [showValence, setShowValence] = useState(true)
  const shells = [{ r: 34, n: 2 }, { r: 62, n: 8 }, { r: 90, n: 4 }]
  return (
    <div className="space-y-2">
      <svg viewBox="-110 -110 220 220" role="img" aria-label="矽原子示意圖:原子核外三層電子,最外層有 4 個價電子" className="mx-auto w-full max-w-xs rounded-xl border-2 border-navy-800/30 bg-white">
        <circle r={16} fill="#e5383b" /><text y={5} textAnchor="middle" fontSize={12} fontWeight={800} fill="#fff">+14</text>
        {shells.map((s, si) => (
          <g key={si}>
            <circle r={s.r} fill="none" stroke="#9db4cf" strokeDasharray="4 3" />
            {Array.from({ length: s.n }, (_, i) => {
              const a = (i / s.n) * 2 * Math.PI - Math.PI / 4
              const outer = si === 2
              return <circle key={i} cx={s.r * Math.cos(a)} cy={s.r * Math.sin(a)} r={6} fill={outer && showValence ? '#ffcf33' : '#1b6fd1'} stroke={INK} strokeWidth={1.5} />
            })}
          </g>
        ))}
      </svg>
      <label className="flex items-center justify-center gap-2 text-sm">
        <input type="checkbox" checked={showValence} onChange={(e) => setShowValence(e.target.checked)} className="h-5 w-5" /> 標出價電子(黃色)
      </label>
      <p className="text-center text-xs text-slate-600">概念示意圖:實際電子不是沿固定圓軌道運動。矽原子序 14,電子 2 + 8 + 4。</p>
    </div>
  )
}

/* ② 能帶、能隙與溫度 */
function BandLab() {
  const [mi, setMi] = useState(0)
  const [t, setT] = useState(300)
  const [e, setE] = useState(0.8)
  const m = MATERIALS[mi]
  const ni = niAt(m, t)
  const jump = e >= m.egEv
  const logNi = Math.log10(ni)
  const dots = Math.max(0, Math.min(10, Math.round(logNi - 5))) // 概念示意:ni 愈大,畫的電子-電洞對愈多
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="選擇材料">
        {MATERIALS.map((x, i) => <button key={x.id} aria-pressed={mi === i} onClick={() => setMi(i)} className={`btn text-sm ${mi === i ? 'btn-sun' : 'btn-ghost'}`}>{x.name}(Eg = {x.egEv} eV)</button>)}
      </div>
      <svg viewBox="0 0 300 200" role="img" aria-label={`能帶圖:價帶、傳導帶與能隙 ${m.egEv} eV`} className="w-full rounded-xl border-2 border-navy-800/30 bg-white">
        <rect x={40} y={20} width={150} height={50} fill="#d7f3ef" stroke={INK} strokeWidth={2} /><text x={115} y={50} textAnchor="middle" fontSize={13} fontWeight={800} fill={INK}>傳導帶</text>
        <rect x={40} y={130} width={150} height={50} fill="#ffe9a8" stroke={INK} strokeWidth={2} /><text x={115} y={160} textAnchor="middle" fontSize={13} fontWeight={800} fill={INK}>價帶</text>
        <line x1={205} y1={70} x2={205} y2={130} stroke="#e5383b" strokeWidth={2} /><polygon points="205,70 200,80 210,80" fill="#e5383b" /><polygon points="205,130 200,120 210,120" fill="#e5383b" />
        <text x={215} y={105} fontSize={13} fontWeight={800} fill="#e5383b">Eg = {m.egEv} eV</text>
        {Array.from({ length: dots }, (_, i) => (<g key={i}><circle cx={55 + i * 13} cy={35 + (i % 3) * 10} r={4} fill="#1b6fd1" /><circle cx={55 + i * 13} cy={145 + (i % 3) * 10} r={4} fill="#fff" stroke={INK} strokeWidth={1.5} /></g>))}
        {jump && <><circle cx={250} cy={150} r={5} fill="#fff" stroke={INK} strokeWidth={1.5} /><circle cx={250} cy={40} r={5} fill="#1b6fd1" /><line x1={250} y1={145} x2={250} y2={46} stroke="#35b84a" strokeWidth={2} strokeDasharray="4 3" /></>}
        <text x={8} y={196} fontSize={10} fill="#555">● 自由電子 ○ 電洞(顆數僅為示意:ni 愈大畫愈多)</text>
      </svg>
      <Slider label="價電子吸收的能量 E(例如光子或熱)" value={e} min={0} max={2} step={0.05} unit=" eV" onChange={setE} />
      <p role="status" aria-live="polite" className="rounded-xl bg-sun-100 px-3 py-2 text-sm">
        E = {e} eV {jump ? '≥' : '<'} Eg = {m.egEv} eV → <b>{jump ? '價電子可以脫離,產生一對自由電子與電洞' : '能量不夠,價電子仍留在價帶'}</b>。
      </p>
      <Slider label="溫度 T" value={t} min={200} max={400} step={5} unit=" K" onChange={setT} />
      <WaveChart ariaLabel={`${m.name} 的本質載子濃度對溫度,縱軸為 log10(ni)`} series={[{ fn: (x) => Math.log10(niAt(m, x)), color: '#1b6fd1' }]} t0={200} t1={400} yMin={0} yMax={16} xLabel="溫度 T(K)" yLabel="log10 ni(/cm³)" axes>
        {({ sx, sy }) => <g><circle cx={sx(t)} cy={sy(logNi)} r={5} fill="#e5383b" stroke="#fff" strokeWidth={1.5} /></g>}
      </WaveChart>
      <p role="status" className="rounded-xl bg-sun-100 px-3 py-2 text-sm">
        {m.name} 在 {t} K:ni ≈ <b>{sci(ni)} /cm³</b>(300 K 時為 {sci(m.ni300)})。熱能 kT = {kT(t).toFixed(4)} eV(300 K 約 0.0259 eV)。
      </p>
      <Formula block tex="n_i\propto T^{3/2}\,e^{-E_g/(2kT)}" />
      <Note>溫度升高,ni 以指數方式快速變大;能隙愈小,同溫度下 ni 愈大。矽在 300 K 的 ni = 1.5×10¹⁰ /cm³,與習作一致。這條曲線是用公式算出來的,不是示意。</Note>
    </div>
  )
}

/* ③ 導體、半導體、絕緣體 */
function ClassView() {
  const rows: { name: string; kind: string; eg: number | null; text: string }[] = [
    { name: '導體(金、銀、銅、鋁、錫、石墨…)', kind: '導體', eg: 0, text: '價帶與傳導帶重疊(沒有能隙),隨時有大量自由電子。' },
    { name: '鍺 Ge', kind: '半導體', eg: 0.67, text: '能隙小,常溫下就有一些自由電子。' },
    { name: '矽 Si', kind: '半導體', eg: 1.12, text: '最常用的半導體材料。' },
    { name: '砷化鎵 GaAs', kind: '半導體', eg: 1.42, text: '也是常用的半導體材料。' },
    { name: '絕緣體(石英、玻璃、雲母、油、尼龍、木頭、乾燥空氣…)', kind: '絕緣體', eg: null, text: '能隙很大(通常超過 5 eV),常溫下幾乎沒有自由電子。' },
  ]
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.name} className="rounded-xl border-2 border-navy-800/30 bg-white p-2">
            <div className="flex items-center justify-between gap-2"><span className="text-sm font-bold">{r.name}</span><span className="rounded-md bg-grape-500 px-2 text-xs font-bold text-white">{r.kind}</span></div>
            <div className="mt-1 h-3 rounded-full bg-mist"><div className="h-3 rounded-full bg-teal-500" style={{ width: `${r.eg === null ? 100 : (r.eg / 5) * 100}%` }} /></div>
            <p className="mt-1 text-xs">{r.eg === null ? '能隙 > 5 eV' : r.eg === 0 ? '能隙 = 0(重疊)' : `能隙 ${r.eg} eV`}:{r.text}</p>
          </li>
        ))}
      </ul>
      <Note>橫條長度代表能隙大小(滿格 = 5 eV 以上)。常溫(300 K)的熱能只有約 0.026 eV,矽的能隙是它的 43 倍,所以純矽在室溫導電能力很弱;這就是為什麼要「摻雜」。</Note>
    </div>
  )
}

/* ④ 摻雜實驗 */
const DONORS = ['磷 P', '砷 As', '銻 Sb']
const ACCEPTORS = ['鋁 Al', '鎵 Ga', '銦 In']
function DopingLab() {
  const [n, setN] = useState(true)
  const [dopant, setDopant] = useState(0)
  const [k, setK] = useState(9)
  const [temp] = useState(300)
  const ni = niAt(MATERIALS[0], temp)
  const net = dopantConcentration(5e22, 10 ** k)
  const c = useMemo(() => dopedCarriers(ni, net, n), [ni, net, n])
  const major = n ? c.n : c.p
  const minor = n ? c.p : c.n
  const bars = [
    { label: n ? '電子 n(多數)' : '電子 n(少數)', v: c.n, color: '#1b6fd1' },
    { label: n ? '電洞 p(少數)' : '電洞 p(多數)', v: c.p, color: '#e5383b' },
    { label: '本質 ni(未摻雜)', v: ni, color: '#9db4cf' },
  ]
  const lo = 0, hi = 18
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="摻雜種類">
        <button className={`btn text-sm ${n ? 'btn-sun' : 'btn-ghost'}`} aria-pressed={n} onClick={() => { setN(true); setDopant(0) }}>摻 5 價元素(施體)</button>
        <button className={`btn text-sm ${!n ? 'btn-sun' : 'btn-ghost'}`} aria-pressed={!n} onClick={() => { setN(false); setDopant(0) }}>摻 3 價元素(受體)</button>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="雜質元素">
        {(n ? DONORS : ACCEPTORS).map((d, i) => <button key={d} className={`btn text-sm ${dopant === i ? 'btn-primary' : 'btn-ghost'}`} aria-pressed={dopant === i} onClick={() => setDopant(i)}>{d}</button>)}
      </div>
      <Slider label="摻雜濃度:每多少個矽原子摻入 1 個雜質" value={k} min={7} max={11} step={1} unit="(10 的次方)" onChange={setK} />
      <svg viewBox="0 0 300 130" role="img" aria-label="載子濃度長條圖(對數刻度)" className="w-full rounded-xl border-2 border-navy-800/30 bg-white">
        {[0, 3, 6, 9, 12, 15, 18].map((p) => { const x = 90 + ((p - lo) / (hi - lo)) * 200; return <g key={p}><line x1={x} y1={10} x2={x} y2={100} stroke="#d5e0ec" /><text x={x} y={114} fontSize={9} textAnchor="middle" fill="#555">10^{p}</text></g> })}
        {bars.map((b, i) => { const w = ((Math.log10(b.v) - lo) / (hi - lo)) * 200; return <g key={b.label}><text x={4} y={26 + i * 30} fontSize={10} fontWeight={700} fill={INK}>{b.label}</text><rect x={90} y={14 + i * 30} width={Math.max(2, w)} height={18} fill={b.color} rx={3} /></g> })}
      </svg>
      <div role="status" aria-live="polite" className="rounded-xl bg-sun-100 px-3 py-2 text-sm space-y-1">
        <p>每 10<sup>{k}</sup> 個矽原子摻 1 個 {(n ? DONORS : ACCEPTORS)[dopant]}:雜質濃度 = 5×10²² ÷ 10<sup>{k}</sup> = <b>{sci(net)} /cm³</b>。</p>
        <p>{n ? '電子' : '電洞'}(多數載子)≈ <b>{sci(major)}</b>;{n ? '電洞' : '電子'}(少數載子)= ni²/多數 ≈ <b>{sci(minor)}</b> /cm³。</p>
        <p>驗算:n × p = {sci(c.n * c.p)} = ni² = {sci(ni * ni)}。</p>
      </div>
      <Formula block tex="n\cdot p=n_i^{2}\qquad N\gg n_i\Rightarrow\text{多數載子}\approx N,\;\text{少數載子}\approx\dfrac{n_i^{2}}{N}" />
      <Note>
        對照習作:每 10⁹ 個原子摻 1 個施體 → Nd = 5×10¹³,電洞 p ≈ 4.5×10⁶ /cm³(請把滑桿調到 9 試試)。
        這裡用的是精確的電中性公式;當雜質濃度遠大於 ni(如這裡),結果與課本的近似式幾乎相同。
        注意:摻雜讓多數載子增加了好幾千倍,但整塊材料仍然是電中性的(施體離子帶正電,抵消多出來的電子)。
      </Note>
    </div>
  )
}

/* ⑤ 晶格示意:N 型與 P 型 */
function Lattice() {
  const [n, setN] = useState(true)
  const atoms: [number, number][] = [[50, 40], [130, 40], [210, 40], [50, 110], [130, 110], [210, 110]]
  const dopantAt = 4
  return (
    <div className="space-y-2">
      <div className="flex gap-2"><button className={`btn text-sm ${n ? 'btn-sun' : 'btn-ghost'}`} aria-pressed={n} onClick={() => setN(true)}>N 型(摻 5 價)</button><button className={`btn text-sm ${!n ? 'btn-sun' : 'btn-ghost'}`} aria-pressed={!n} onClick={() => setN(false)}>P 型(摻 3 價)</button></div>
      <svg viewBox="0 0 270 160" role="img" aria-label={n ? 'N 型半導體的晶格示意,摻入的 5 價原子多出一個自由電子' : 'P 型半導體的晶格示意,摻入的 3 價原子留下一個電洞'} className="w-full rounded-xl border-2 border-navy-800/30 bg-white">
        {atoms.map(([x, y], i) => (<g key={i}>
          {i % 3 !== 2 && <line x1={x + 18} y1={y} x2={atoms[i + 1][0] - 18} y2={y} stroke="#1b6fd1" strokeWidth={3} />}
          {i < 3 && <line x1={x} y1={y + 18} x2={x} y2={atoms[i + 3][1] - 18} stroke="#1b6fd1" strokeWidth={3} />}
          <circle cx={x} cy={y} r={16} fill={i === dopantAt ? (n ? '#ffcf33' : '#c9b8f5') : '#d7f3ef'} stroke={INK} strokeWidth={2} />
          <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill={INK}>{i === dopantAt ? (n ? 'P' : 'B') : 'Si'}</text>
        </g>))}
        {n ? <><circle cx={165} cy={90} r={6} fill="#1b6fd1" stroke={INK} strokeWidth={1.5} /><text x={175} y={86} fontSize={11} fontWeight={800} fill="#1b6fd1">多出的自由電子</text></> : <><circle cx={92} cy={110} r={7} fill="#fff" stroke="#e5383b" strokeWidth={2} /><text x={72} y={140} fontSize={11} fontWeight={800} fill="#e5383b">電洞(缺一個電子)</text></>}
      </svg>
      <p className="text-center text-xs text-slate-600">概念示意:黃(磷,5 價)、紫(硼,3 價)只是代表;藍線表示共價鍵。講義列出的 5 價:磷、砷、銻;3 價:鋁、鎵、銦。</p>
    </div>
  )
}

/* ⑥ eV */
function EvConv() {
  const [ev, setEv] = useState(1.12)
  return (
    <div className="space-y-2">
      <Slider label="能量" value={ev} min={0.1} max={3} step={0.01} unit=" eV" onChange={setEv} />
      <p role="status" className="rounded-xl bg-sun-100 px-3 py-2 text-sm"><b>{ev} eV</b> = {ev} × 1.6×10⁻¹⁹ J = <b>{sci(ev * EV_TO_JOULE)} J</b>。(矽的能隙 1.12 eV ≈ {sci(1.12 * EV_TO_JOULE)} J。)</p>
      <Formula block tex="1\,\mathrm{eV}=1.6\times10^{-19}\,\mathrm{C}\times1\,\mathrm{V}=1.6\times10^{-19}\,\mathrm{J}" />
      <Note>eV 是「能量」的單位(電荷 × 電壓),不是電壓的單位。習作歷屆題考過。</Note>
    </div>
  )
}

export default function Lesson21() {
  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-white/90 p-3 text-sm">這一單元要搞懂:為什麼半導體能「被我們控制」。先從原子與價電子開始,再看能隙、溫度、摻雜。每一段都有可以操作的實驗。</p>
      <Block n={1} title="原子與價電子"><p>原子核外的電子分層排列。最外層的電子叫<b>價電子</b>,它們決定材料怎麼導電、怎麼和鄰居結合。</p><AtomView /><QuickCheck c={chk('LC-21-1')} /></Block>
      <Block n={2} title="自由電子、電洞與能隙">
        <p>在絕對零度附近,價電子都被束縛在共價鍵中。價電子吸收足夠的能量後,會脫離共價鍵成為<b>自由電子</b>,同時留下一個空缺,稱為<b>電洞</b>。「足夠」的意思是:大於或等於<b>能隙 Eg</b>。</p>
        <BandLab />
        <QuickCheck c={chk('LC-21-2')} /><QuickCheck c={chk('LC-21-3')} />
      </Block>
      <Block n={3} title="導體、半導體、絕緣體"><p>差別在能隙:導體沒有能隙,絕緣體的能隙很大,半導體介於中間。</p><ClassView /></Block>
      <Block n={4} title="摻雜:N 型與 P 型">
        <p>純半導體(本質半導體)導電能力差。加入少量其他元素(<b>摻雜</b>)就能大幅改變導電能力,這樣的半導體叫<b>外質半導體</b>。</p>
        <Lattice />
        <QuickCheck c={chk('LC-21-4')} />
      </Block>
      <Block n={5} title="多數載子與少數載子:動手摻雜"><p>摻雜之後,一種載子變得很多(多數載子),另一種反而變少(少數載子),兩者濃度相乘永遠等於 ni²。</p><DopingLab /><QuickCheck c={chk('LC-21-5')} /><QuickCheck c={chk('LC-21-6')} /></Block>
      <Block n={6} title="電子伏特 eV:描述能隙的單位"><p>能隙是「能量」,最方便的單位是電子伏特。</p><EvConv /><QuickCheck c={chk('LC-21-7')} /></Block>
    </div>
  )
}
