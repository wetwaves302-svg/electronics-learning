import { useState } from 'react'
import { Block, Note } from './ui'
import QuickCheck from '../components/QuickCheck'
import OrderWidget from '../components/OrderWidget'
import { FOUR_C, IC_LEVELS, MFG_STEPS, PERIODS } from './data11'
import { checks11 } from './checks11'

const chk = (id: string) => checks11.find((c) => c.id === id)!

function Timeline() {
  const [id, setId] = useState<(typeof PERIODS)[number]['id']>('tube')
  const p = PERIODS.find((x) => x.id === id)!
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="電子學發展時期">
        {PERIODS.map((x) => (
          <button key={x.id} role="tab" aria-selected={id === x.id} onClick={() => setId(x.id)} className={`btn text-sm ${id === x.id ? 'btn-sun' : 'btn-ghost'}`}>{x.title.replace(/(.*)(\(.*\))/, '$1')}</button>
        ))}
      </div>
      <div role="tabpanel" className="space-y-2">
        <p className="rounded-xl bg-mist px-3 py-2 text-sm">{p.summary}</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {p.people.map((x) => (
            <li key={x.name} className="rounded-xl border-2 border-navy-800/30 bg-white p-3">
              <p className="font-extrabold">{x.name} <span className="text-sm font-normal text-slate-600">{x.years}</span></p>
              {x.nobel && <p className="mt-1 inline-block rounded-md bg-sun-400 px-2 text-xs font-bold text-navy-900">{x.nobel}</p>}
              <p className="mt-1 text-sm">{x.note}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm"><b>代表元件:</b>{p.devices.join('、')}</p>
      </div>
      <p className="text-xs text-slate-600">照片與元件實物圖請對照講義第 2~7 頁(本平台不收錄原書圖片)。</p>
    </div>
  )
}

function Mfg() {
  const [i, setI] = useState(0)
  const s = MFG_STEPS[i]
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="製造流程">
        {MFG_STEPS.map((x, k) => (
          <button key={x.letter} role="tab" aria-selected={k === i} onClick={() => setI(k)} className={`rounded-lg border-2 px-2 py-1 text-xs min-h-9 ${k === i ? 'border-teal-600 bg-sun-400 font-bold' : x.phase === '晶圓處理' ? 'border-navy-800/30 bg-white' : 'border-grape-500/50 bg-white'}`}>({x.letter}) {x.name}</button>
        ))}
      </div>
      <div className="rounded-xl bg-teal-100 px-3 py-2" role="status" aria-live="polite">
        <p className="text-xs font-bold text-navy-800">{s.phase}</p>
        <p className="text-lg font-extrabold">({s.letter}) {s.name}</p>
        <p className="text-sm">{s.what}</p>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-ghost text-sm" disabled={i === 0} onClick={() => setI(i - 1)}>◀ 上一步</button>
        <button className="btn btn-primary text-sm" disabled={i === MFG_STEPS.length - 1} onClick={() => setI(i + 1)}>下一步 ▶</button>
      </div>
      <p className="text-xs text-slate-600">各步驟名稱依講義第 9~10 頁圖 1-20;說明文字為簡要白話說明。</p>
    </div>
  )
}

function FourC() {
  const [k, setK] = useState<'application' | 'integration'>('application')
  const d = FOUR_C[k]
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="兩種 4C">
        <button className={`btn text-sm ${k === 'application' ? 'btn-sun' : 'btn-ghost'}`} aria-pressed={k === 'application'} onClick={() => setK('application')}>電子應用產品的 4C</button>
        <button className={`btn text-sm ${k === 'integration' ? 'btn-sun' : 'btn-ghost'}`} aria-pressed={k === 'integration'} onClick={() => setK('integration')}>4C 的整合與應用</button>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {d.items.map(([en, zh]) => (
          <li key={en} className="rounded-xl border-2 border-navy-800/30 bg-white p-2 text-center">
            <p className="text-2xl font-extrabold text-teal-600">{en[0]}</p>
            <p className="text-xs text-slate-600">{en}</p>
            <p className="font-bold">{zh}</p>
          </li>
        ))}
      </ul>
      <Note>講義第 8 頁提到兩種「4C」。習作問「電子元件主要的應用發展方向」,答的是<b>電子應用產品的 4C</b>:電腦、通訊、消費性電子、汽車電子。</Note>
    </div>
  )
}

