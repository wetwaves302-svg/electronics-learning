import { useMemo, useState } from 'react'
import { Block, Note, sci } from './ui'
import QuickCheck from '../components/QuickCheck'
import Slider from '../components/Slider'
import Formula from '../components/Formula'
import WaveChart from '../components/WaveChart'
import { checks22 } from './checks22'
import { depletionRel, diodeI, diodeV, isFromPoint, solveSeries, vfAtTemp, type DiodeModel } from '../core/semiconductor'
import { dynamicResistance } from '../core/physics'
import { mc07Solve } from '../data/coach/ch2b'

const chk = (id: string) => checks22.find((c) => c.id === id)!
const INK = '#17407a'
const NVT = 0.025 // 習作取 VT = 25 mV
const MATS = [
  { id: 'si', name: '矽二極體', vf: 0.65, vbi: 0.7 },
  { id: 'ge', name: '鍺二極體', vf: 0.25, vbi: 0.3 },
]

/* ① PN 接面如何形成 */
function Formation() {
  const [step, setStep] = useState(0)
  const texts = [
    'P 型(電洞多)與 N 型(電子多)半導體,各自是電中性的,還沒有接在一起。',
    '兩者接合的瞬間:濃度差使電洞往 N 側擴散、電子往 P 側擴散(擴散電流)。',
    '擴散過去的載子與對面的載子複合,在接面兩側留下不能移動的離子:P 側為負離子、N 側為正離子,形成空乏區。',
    '離子產生內建電場,方向會阻擋進一步的擴散(產生漂移電流)。擴散與漂移平衡後,空乏區兩端就有一個固定的電位差,稱為障壁電壓(矽約 0.7 V、鍺約 0.3 V)。',
  ]
  const holes = [[30, 30], [60, 70], [90, 40], [40, 100], [100, 90], [70, 20]]
  const elecs = [[190, 30], [220, 70], [250, 40], [200, 100], [260, 90], [230, 20]]
  const dep = step >= 2
  return (
    <div className="space-y-2">
      <svg viewBox="0 0 300 150" role="img" aria-label={`PN 接面形成示意圖,第 ${step + 1} 步`} className="w-full rounded-xl border-2 border-navy-800/30 bg-white">
        <rect x={10} y={10} width={140} height={110} fill="#ffe9ee" stroke={INK} strokeWidth={2} /><rect x={150} y={10} width={140} height={110} fill="#e2f0ff" stroke={INK} strokeWidth={2} />
        <text x={80} y={140} textAnchor="middle" fontSize={13} fontWeight={800} fill={INK}>P 型</text><text x={220} y={140} textAnchor="middle" fontSize={13} fontWeight={800} fill={INK}>N 型</text>
        {dep && <rect x={118} y={10} width={64} height={110} fill="#fff6c9" stroke="#e5a600" strokeDasharray="4 3" />}
        {holes.filter(([x]) => !dep || x < 112).map(([x, y], i) => <circle key={'h' + i} cx={x} cy={y} r={5} fill="#fff" stroke="#e5383b" strokeWidth={2} />)}
        {elecs.filter(([x]) => !dep || x > 188).map(([x, y], i) => <circle key={'e' + i} cx={x} cy={y} r={5} fill="#1b6fd1" />)}
        {step === 1 && <><line x1={110} y1={65} x2={175} y2={65} stroke="#e5383b" strokeWidth={2} /><polygon points="175,65 166,60 166,70" fill="#e5383b" /><line x1={190} y1={85} x2={125} y2={85} stroke="#1b6fd1" strokeWidth={2} /><polygon points="125,85 134,80 134,90" fill="#1b6fd1" /></>}
        {dep && [0, 1, 2].map((i) => <g key={i}><text x={128} y={40 + i * 32} fontSize={16} fontWeight={800} fill="#e5383b" textAnchor="middle">−</text><text x={172} y={40 + i * 32} fontSize={16} fontWeight={800} fill="#1b6fd1" textAnchor="middle">+</text></g>)}
        {step === 3 && <><line x1={168} y1={110} x2={132} y2={110} stroke="#35b84a" strokeWidth={3} /><polygon points="132,110 141,105 141,115" fill="#35b84a" /><text x={150} y={104} fontSize={10} textAnchor="middle" fill="#2a8a3a" fontWeight={700}>內建電場</text></>}
        {dep && <text x={150} y={20} textAnchor="middle" fontSize={11} fontWeight={800} fill="#a07000">空乏區</text>}
      </svg>
      <p role="status" aria-live="polite" className="rounded-xl bg-sun-100 px-3 py-2 text-sm">{texts[step]}</p>
      <div className="flex gap-2"><button className="btn btn-ghost text-sm" disabled={step === 0} onClick={() => setStep(step - 1)}>◀ 上一步</button><button className="btn btn-primary text-sm" disabled={step === 3} onClick={() => setStep(step + 1)}>下一步 ▶</button></div>
      <p className="text-xs text-slate-600">概念示意圖(○ 電洞、● 電子)。</p>
    </div>
  )
}

