import type { ReactNode } from 'react'

export function Block({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="card space-y-3" aria-labelledby={`blk${n}`}>
      <h2 id={`blk${n}`} className="text-lg font-extrabold text-navy-900"><span className="mr-2 rounded-lg bg-grape-500 px-2 text-white">{n}</span>{title}</h2>
      {children}
    </section>
  )
}
export const Note = ({ children }: { children: ReactNode }) => <p className="rounded-xl bg-sun-100 px-3 py-2 text-sm">{children}</p>
export const r2 = (x: number) => Math.round(x * 100) / 100
export const sci = (x: number) => {
  if (x === 0) return '0'
  const e = Math.floor(Math.log10(Math.abs(x)))
  const m = x / 10 ** e
  const sup = String(e).split('').map((c) => (c === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)])).join('')
  return `${Math.round(m * 100) / 100}×10${sup}`
}
