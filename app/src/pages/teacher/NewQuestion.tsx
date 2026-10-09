import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../../api'
import { knowledgePoints } from '../../data/knowledgePoints'
import { units } from '../../units'
import { Back, Err, RequireTeacher } from './common'

export default function NewQuestion() { return <RequireTeacher><Inner /></RequireTeacher> }

function Inner() {
  const nav = useNavigate()
  const [unit, setUnit] = useState('1-2')
  const [type, setType] = useState<'mc' | 'numeric'>('mc')
  const [kps, setKps] = useState<string[]>([])
  const [stem, setStem] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [answer, setAnswer] = useState(0)
  const [parts, setParts] = useState([{ label: '', value: '', unit: '', relTol: '1' }])
  const [solution, setSolution] = useState('')
  const [label, setLabel] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const unitKps = knowledgePoints.filter((k) => k.unit === unit)
  const input = 'block w-full rounded-xl border-2 border-navy-800/40 px-3 py-2 min-h-11'

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(null)
    try {
      const body = type === 'mc'
        ? { unit, type, kps, stem, options: options.filter((o) => o.trim()), answer, solution, label }
        : { unit, type, kps, stem, solution, label, parts: parts.map((p) => ({ label: p.label, value: Number(p.value), unit: p.unit, relTol: Number(p.relTol) / 100 })) }
      const r = await api<{ id: string }>('POST', '/api/teacher/questions', body)
      nav(`/teacher/questions/${r.id}`)
    } catch (x) { setErr(x instanceof ApiError ? x.message : '失敗') }
  }
  return (
    <div className="space-y-4">
      <Back to="/teacher/questions">題目列表</Back>
      <h1 className="inline-block rounded-2xl bg-white/90 px-3 text-2xl font-extrabold text-navy-900">新增題目</h1>
      <form onSubmit={submit} className="card space-y-3">
        <div className="flex flex-wrap gap-3">
          <label className="text-sm font-medium">單元<select value={unit} onChange={(e) => { setUnit(e.target.value); setKps([]) }} className="ml-2 rounded-lg border-2 border-navy-800/40 px-2 py-1">{units.map((u) => <option key={u.id} value={u.id}>{u.id} {u.title}</option>)}</select></label>
          <label className="text-sm font-medium">題型<select value={type} onChange={(e) => setType(e.target.value as 'mc' | 'numeric')} className="ml-2 rounded-lg border-2 border-navy-800/40 px-2 py-1"><option value="mc">選擇題</option><option value="numeric">數值題</option></select></label>
        </div>
        <fieldset className="space-y-1"><legend className="text-sm font-medium">知識點(至少選一個,與習作題共用編號)</legend>{unitKps.map((k) => <label key={k.id} className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-5 w-5" checked={kps.includes(k.id)} onChange={() => setKps(kps.includes(k.id) ? kps.filter((x) => x !== k.id) : [...kps, k.id])} />{k.id} {k.title}</label>)}</fieldset>
        <label className="block text-sm font-medium">題目名稱(選填,例如「自編題 1」)<input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} className={input} /></label>
        <label className="block text-sm font-medium">題幹<textarea value={stem} onChange={(e) => setStem(e.target.value)} required rows={3} className={input} /></label>
        {type === 'mc' ? (
          <fieldset className="space-y-2"><legend className="text-sm font-medium">選項(空白的會被忽略;點圓鈕選正確答案)</legend>
            {options.map((o, i) => <div key={i} className="flex items-center gap-2"><input type="radio" name="ans" checked={answer === i} onChange={() => setAnswer(i)} className="h-5 w-5" aria-label={`選項 ${i + 1} 為正確答案`} /><input value={o} onChange={(e) => setOptions(options.map((x, k) => (k === i ? e.target.value : x)))} className={input} placeholder={`選項 ${'ABCDEF'[i]}`} /></div>)}
            {options.length < 6 && <button type="button" className="btn btn-ghost text-sm" onClick={() => setOptions([...options, ''])}>多一個選項</button>}
          </fieldset>
        ) : (
          <fieldset className="space-y-2"><legend className="text-sm font-medium">作答欄位與標準答案(基本單位;學生寫 mA 等等價單位也會判對)</legend>
            {parts.map((p, i) => <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-4"><input aria-label="名稱" placeholder="名稱,例如 Vdc" value={p.label} onChange={(e) => setParts(parts.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} className={input} /><input aria-label="標準答案" placeholder="標準答案(數字)" value={p.value} onChange={(e) => setParts(parts.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} className={input} /><input aria-label="單位" placeholder="單位:V、A、Ω、Hz、%,無單位留空" value={p.unit} onChange={(e) => setParts(parts.map((x, k) => (k === i ? { ...x, unit: e.target.value } : x)))} className={input} /><input aria-label="容許誤差百分比" placeholder="容許誤差 %" value={p.relTol} onChange={(e) => setParts(parts.map((x, k) => (k === i ? { ...x, relTol: e.target.value } : x)))} className={input} /></div>)}
            <button type="button" className="btn btn-ghost text-sm" onClick={() => setParts([...parts, { label: '', value: '', unit: '', relTol: '1' }])}>多一個作答欄位</button>
          </fieldset>
        )}
        <label className="block text-sm font-medium">解析<textarea value={solution} onChange={(e) => setSolution(e.target.value)} required rows={5} className={input} /></label>
        <Err msg={err} />
        <button className="btn btn-primary">新增(狀態為「待檢查」)</button>
        <p className="text-xs text-slate-600">新增的題目會出現在學生的練習與指定練習中。沒有「七步驟教練」,但有三層提示(由知識點組成)。建議你檢查後再標為已發布。</p>
      </form>
    </div>
  )
}