/* ② 偏壓、空乏區與 V-I 曲線 */
function BiasLab() {
  const [mi, setMi] = useState(0)
  const [v, setV] = useState(0.5)
  const m = MATS[mi]
  const is = isFromPoint(m.vf, NVT)
  const i = diodeI(v, is, NVT)
  const w = depletionRel(v, m.vbi)
  const region = v > 0.02 ? '順向偏壓' : v < -0.02 ? '逆向偏壓' : '未加偏壓'
  const iMa = (x: number) => Math.min(diodeI(x, is, NVT) * 1000, 12)
  return (
    <div className="space-y-3">
      <div className="flex gap-2" role="group" aria-label="材料">{MATS.map((x, k) => <button key={x.id} aria-pressed={mi === k} onClick={() => setMi(k)} className={`btn text-sm ${mi === k ? 'btn-sun' : 'btn-ghost'}`}>{x.name}</button>)}</div>
      <Slider label="外加偏壓 VD(正:順向,負:逆向)" value={v} min={-2} max={Math.round((m.vbi + 0.1) * 100) / 100} step={0.01} unit=" V" onChange={setV} />
      <svg viewBox="0 0 300 110" role="img" aria-label={`空乏區寬度示意:${region}`} className="w-full rounded-xl border-2 border-navy-800/30 bg-white">
        <rect x={10} y={20} width={130} height={60} fill="#ffe9ee" stroke={INK} strokeWidth={2} /><rect x={160} y={20} width={130} height={60} fill="#e2f0ff" stroke={INK} strokeWidth={2} />
        <rect x={150 - 22 * w - 4} y={20} width={44 * w + 8} height={60} fill="#fff6c9" stroke="#e5a600" strokeDasharray="4 3" />
        <text x={75} y={55} textAnchor="middle" fontSize={13} fontWeight={800} fill={INK}>P</text><text x={225} y={55} textAnchor="middle" fontSize={13} fontWeight={800} fill={INK}>N</text>
        <text x={150} y={100} textAnchor="middle" fontSize={11} fontWeight={800} fill="#a07000">空乏區寬度 = 零偏壓時的 {Math.round(w * 100)}%</text>
        <text x={10} y={12} fontSize={11} fontWeight={800} fill={v > 0 ? '#e5383b' : INK}>{v >= 0 ? '+' : '−'}</text><text x={290} y={12} textAnchor="end" fontSize={11} fontWeight={800} fill={v > 0 ? INK : '#e5383b'}>{v >= 0 ? '−' : '+'}</text>
      </svg>
      <WaveChart ariaLabel={`${m.name} 的 V-I 特性曲線,目前工作點`} series={[{ fn: iMa, color: '#1b6fd1' }]} t0={-2} t1={1} yMin={-1} yMax={12} xLabel="VD(V)" yLabel="ID(mA)" samples={900}>
        {({ sx, sy }) => <circle cx={sx(v)} cy={sy(Math.max(-1, Math.min(12, i * 1000)))} r={5} fill="#e5383b" stroke="#fff" strokeWidth={1.5} />}
      </WaveChart>
      <p role="status" aria-live="polite" className="rounded-xl bg-sun-100 px-3 py-2 text-sm">
        {region}:VD = {v.toFixed(2)} V,ID ≈ <b>{i >= 0 ? '' : '−'}{sci(Math.abs(i))} A</b>{v < -0.1 ? '(只有極小的逆向飽和電流,約 −Is)' : v > 0 ? `(${m.vf} V 附近電流約 1 mA,再多一點電壓,電流就急速上升)` : ''}。
        {v >= m.vbi && ' 偏壓已達障壁電壓,空乏區幾乎消失。'}
      </p>
      <Formula block tex="I_D=I_S\left(e^{V_D/V_T}-1\right)\qquad V_T\approx25\,\mathrm{mV}" />
      <Note>順向偏壓使空乏區變窄、電流指數上升;逆向偏壓使空乏區變寬,只剩極小的逆向飽和電流。空乏區寬度由公式 W ∝ √(障壁電壓 − VD) 算出(圖為比例示意)。逆向電壓夠大時會進入「崩潰區」,電流急速增加,可能燒毀二極體(這裡不畫出)。</Note>
    </div>
  )
}

