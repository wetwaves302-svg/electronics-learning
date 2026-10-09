import { useEffect, useMemo, useRef, useState } from 'react'
import RectifierDiagram from './RectifierDiagram'
import WaveChart from '../WaveChart'
import Slider from '../Slider'
import { RECTIFIER_NAME, solveRectifier, sweepRectifier, type RectifierKind } from '../../core/rectifier'

const RL = 100

/** 整流實驗室:電路狀態與電流方向由理想二極體求解器逐角度算出。 */
export default function RectifierLab({ initial = 'half' as RectifierKind }) {
  const [kind, setKind] = useState<RectifierKind>(initial)
  const [theta, setTheta] = useState(45)
  const [playing, setPlaying] = useState(false)
  const [electron, setElectron] = useState(false)
  const [vm, setVm] = useState(10)

  const sweep = useMemo(() => sweepRectifier(kind, vm, RL, 360), [kind, vm])
  const v = vm * Math.sin((theta * Math.PI) / 180)
  const s = useMemo(() => solveRectifier(kind, v, RL), [kind, v])
  const piv = useMemo(() => {
    const m: Record<string, number> = {}
    for (const { state } of sweep) for (const [id, x] of Object.entries(state.vak)) m[id] = Math.min(m[id] ?? 0, x)
    return Object.fromEntries(Object.entries(m).map(([k, x]) => [k, -x]))
  }, [sweep])

  const last = useRef<number | null>(null)
  useEffect(() => {
    if (!playing) { last.current = null; return }
    let raf = 0
    const tick = (t: number) => {
      if (last.current !== null) setTheta((th) => (th + ((t - last.current!) / 1000) * 40) % 360)
      last.current = t
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const names = Object.keys(s.on)
  const onList = names.filter((n) => s.on[n])
  const t2 = (x: number) => (x / 360) * 2 * Math.PI

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="選擇整流電路">
        {(Object.keys(RECTIFIER_NAME) as RectifierKind[]).map((k) => (
          <button key={k} className={`btn text-sm ${kind === k ? 'btn-sun' : 'btn-ghost'}`} aria-pressed={kind === k} onClick={() => { setKind(k); setPlaying(false) }}>{RECTIFIER_NAME[k]}</button>
        ))}
      </div>
      <RectifierDiagram kind={kind} state={s} v={v} iScale={vm / RL} electron={electron} paused={!playing} />
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-primary text-sm" onClick={() => setPlaying(!playing)}>{playing ? '暫停' : '播放'}</button>
        <button className="btn btn-ghost text-sm" onClick={() => { setPlaying(false); setTheta((th) => (th + 345) % 360) }} aria-label="退一步 15 度">◀ 15°</button>
        <button className="btn btn-ghost text-sm" onClick={() => { setPlaying(false); setTheta((th) => (th + 15) % 360) }} aria-label="進一步 15 度">15° ▶</button>
        <button className="btn btn-ghost text-sm" onClick={() => { setPlaying(false); setTheta(45) }}>重播</button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={electron} onChange={(e) => setElectron(e.target.checked)} className="h-5 w-5" />
          看電子移動方向
        </label>
      </div>
      <Slider label="輸入相位 θ(一個週期 0°~360°)" value={Math.round(theta)} min={0} max={359} step={1} unit="°" onChange={(x) => { setPlaying(false); setTheta(x) }} />
      <Slider label={kind === 'centerTap' ? '次級峰值 Vm(每半邊)' : '次級峰值 Vm'} value={vm} min={5} max={20} step={1} unit=" V" onChange={setVm} />
      <WaveChart
        ariaLabel="輸入電壓與輸出電壓波形,垂直線是目前相位"
        series={[
          { fn: (t) => vm * Math.sin(t), color: '#9db4cf', dashed: true, width: 2 },
          { fn: (t) => sweep[Math.min(359, Math.floor(((t / (2 * Math.PI)) * 360 + 360) % 360))].state.vo, color: '#1b6fd1' },
        ]}
        t0={0} t1={2 * Math.PI} yMin={-vm * 1.25} yMax={vm * 1.25} samples={720}
        xLabel="輸入相位 θ(0~360°)"
      >
        {({ sx, sy }) => (
          <g>
            <line x1={sx(t2(theta))} x2={sx(t2(theta))} y1={sy(vm * 1.25)} y2={sy(-vm * 1.25)} stroke="#e5383b" strokeWidth={1.8} />
            <circle cx={sx(t2(theta))} cy={sy(s.vo)} r={5} fill="#1b6fd1" stroke="#fff" strokeWidth={1.5} />
            <circle cx={sx(t2(theta))} cy={sy(v)} r={4} fill="#9db4cf" stroke="#17407a" strokeWidth={1} />
            <text x={sx(0.1)} y={sy(vm * 1.15)} fontSize={11} fill="#17407a" fontWeight={700}>灰虛線:輸入 v;藍實線:輸出 Vo</text>
          </g>
        )}
      </WaveChart>
      <div className="rounded-xl bg-sun-100 px-3 py-2 text-sm space-y-1" role="status" aria-live="polite">
        <p>目前 θ = {Math.round(theta)}°,輸入 v = <b>{v.toFixed(1)} V</b>{v > 0.05 ? '(上端為正)' : v < -0.05 ? '(下端為正)' : '(接近 0 V)'},輸出 Vo = <b>{s.vo.toFixed(1)} V</b>。</p>
        <p>導通的二極體:<b>{onList.length ? onList.join('、') : '無'}</b>;截止:{names.filter((n) => !s.on[n]).join('、') || '無'}。</p>
        <p>整個週期中,每顆二極體承受的最大逆向電壓(PIV):{names.map((n) => `${n} = ${piv[n].toFixed(1)} V`).join(',')}。</p>
        <p className="text-xs text-slate-700">箭頭與流動點是「傳統電流」方向(正電荷移動的方向),電子實際移動方向相反。勾選「看電子移動方向」可以切換。</p>
      </div>
    </div>
  )
}