export default function Lesson11() {
  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-white/90 p-3 text-sm">這一單元是電子學的「歷史與地圖」:知道電子元件怎麼一步步變小、變強,也知道 IC 是怎麼做出來的。點一點、排一排,記得會比較牢。</p>
      <Block n={1} title="三個時期:真空管 → 電晶體 → 積體電路">
        <p>電子學的發展大致分成三個時期。點選每個時期,看看當時的代表人物與元件。</p>
        <Timeline />
        <QuickCheck c={chk('LC-11-1')} />
        <QuickCheck c={chk('LC-11-2')} />
        <QuickCheck c={chk('LC-11-3')} />
      </Block>
      <Block n={2} title="為什麼電晶體會取代真空管?">
        <p>真空管靠加熱燈絲讓電子飛過真空,可以整流、放大;電晶體則用半導體做到同樣的事。</p>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm">
            <thead><tr className="bg-sun-100"><th className="p-1 text-left">比較</th><th>真空管</th><th>電晶體</th></tr></thead>
            <tbody>
              <tr className="border-t border-navy-800/10"><td className="p-1 text-left">體積</td><td>大</td><td>小</td></tr>
              <tr className="border-t border-navy-800/10"><td className="p-1 text-left">耗電、發熱</td><td>多(要加熱燈絲)</td><td>少</td></tr>
              <tr className="border-t border-navy-800/10"><td className="p-1 text-left">開機</td><td>需要預熱</td><td>不需要預熱</td></tr>
              <tr className="border-t border-navy-800/10"><td className="p-1 text-left">壽命</td><td>較短</td><td>較長</td></tr>
            </tbody>
          </table>
        </div>
        <Note>這張比較表是一般性的說明,講義沒有列出,考試不會直接考表格內容;了解「固態元件取代真空管」這個趨勢就好。</Note>
      </Block>
      <Block n={3} title="IC 的規模:從一個電晶體到極大型">
        <p>積體電路依所含元件(邏輯閘)數量分類。把它們從「最少」排到「最多」。</p>
        <OrderWidget prompt="由少到多,依序點選:" attemptId="LC-11-order-ic" kp="KP-11-02" items={IC_LEVELS.map((l) => ({ id: l.id, label: l.name, sub: l.full.replace(/\(.*\)/, '') }))} />
        <Note>本教材的 VLSI 約為「1,000 個邏輯閘以上」。各教科書的界線不盡相同,考試以授課教材為準。講義圖 1-19 由右到左就是由少到多。</Note>
        <QuickCheck c={chk('LC-11-4')} />
      </Block>
      <Block n={4} title="IC 是怎麼做出來的?">
        <p>IC 製造分成兩大段:先在晶圓上做出電路(晶圓處理),再測試、切割、封裝(測試與封裝)。點選每一步看說明。</p>
        <Mfg />
        <OrderWidget prompt="試試看:把「測試與封裝」這一段排成正確順序。" attemptId="LC-11-order-mfg" kp="KP-11-03" items={MFG_STEPS.slice(6).map((s) => ({ id: s.letter, label: s.name }))} />
        <QuickCheck c={chk('LC-11-5')} />
      </Block>
      <Block n={5} title="未來趨勢:4C">
        <p>講義用「4C」描述電子產品的發展方向。</p>
        <FourC />
        <QuickCheck c={chk('LC-11-6')} />
      </Block>
    </div>
  )
}