/* ③ 靜態電阻與動態電阻 */
function Resistance() {
  const [k, setK] = useState(0) // IDQ = 10^(k/10 - 1) mA?  k in 0..30 → 0.1..100? limit 0.1..20 mA
  const idq = 0.1 * Math.pow(200, k / 30) * 1e-3 // 0.1 mA ~ 20 mA (對數刻度)
  const is = isFromPoint(0.65, NVT)
  const v0 = diodeV(idq, is, NVT)
  const rdc = v0 / idq
  const rd = dynamicResistance(idq, NVT)
  const iMa = (x: number) => diodeI(x, is, NVT) * 1000
  const secant = (x: number) => (idq * 1000 * x) / v0
  const tangent = (x: number) => idq * 1000 + ((x - v0) / rd) * 1000
  return (
    <div className="space-y-3">
      <Slider label="工作點電流 IDQ(對數刻度)" value={k} min={0} max={30} step={1} unit="" onChange={setK} />
      <WaveChart ariaLabel="二極體曲線、割線(靜態電阻)與切線(動態電阻)" series={[{ fn: iMa, color: '#1b6fd1' }, { fn: secant, color: '#7a4fd6', dashed: true, width: 2 }, { fn: tangent, color: '#e5383b', dashed: true, width: 2 }]}
        t0={0} t1={0.85} yMin={0} yMax={25} xLabel="VD(V)" yLabel="ID(mA)" samples={500}>
        {({ sx, sy }) => <circle cx={sx(v0)} cy={sy(Math.min(25, idq * 1000))} r={5} fill="#fff" stroke={INK} strokeWidth={2} />}
      </WaveChart>
      <p role="status" aria-live="polite" className="rounded-xl bg-sun-100 px-3 py-2 text-sm">
        IDQ = <b>{(idq * 1000).toFixed(2)} mA</b>,VDQ = {v0.toFixed(3)} V。<br />
        <span className="text-grape-500 font-bold">靜態電阻</span> R<sub>D</sub> = VDQ / IDQ = <b>{Math.round(rdc)} Ω</b>(紫色虛線的斜率倒數,連到原點);<br />
        <span className="text-coral-500 font-bold">動態電阻</span> r<sub>d</sub> = VT / IDQ = 25 mV / {(idq * 1000).toFixed(2)} mA = <b>{rd.toFixed(1)} Ω</b>(紅色虛線的斜率倒數,切線)。
      </p>
      <Formula block tex="R_D=\dfrac{V_{DQ}}{I_{DQ}}\qquad r_d=\dfrac{\Delta V_D}{\Delta I_D}\approx\dfrac{V_T}{I_{DQ}}" />
      <Note>電流愈大,曲線愈陡,動態電阻愈小;靜態電阻只是「這一點的 V ÷ I」。習作題問「動態電阻」時,VD = 0.6 V 這類資料是用不到的。</Note>
    </div>
  )
}

