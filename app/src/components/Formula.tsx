import katex from 'katex'

/** KaTeX 公式。區塊式公式在手機上可左右捲動,不會撐破版面。 */
export default function Formula({ tex, block = false }: { tex: string; block?: boolean }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: block })
  return block
    ? <div className="overflow-x-auto max-w-full py-1" dangerouslySetInnerHTML={{ __html: html }} />
    : <span dangerouslySetInnerHTML={{ __html: html }} />
}
