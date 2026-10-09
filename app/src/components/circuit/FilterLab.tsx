import { useMemo, useState } from 'react'
import WaveChart from '../WaveChart'
import Slider from '../Slider'
import { rippleApprox, simulateFilter } from '../../core/filter'
import { filteredDc } from '../../core/physics'

const r2 = (x: number) => Math.round(x * 100) / 100

/** 電容濾波實驗:理想二極體 + 理想電源,穩態數值模擬(不是示意)。 */
export default function FilterLab() {
  const [c, setC] = useState(470)
  const [full, setFull] = useState(true)
  const vm = 10, f = 60, r = 100
  const res = useMemo(() => simulateFilter({ vm, f, r, c: c * 1e-6, full }), [c, full])
  const approx = rippleApprox(res.vp, f, r, c * 1e-6, full)
  const T = 1 / f
  const at = (t: number) => res.samples[Math.min(res.samples.length - 1, Math.floor((t / T) * res.samples.length))].vc
  return (
    <div className="space-y-3">
      <div className="flex gap-2" role="group" aria-label="整流方式">
        <button className={`btn text-sm ${full ? 'btn-sun' : 'btn-ghost'}`} aria-pressed={full} onClick={() => setFull(true)}>全波整流</button>
        <button className={`btn text-sm ${!full ? 'btn-sun' : 'btn-ghost'}`} aria-pressed={!full} onClick={() => setFull(false)}>半波整流</button>
      </div>
      <Slider label="濾波電容 C(負載 RL = 100 Ω,Vm = 10 V,60 Hz)" value={c} min={10} max={4700} step={10} unit=" μF" onChange={setC} />
      <WaveChart ariaLabel="濾波後的輸出電壓波形" series={[{ fn: (t) => Math.abs(vm * Math.sin(2 * Math.PI * f * t)) * (full ? 1 : 0) + (full ? 0 : Math.max(vm * Math.sin(2 * Math.PI * f * t), 0)), color: '#9db4cf', dashed: true, width: 2 }, { fn: at, color: '#1b6fd1' }]}
        t0={0} t1={T * 2 - 1e-9} yMin={0} yMax={11}
        hLines={[{ y: res.vdc, label: `Vdc ≈ ${r2(res.vdc)} V`, color: '#35b84a' }]}>
        {({ sx, sy }) => <text x={sx(0.001)} y={sy(10.6)} fontSize={11} fill="#17407a" fontWeight={700}>灰虛線:整流後(未濾波);藍實線:接電容後</text>}
      </WaveChart>
      <div className="rounded-xl bg-sun-100 px-3 py-2 text-sm space-y-1" role="status" aria-live="polite">
        <p>峰值 Vp = <b>{r2(res.vp)} V</b>,漣波峰對峰 Vr(pp) = <b>{r2(res.vrPP)} V</b>,直流平均 Vdc = <b>{r2(res.vdc)} V</b>,漣波因數 r = <b>{r2(res.ripple * 100)}%</b>。</p>
        <p>課本近似:Vdc ≈ Vp − Vr(pp)/2 = {r2(filteredDc(res.vp, res.vrPP))} V;Vr(pp) ≈ Vp/({full ? '2' : ''}fRC) = {r2(approx)} V(近似式略偏大,因為電容在峰值附近有一小段時間在充電)。</p>
        <p className="text-xs text-slate-700">條件:理想二極體、理想電源,穩態。實際電路的二極體壓降、變壓器內阻會讓結果略有不同。</p>
      </div>
    </div>
  )
}