/* ④ 等效模型 */
const MODEL_NAMES: Record<DiodeModel, string> = { ideal: '理想模型', constant: '簡化模型(切入電壓 0.7 V)', piecewise: '進階簡化(0.7 V + 導通電阻 rf)', exponential: '指數(蕭克利)模型' }
function Models() {
  const [e, setE] = useState(5)
  const [rk, setRk] = useState(1)
  const is = isFromPoint(0.65, NVT)
  const p = { vGamma: 0.7, rd: 25, is, nvt: NVT }
  const rows = (['ideal', 'constant', 'piecewise', 'exponential'] as DiodeModel[]).map((m) => ({ m, ...solveSeries(m, e, rk * 1000, p) }))
  const real = rows[3]
  const curves = useMemo(() => ({
    ideal: (x: number) => (x <= 0 ? 0 : 25),
    constant: (x: number) => (x < 0.7 ? 0 : 25),
    piecewise: (x: number) => (x <= 0.7 ? 0 : Math.min(25, ((x - 0.7) / 25) * 1000)),
    exp: (x: number) => Math.min(25, diodeI(x, is, NVT) * 1000),
  }), [is])
  return (
    <div className="space-y-3">
      <WaveChart ariaLabel="三種簡化模型與指數曲線的比較" series={[{ fn: curves.exp, color: '#1b6fd1', width: 3 }, { fn: curves.ideal, color: '#9db4cf', dashed: true, width: 2 }, { fn: curves.constant, color: '#35b84a', dashed: true, width: 2 }, { fn: curves.piecewise, color: '#e5383b', dashed: true, width: 2 }]}
        t0={-0.2} t1={1.0} yMin={-1} yMax={25} xLabel="VD(V)" yLabel="ID(mA)" samples={800} />
      <p className="text-xs">藍實線:真實(指數)曲線;灰:理想;綠:加 0.7 V 切入電壓;紅:再加導通電阻。</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Slider label="電源 E" value={e} min={0} max={10} step={0.5} unit=" V" onChange={setE} />
        <Slider label="串聯電阻 R" value={rk} min={0.5} max={10} step={0.5} unit=" kΩ" onChange={setRk} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-center text-sm">
          <thead><tr className="bg-sun-100"><th className="p-1 text-left">模型</th><th>電流 I</th><th>二極體電壓 VD</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.m} className="border-t border-navy-800/10"><td className="p-1 text-left">{MODEL_NAMES[r.m]}</td><td>{(r.i * 1000).toFixed(3)} mA</td><td>{r.v.toFixed(3)} V</td></tr>)}</tbody>
        </table>
      </div>
      <p role="status" aria-live="polite" className="rounded-xl bg-sun-100 px-3 py-2 text-sm">
        以指數模型為準:I = {(real.i * 1000).toFixed(3)} mA。理想模型的誤差 {real.i > 0 ? Math.round(Math.abs(rows[0].i - real.i) / real.i * 100) : 0}%,簡化模型(0.7 V)誤差 {real.i > 0 ? Math.round(Math.abs(rows[1].i - real.i) / real.i * 100) : 0}%。電源電壓愈大,簡化模型愈準。
      </p>
      <Note>什麼時候用哪個模型?電源遠大於 0.7 V 時,理想模型就夠用;想要更準一點用 0.7 V 切入電壓;需要考慮導通電阻時才用進階模型。習作題標明「理想二極體」時,就用理想模型。</Note>
    </div>
  )
}

/* ⑤ 溫度 */
function Temp() {
  const [t, setT] = useState(65)
  const vf = vfAtTemp(0.65, t)
  const shifted = (x: number) => Math.min(12, diodeI(x, isFromPoint(vf, NVT), NVT) * 1000)
  const base = (x: number) => Math.min(12, diodeI(x, isFromPoint(0.65, NVT), NVT) * 1000)
  return (
    <div className="space-y-3">
      <Slider label="溫度 T" value={t} min={0} max={100} step={5} unit=" ℃" onChange={setT} />
      <WaveChart ariaLabel="溫度改變時的二極體曲線(順向部分向左或向右移動)" series={[{ fn: base, color: '#9db4cf', dashed: true, width: 2 }, { fn: shifted, color: '#e5383b' }]} t0={0.3} t1={0.9} yMin={0} yMax={12} xLabel="VD(V)" yLabel="ID(mA)" />
      <p role="status" aria-live="polite" className="rounded-xl bg-sun-100 px-3 py-2 text-sm">
        T = {t}℃(比 25℃ {t >= 25 ? '高' : '低'} {Math.abs(t - 25)}℃):在 1 mA 時,VD = 0.65 V {t >= 25 ? '−' : '+'} 2.5 mV × {Math.abs(t - 25)} = <b>{vf.toFixed(3)} V</b>。
        {t === 65 && ' 這就是習作歷屆題:0.65 V → 0.55 V。'}
      </p>
      <Note>溫度升高,曲線向左移,同樣電流所需的順向電壓下降(約 −2.5 mV/℃,習作採用;課本範圍約 −1~−2.5 mV/℃)。另外,逆向漏電流會隨溫度上升而增加。</Note>
    </div>
  )
}

