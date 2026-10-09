import { MASTERY_LABEL, type Mastery } from '../core/progress'

const COLOR: Record<Mastery, string> = {
  unseen: 'bg-slate-100 text-slate-700',
  attempted: 'bg-sun-100 text-amber-900',
  everCorrect: 'bg-sky-100 text-navy-800',
  independent: 'bg-teal-100 text-green-900',
  retained: 'bg-green-200 text-green-900',
}

export default function MasteryBadge({ m }: { m: Mastery }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${COLOR[m]}`}>{MASTERY_LABEL[m]}</span>
}
