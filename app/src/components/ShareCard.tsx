import { useEffect, useState } from 'react'
import { getConfig, getIdentity, sendNow, setIdentity, subscribeCollect } from '../collect'

/** 讓學生同意把練習紀錄傳給老師(只有設定好老師的 Google 表單才會出現) */
export default function ShareCard() {
  const [, force] = useState(0)
  const [label, setLabel] = useState('')
  const [agree, setAgree] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  useEffect(() => subscribeCollect(() => force((n) => n + 1)), [])
  const cfg = getConfig()
  const who = getIdentity()
  if (!cfg) return null
  if (!who) {
    return (
      <section className="card space-y-2" aria-label="分享練習紀錄給老師">
        <h2 className="text-lg font-extrabold text-navy-900">讓老師看到你的練習情形</h2>
        <p className="text-sm">老師想知道大家哪裡學得好、哪裡需要幫忙。輸入你的班級座號與姓名,你的練習紀錄(答題對錯、第幾次作答、用了提示沒有)就會自動傳給老師(<b>包含你同意之前已經做過的練習</b>)。<b>不會傳送其他個人資料</b>,也不影響成績。</p>
        <label className="block text-sm font-medium">班級 座號 姓名(例如:二甲 05 王小明)
          <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} className="mt-1 block w-full rounded-xl border-2 border-navy-800/40 px-3 py-2 min-h-11" />
        </label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-5 w-5" />我同意把我的練習紀錄傳給老師。我知道隨時可以停止。</label>
        <button className="btn btn-sun" disabled={!label.trim() || !agree} onClick={() => setIdentity(label)}>同意並開始傳送</button>
      </section>
    )
  }
  return (
    <section className="card flex flex-wrap items-center justify-between gap-2 text-sm" aria-label="紀錄傳送狀態">
      <p>✅ 練習紀錄會自動傳給老師:<b>{who}</b>{status && <span className="ml-2 text-slate-600">{status}</span>}</p>
      <div className="flex gap-2">
        <button className="btn btn-ghost text-sm" onClick={async () => { setStatus('傳送中…'); const r = await sendNow(); setStatus(r === 'ok' ? '已送出' : '目前連不上網路,稍後會自動再試') }}>現在傳送</button>
        <button className="btn btn-ghost text-sm" onClick={() => { const v = prompt('改成這個身分(班級 座號 姓名):', who); if (v !== null && v.trim()) setIdentity(v) }}>改名字</button>
        <button className="btn btn-ghost text-sm" onClick={() => { if (confirm('停止把紀錄傳給老師?(已經傳過的不會被收回)')) setIdentity('') }}>停止傳送</button>
      </div>
    </section>
  )
}
