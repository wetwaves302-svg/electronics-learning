import { Link } from 'react-router-dom'
import { SOURCES, UNIT_SOURCES } from '../sources'
import { units } from '../units'

export default function About() {
  return (
    <div className="space-y-4">
      <h1 className="inline-block rounded-2xl bg-white/90 px-3 text-2xl font-extrabold text-navy-900">關於與教材來源</h1>
      <section className="card space-y-2">
        <h2 className="font-bold">這是什麼</h2>
        <p className="text-sm">「電子學 I 互動學習」是給技術型高中學生的<b>教學輔助網站</b>,範圍是第一次段考(1-1 ~ 2-3 整流濾波)。它<b>不是原教材出版者製作的官方產品</b>。</p>
      </section>
      <section className="card space-y-2">
        <h2 className="font-bold">教材來源</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li><b>{SOURCES.slides.title}</b>,{SOURCES.slides.publisher},{SOURCES.slides.year}。{SOURCES.slides.note}。</li>
          <li><b>{SOURCES.workbook.title}</b>({SOURCES.workbook.code}):{SOURCES.workbook.note}。</li>
        </ul>
        <p className="text-sm">題目文字、標準答案與原有的詳解依上述教材收錄,<b>每一道題都標註出處</b>(書名、章、頁、原始題號;歷屆題另標統測年度)。教材的著作權屬原出版者與原作者所有。</p>
      </section>
      <section className="card space-y-2">
        <h2 className="font-bold">各單元對應的教材</h2>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-sun-100"><th className="p-1 text-left">單元</th><th className="text-left">講義</th><th className="text-left">習作</th></tr></thead>
          <tbody>{units.map((u) => <tr key={u.id} className="border-t border-navy-800/10"><td className="p-1 font-bold">{u.id} {u.title}</td><td>{UNIT_SOURCES[u.id].slides}</td><td>{UNIT_SOURCES[u.id].workbook}</td></tr>)}</tbody></table></div>
        <p className="text-xs text-slate-600">習作的節編號與講義不同:習作 2-3 是「整流與濾波」,講義的 2-3 是稽納二極體,整流濾波在講義 3-1、3-2。本站一律以習作編號為準。</p>
      </section>
      <section className="card space-y-2">
        <h2 className="font-bold">本站自己製作的部分</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>圖:波形圖與電路圖都是重新繪製(依題目數字用公式產生),不是原書圖片。</li>
          <li>互動教學、動畫、七步驟解題教練、變化題、知識遊戲、錯題本、學習紀錄:由本站編寫。</li>
          <li>部分解析(習作原本沒有詳解的題目)由本站補寫,畫面上會標示「由本平台補寫」。</li>
          <li>生活舉例與一般性的說明(例如 4C 的產品分類、真空管與電晶體的比較)為一般常識,講義未列出,畫面上會註明。</li>
        </ul>
        <p className="rounded-xl bg-sun-100 px-3 py-2 text-sm"><b>審核狀態:</b>所有題目與解析目前最高只到「我方計算已驗證」(數值由計算核心與自動測試核對),<b>尚未經專業電機教師審核</b>。若發現錯誤,請告訴老師。考試仍以授課教材與老師講解為準。</p>
      </section>
      <Link to="/" className="btn btn-sun inline-block">回首頁</Link>
    </div>
  )
}
