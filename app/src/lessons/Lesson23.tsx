import { useState, type ReactNode } from 'react'
import RectifierLab from '../components/circuit/RectifierLab'
import FilterLab from '../components/circuit/FilterLab'
import Formula from '../components/Formula'
import Slider from '../components/Slider'
import QuickCheck from '../components/QuickCheck'
import { checks23 } from './checks23'
import { fullWave, halfWave, pivBridge, pivCenterTapFullWave, pivHalfWave, transformerSecondaryPeak } from '../core/physics'

const chk = (id: string) => checks23.find((c) => c.id === id)!
const r2 = (x: number) => Math.round(x * 100) / 100

function Block({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="card space-y-3" aria-labelledby={`r${n}`}>
      <h2 id={`r${n}`} className="text-lg font-extrabold text-navy-900"><span className="mr-2 rounded-lg bg-grape-500 px-2 text-white">{n}</span>{title}</h2>
      {children}
    </section>
  )
}
const Note = ({ children }: { children: ReactNode }) => <p className="rounded-xl bg-sun-100 px-3 py-2 text-sm">{children}</p>

function Compare() {
  const [vm, setVm] = useState(10)
  const h = halfWave(vm), f = fullWave(vm)
  const rows: [string, string, string][] = [
    ['輸出直流 Vdc', `Vm/π = ${r2(h.vo_dc)} V`, `2Vm/π = ${r2(f.vo_dc)} V`],
    ['輸出有效值 Vrms', `Vm/2 = ${r2(h.vo_rms)} V`, `Vm/√2 = ${r2(f.vo_rms)} V`],
    ['輸出頻率(輸入 60 Hz)', '60 Hz', '120 Hz'],
    ['漣波因數 r(未濾波)', `${r2(h.rippleFactor * 100)}%`, `${r2(f.rippleFactor * 100)}%`],
  ]
  return (
    <div className="space-y-2">
      <Slider label="整流器輸入的峰值 Vm" value={vm} min={5} max={20} unit=" V" onChange={setVm} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead><tr className="bg-sun-100"><th className="p-1 text-left">項目</th><th>半波</th><th>全波</th></tr></thead>
          <tbody>{rows.map(([a, b, c]) => <tr key={a} className="border-t border-navy-800/10"><td className="p-1 text-left">{a}</td><td>{b}</td><td>{c}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}

function PivBlock() {
  const [vi, setVi] = useState(110)
  const [n1, setN1] = useState(110)
  const [n2, setN2] = useState(24)
  const vsm = transformerSecondaryPeak(vi * Math.SQRT2, n1, n2)
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        <Slider label="輸入有效值" value={vi} min={100} max={220} step={10} unit=" V" onChange={setVi} />
        <Slider label="N1(初級)" value={n1} min={10} max={220} step={10} onChange={setN1} />
        <Slider label="N2(次級,全部)" value={n2} min={6} max={48} step={2} onChange={setN2} />
      </div>
      <p className="text-sm">次級峰值 Vs(m) = (N2/N1) × {r2(vi * Math.SQRT2)} = <b>{r2(vsm)} V</b>(全部次級)</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead><tr className="bg-sun-100"><th className="p-1 text-left">電路</th><th>PIV 公式</th><th>PIV</th></tr></thead>
          <tbody>
            <tr><td className="p-1 text-left">半波</td><td>Vs(m)</td><td><b>{r2(pivHalfWave(vsm))} V</b></td></tr>
            <tr><td className="p-1 text-left">橋式</td><td>Vs(m)</td><td><b>{r2(pivBridge(vsm))} V</b></td></tr>
            <tr><td className="p-1 text-left">中心抽頭全波</td><td>2 × (每半邊 Vs(m)) = Vs(m,全部)</td><td><b>{r2(pivCenterTapFullWave(vsm / 2))} V</b></td></tr>
          </tbody>
        </table>
      </div>
      <Note>習作歷屆題:110:24、AC 110 V,中心抽頭全波。每半邊 12 V 有效值 → 12√2 ≈ 16.97 V 峰值,PIV = 2 × 16.97 ≈ 33.9 V。選用的二極體額定 PIV 要比這個大,而且實務上要再留一點餘裕。</Note>
    </div>
  )
}

export default function Lesson23() {
  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-white/90 p-3 text-sm">
        這一單元的電路圖是「真的算出來的」:程式用理想二極體模型,在每個角度解出哪顆導通、電流往哪走。拖動相位、按播放,觀察電流怎麼走。
      </p>
      <Block n={1} title="二極體像單向閥:只讓電流往一個方向走">
        <p>理想二極體:陽極(三角形底邊那端)電壓比陰極(直線那端)高時<b>導通</b>,像一條導線;反過來就<b>截止</b>,像斷路。整流就是用它把正負交替的交流,變成只有一個方向的電流。</p>
        <Formula block tex="V_{AK}>0\;\Rightarrow\;\text{導通}\qquad V_{AK}<0\;\Rightarrow\;\text{截止}" />
        <Note>先玩玩看最簡單的「半波整流」:把相位拉到 0°~180°(上端為正)和 180°~360°(下端為正),觀察 D1 的狀態與電流。</Note>
        <RectifierLab initial="half" />
        <QuickCheck c={chk('LC-23-1')} />
      </Block>
      <Block n={2} title="全波整流:中心抽頭與橋式,正負半週都用上">
        <p>全波整流不浪費負半週。<b>中心抽頭</b>用兩顆二極體,配合變壓器的中心抽頭;<b>橋式</b>用四顆二極體,不需要中心抽頭。切換看看每個半週是哪些二極體導通。</p>
        <RectifierLab initial="bridge" />
        <Note>橋式整流:電流從一顆二極體進入負載,再從<b>對角</b>的二極體流回電源。Vi 為正時 D1、D3 導通;Vi 為負時 D2、D4 導通。流過負載的方向永遠一樣,所以 Vo 永遠為正。</Note>
        <QuickCheck c={chk('LC-23-3')} />
      </Block>
      <Block n={3} title="輸出的頻率、平均值與有效值">
        <p>半波每個輸入週期只有一個脈動;全波有兩個,所以輸出頻率是輸入的 2 倍。</p>
        <Formula block tex="\text{半波: }V_{dc}=\dfrac{V_m}{\pi},\;V_{rms}=\dfrac{V_m}{2}\qquad \text{全波: }V_{dc}=\dfrac{2V_m}{\pi},\;V_{rms}=\dfrac{V_m}{\sqrt{2}}" />
        <Compare />
        <QuickCheck c={chk('LC-23-2')} />
        <QuickCheck c={chk('LC-23-4')} />
      </Block>
      <Block n={4} title="漣波因數:輸出離純直流有多遠?">
        <p><b>漣波因數 r</b> 是輸出中「交流成分的有效值」占「直流」的比例。r 愈小,輸出愈接近純直流。</p>
        <Formula block tex="r=\dfrac{V_{r(rms)}}{V_{dc}}=\sqrt{\left(\dfrac{V_{rms}}{V_{dc}}\right)^{2}-1}" />
        <Note>代入全波:V_rms/V_dc = (V_m/√2)/(2V_m/π) = π/(2√2) ≈ 1.11,r = √(1.11² − 1) ≈ 0.48 = 48%。代入半波:V_rms/V_dc = (V_m/2)/(V_m/π) = π/2 ≈ 1.57,r = √(1.57² − 1) ≈ 1.21 = 121%。</Note>
        <QuickCheck c={chk('LC-23-5')} />
      </Block>
      <Block n={5} title="峰值逆向電壓 PIV:二極體要選多耐壓?">
        <p>二極體截止時,兩端承受的逆向電壓最大值叫 PIV。選二極體時,額定逆向耐壓要大於這個值。</p>
        <PivBlock />
      </Block>
      <Block n={6} title="加上濾波電容:把脈動撫平">
        <p>電容在電壓高的時候充電,電壓下降時放電給負載,把脈動「撫平」。電容愈大,放電愈慢,漣波愈小。</p>
        <FilterLab />
        <Formula block tex="V_{dc}\approx V_p-\dfrac{V_{r(pp)}}{2}" />
        <QuickCheck c={chk('LC-23-6')} />
      </Block>
    </div>
  )
}
