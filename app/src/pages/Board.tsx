import { useMemo, useState } from 'react'
import { buildBoard, boardAnalytics, studentDetail, type BoardData } from '../board'
import { configFromPrefilled } from '../collect'
import { useQuestions } from '../data/bank'
import type { H } from './teacher/StudentPage'
import { StudentDetail } from './teacher/StudentPage'
import { Overview, QuestionStats } from './teacher/ClassPage'
import { Td, Th, Wrap, pct, when } from './teacher/common'

type Tab = 'overview' | 'students' | 'questions'

/** 教師看板(免伺服器):在瀏覽器裡讀取 Google 試算表匯出的 CSV,資料不會上傳到任何地方。 */
function SetupHelper() {
  const [link, setLink] = useState('')
  const cfg = link.trim() ? configFromPrefilled(link) : null
  return (
    <details className="card">
      <summary className="cursor-pointer font-bold">設定小幫手:把表單連到網站(第一次設定才需要)</summary>
      <div className="mt-2 space-y-2 text-sm">
        <p>在你的 Google 表單,「學生」那一欄請先建立成<b>簡答</b>、「紀錄」那一欄建立成<b>段落</b>。按右上角 ⋮ → <b>取得預先填入的連結</b>,在「學生」欄輸入 <code>STUDENT</code>、「紀錄」欄輸入 <code>DATA</code>,按「取得連結」並複製,貼在下面:</p>
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://docs.google.com/forms/d/e/…/viewform?usp=pp_url&entry…" className="block w-full rounded-xl border-2 border-navy-800/40 px-3 py-2 min-h-11" aria-label="預先填入的連結" />
        {link.trim() && !cfg && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-red-800">看不懂這個連結。請確認「學生」欄填的是 STUDENT、「紀錄」欄填的是 DATA。</p>}
        {cfg && <div role="status"><p>把下面的內容,貼進 GitHub 儲存庫的 <code>app/public/config.json</code>(或交給 Claude 更新):</p><pre className="overflow-x-auto rounded-xl bg-white p-3 text-xs">{JSON.stringify(cfg, null, 2)}</pre></div>}
      </div>
    </details>
  )
}

export default function Board() {
  const qs = useQuestions()
  const bank = useMemo(() => qs.map((q) => ({ id: q.id, unit: q.unit, label: q.source.label })), [qs])
  const [data, setData] = useState<BoardData | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [sel, setSel] = useState<number | null>(null)
  const a = useMemo(() => (data ? boardAnalytics(data, bank) : null), [data, bank])
  const open = (id: number) => { setSel(id); setTab('students') }

  const load = async (file: File | undefined) => {
    setErr(null)
    if (!file) return
    try {
      const d = buildBoard(await file.text())
      if (d.students.length === 0) { setErr('這個檔案裡沒有讀到學生的紀錄。請確認是從「表單回覆」的試算表下載的 CSV。'); return }
      setData(d); setSel(null)
    } catch { setErr('讀取失敗,請重新下載 CSV 再試一次。') }
  }
  const tabBtn = (t: Tab, label: string) => <button role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`btn text-sm ${tab === t ? 'btn-sun' : 'btn-ghost'}`}>{label}</button>

  return (
    <div className="space-y-4">
      <h1 className="inline-block rounded-2xl bg-white/90 px-3 text-2xl font-extrabold text-navy-900">教師看板</h1>
      <SetupHelper />
      <section className="card space-y-2">
        <p className="text-sm">步驟:到你的 Google 試算表(表單回覆)→ 檔案 → 下載 → <b>逗號分隔值 (.csv)</b>,再選擇這個檔案。分析在你的瀏覽器裡完成,<b>不會把學生資料上傳到任何地方</b>。每次想看最新情形,重新下載再選一次即可。</p>
        <input type="file" accept=".csv,text/csv" aria-label="選擇 CSV 檔" onChange={(e) => { void load(e.target.files?.[0]) }} className="block w-full rounded-xl border-2 border-dashed border-navy-800/50 bg-white p-3" />
        {err && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>}
        {data && <p role="status" className="text-sm">已讀取 <b>{data.rows}</b> 筆表單回覆、<b>{data.students.length}</b> 位學生{data.badRows > 0 ? `(${data.badRows} 筆無法辨識,已略過)` : ''}。</p>}
      </section>
      {a && data && (
        <>
          <div className="flex flex-wrap gap-2" role="tablist">{tabBtn('overview', '總覽')}{tabBtn('students', '學生')}{tabBtn('questions', '題目分析')}</div>
          {tab === 'overview' && <Overview a={{ class: { id: 0, name: '看板', code: '' }, ...a } as never} onStudent={open} />}
          {tab === 'questions' && <QuestionStats a={{ class: { id: 0, name: '看板', code: '' }, ...a } as never} />}
          {tab === 'students' && (
            <div className="space-y-4">
              <Wrap><table className="w-full"><thead><tr><Th>學生</Th><Th>覆蓋率</Th><Th>首次獨立答對率</Th><Th>能獨立答對</Th><Th>尚未答對</Th><Th>最後作答</Th><Th>狀態</Th></tr></thead>
                <tbody>{a.students.map((s) => (
                  <tr key={s.id} className={sel === s.id ? 'bg-sun-100' : ''}>
                    <Td><button className="font-bold underline" onClick={() => setSel(s.id)}>{s.name}</button></Td><Td>{pct(s.coverage)}</Td><Td>{pct(s.firstRate)}{s.firstTotal ? `(${s.firstCorrect}/${s.firstTotal})` : ''}</Td><Td>{s.independent}</Td><Td>{s.stuck}</Td><Td>{when(s.lastActive)}</Td>
                    <Td>{s.needsHelp ? <span className="rounded-full bg-red-100 px-2 text-xs text-red-800">需補救</span> : <span className="text-xs text-green-800">正常</span>}</Td>
                  </tr>))}</tbody></table></Wrap>
              {sel !== null && <StudentDetail data={studentDetail(data, sel, bank) as unknown as H} />}
            </div>
          )}
        </>
      )}
    </div>
  )
}
