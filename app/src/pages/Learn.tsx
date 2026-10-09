import { Link, useParams } from 'react-router-dom'
import Lesson11 from '../lessons/Lesson11'
import Lesson12 from '../lessons/Lesson12'
import Lesson21 from '../lessons/Lesson21'
import Lesson22 from '../lessons/Lesson22'
import Lesson23 from '../lessons/Lesson23'
import { units } from '../units'
import { UNIT_SOURCES } from '../sources'

export default function Learn() {
  const { id } = useParams()
  const unit = units.find((u) => u.id === id)
  if (!unit || !['1-1', '1-2', '2-1', '2-2', '2-3'].includes(id ?? '')) return <p>這個單元的教學還在製作中。<Link className="underline" to="/">回首頁</Link></p>
  return (
    <div className="space-y-4">
      <Link to={`/unit/${unit.id}`} className="inline-block rounded-full bg-white border-2 border-navy-800 px-3 py-1 text-sm font-bold text-navy-800">← {unit.id} 單元</Link>
      <h1 className="text-2xl font-extrabold text-navy-900"><span className="rounded-lg bg-grape-500 text-white px-2 mr-2">{unit.id}</span>{unit.title}:互動教學</h1>
      <p className="rounded-xl bg-white/90 px-3 py-2 text-xs">教材依據:台科大圖書《電子學 I》{UNIT_SOURCES[unit.id].slides};習作:{UNIT_SOURCES[unit.id].workbook}。互動圖表與動畫為本站製作。<a className="ml-1 font-bold underline" href="#/about">詳細來源</a></p>
      {id === '1-1' ? <Lesson11 /> : id === '1-2' ? <Lesson12 /> : id === '2-1' ? <Lesson21 /> : id === '2-2' ? <Lesson22 /> : <Lesson23 />}
      <Link to="/practice" className="btn btn-sun inline-block">學完了,去做習作題</Link>
    </div>
  )
}
