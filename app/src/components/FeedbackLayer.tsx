import { useEffect, useRef, useState } from 'react'
import type { FxDetail } from '../feedback'
import { setSoundOn, useSoundOn } from '../feedback'

interface P { id: number; x: number; dx: number; dy: number; rot: number; color: string; size: number; delay: number }
const COLORS = ['#ffcf33', '#35b84a', '#1b6fd1', '#e5383b', '#7a4fd6', '#62b8f7']
let pid = 0

/** 慶祝層:彩帶、邊緣閃光、連續答對橫幅。尊重「減少動態效果」設定(只顯示文字橫幅)。 */
export default function FeedbackLayer() {
  const [parts, setParts] = useState<P[]>([])
  const [flash, setFlash] = useState<'ok' | 'soft' | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const later = (f: () => void, ms: number) => { timers.current.push(setTimeout(f, ms)) }
    const on = (e: Event) => {
      const d = (e as CustomEvent<FxDetail>).detail
      const count = d.kind === 'complete' ? 90 : d.kind === 'streak' ? 55 : d.kind === 'correct' ? 28 : 0
      if (!reduce && count) {
        const made: P[] = Array.from({ length: count }, () => ({
          id: pid++, x: 50 + (Math.random() - 0.5) * (d.kind === 'complete' ? 70 : 30),
          dx: (Math.random() - 0.5) * (d.kind === 'complete' ? 90 : 60), dy: -(25 + Math.random() * (d.kind === 'complete' ? 55 : 35)),
          rot: Math.random() * 720 - 360, color: COLORS[Math.floor(Math.random() * COLORS.length)], size: 6 + Math.random() * 7, delay: Math.random() * 0.12,
        }))
        setParts((p) => [...p, ...made])
        later(() => setParts((p) => p.filter((x) => !made.includes(x))), 1800)
      }
      if (!reduce) { setFlash(d.kind === 'wrong' ? 'soft' : 'ok'); later(() => setFlash(null), d.kind === 'wrong' ? 350 : 650) }
      const text = d.kind === 'complete' ? '完成!🎉' : d.kind === 'streak' ? `🔥 連續答對 ${d.streak} 題!` : d.kind === 'correct' ? '答對了!⭐' : null
      if (text && (d.kind !== 'correct' || !reduce)) { setBanner(text); later(() => setBanner(null), d.kind === 'complete' ? 1800 : 1100) }
    }
    window.addEventListener('electronics-fx', on)
    const t = timers.current
    return () => { window.removeEventListener('electronics-fx', on); t.forEach(clearTimeout) }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {flash && <div className={`fx-flash ${flash === 'ok' ? 'fx-flash-ok' : 'fx-flash-soft'}`} />}
      {parts.map((p) => (
        <span key={p.id} className="fx-confetti" style={{ left: `${p.x}%`, width: p.size, height: p.size * 0.6, background: p.color, animationDelay: `${p.delay}s`, ['--dx' as string]: `${p.dx}vw`, ['--dy' as string]: `${p.dy}vh`, ['--rot' as string]: `${p.rot}deg` }} />
      ))}
      {banner && <div className="fx-banner">{banner}</div>}
    </div>
  )
}

export function SoundToggle() {
  const on = useSoundOn()
  return (
    <button onClick={() => setSoundOn(!on)} aria-pressed={on} aria-label={on ? '音效已開啟,點一下靜音' : '音效已靜音,點一下開啟'} title={on ? '音效開啟中' : '音效已靜音'} className="rounded-xl bg-white/20 px-3 py-2 text-lg leading-none text-white hover:bg-white/30">{on ? '🔊' : '🔇'}</button>
  )
}