/* ⑥ 理想二極體電路:假設 → 驗證 */
function IdealCircuit() {
  const [v1, setV1] = useState(12)
  const [v2, setV2] = useState(2)
  const s = mc07Solve(v1, 3, v2, 1, 1)
  const vo = s.v[5]
  const on = [s.on.D1 && 'D1', s.on.D2 && 'D2'].filter(Boolean) as string[]
  return (
    <div className="space-y-3">
      <p className="text-sm">電路(同習作選擇題 7):V1 → D1 → 3 kΩ → Vo;V2 → D2 → 1 kΩ → Vo;Vo 對地 1 kΩ。二極體為理想。</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Slider label="V1(接 D1、3 kΩ)" value={v1} min={0} max={15} step={1} unit=" V" onChange={setV1} />
        <Slider label="V2(接 D2、1 kΩ)" value={v2} min={0} max={15} step={1} unit=" V" onChange={setV2} />
      </div>
      <div role="status" aria-live="polite" className="space-y-1 rounded-xl bg-sun-100 px-3 py-2 text-sm">
        <p>導通的二極體:<b>{on.length ? on.join('、') : '沒有'}</b>;Vo = <b>{vo.toFixed(2)} V</b>。</p>
        <p>驗證:D1 的 V_AK = {v1} − {vo.toFixed(2)} = {(v1 - vo).toFixed(2)} V → {s.on.D1 ? '大於 0,導通' : '不大於 0,截止'};D2 的 V_AK = {v2} − {vo.toFixed(2)} = {(v2 - vo).toFixed(2)} V → {s.on.D2 ? '大於 0,導通' : '不大於 0,截止'}。</p>
      </div>
      <Note>解題流程:①假設電位較高的那顆導通 → ②算出 Vo → ③檢查每顆二極體:導通的電流為正、截止的 V_AK 為負 → ④假設不成立就換一種假設重來。把 V1 = 12、V2 = 2 設定好,就是習作答案 3 V;再試試 V1、V2 接近時,兩顆會同時導通。</Note>
    </div>
  )
}

export default function Lesson22() {
  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-white/90 p-3 text-sm">這一單元要看懂 PN 二極體:它怎麼形成、為什麼只讓電流往一個方向走、曲線長什麼樣,以及解題時可以怎麼簡化。每個圖都是用公式算出來的。</p>
      <Block n={1} title="PN 接面是怎麼形成的?"><Formation /><QuickCheck c={chk('LC-22-1')} /></Block>
      <Block n={2} title="偏壓:順向與逆向"><p>在二極體兩端外加電壓,稱為<b>偏壓</b>。P 端接電源正端是<b>順向偏壓</b>,反過來是<b>逆向偏壓</b>。拖拉看看空乏區與電流如何變化。</p><BiasLab /><QuickCheck c={chk('LC-22-2')} /></Block>
      <Block n={3} title="靜態電阻與動態電阻"><p>二極體不是固定電阻:在不同工作點,「V ÷ I」(靜態)和「曲線斜率的倒數」(動態)都不一樣。</p><Resistance /><QuickCheck c={chk('LC-22-4')} /><QuickCheck c={chk('LC-22-3')} /></Block>
      <Block n={4} title="等效模型:把二極體簡化"><p>解題時不需要每次都用指數公式,可以用三種簡化模型。比較看看它們和真實曲線差多少。</p><Models /><QuickCheck c={chk('LC-22-6')} /></Block>
      <Block n={5} title="溫度的影響"><Temp /><QuickCheck c={chk('LC-22-5')} /></Block>
      <Block n={6} title="理想二極體電路:假設 → 驗證"><IdealCircuit /></Block>
    </div>
  )
}
