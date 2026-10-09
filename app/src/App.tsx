import { Link, NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Unit from './pages/Unit'
import Practice from './pages/Practice'
import Progress from './pages/Progress'
import Learn from './pages/Learn'
import Coach from './pages/Coach'
import { GamePlay, GamesHome } from './pages/Games'
import Login from './pages/Login'
import WrongBook from './pages/WrongBook'
import About from './pages/About'
import { useWrongBook } from './wrongbook'
import TeacherHome from './pages/teacher/TeacherHome'
import ClassPage from './pages/teacher/ClassPage'
import StudentPage from './pages/teacher/StudentPage'
import QuestionsPage from './pages/teacher/QuestionsPage'
import QuestionEdit from './pages/teacher/QuestionEdit'
import NewQuestion from './pages/teacher/NewQuestion'
import { logout, useAuth } from './auth'
import FeedbackLayer, { SoundToggle } from './components/FeedbackLayer'
import { useEffect, useState } from 'react'
import { getSyncState, subscribeSync, type SyncState } from './sync'

const SYNC_TEXT: Record<SyncState, string> = { idle: '', syncing: '同步中…', ok: '紀錄已同步', offline: '離線(紀錄先存在這台裝置)', error: '同步失敗,稍後會再試' }
/** 靜態版(例如 GitHub Pages)沒有伺服器:不顯示登入,紀錄只存在這台裝置 */
export const STATIC_MODE = import.meta.env.VITE_STATIC === '1'

function UserBar() {
  const { user } = useAuth()
  const [sync, setSync] = useState<SyncState>(getSyncState())
  useEffect(() => subscribeSync(setSync), [])
  if (STATIC_MODE) return null
  if (!user) return <NavLink to="/login" className="rounded-xl bg-white/20 px-3 py-2 text-sm text-white hover:bg-white/30">登入</NavLink>
  return (
    <div className="flex items-center gap-2 text-sm text-white">
      {user.role === 'teacher' && <NavLink to="/teacher" className="rounded-xl bg-sun-400 px-3 py-2 font-bold text-navy-900">教師後台</NavLink>}
      <span>{user.name || user.username}</span>
      {user.role === 'student' && SYNC_TEXT[sync] && <span className="hidden text-xs text-white/80 sm:inline">{SYNC_TEXT[sync]}</span>}
      <button onClick={() => { void logout() }} className="rounded-xl bg-white/20 px-3 py-2 hover:bg-white/30">登出</button>
    </div>
  )
}

export default function App() {
  const wrongCount = useWrongBook().length
  const link = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-xl text-sm ${isActive ? 'bg-sun-400 text-navy-900 font-bold' : 'text-white hover:bg-white/20'}`
  return (
    <div className="min-h-dvh flex flex-col">
      <FeedbackLayer />
      <header className="bg-teal-600 text-white border-b-8 border-sun-400">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <Link to="/" className="font-bold text-lg mr-auto">⚡ 電子學 I 互動學習</Link>
          <nav className="flex flex-wrap gap-1" aria-label="主選單">
            <NavLink to="/" end className={link}>首頁</NavLink>
            <NavLink to="/practice" className={link}>練習</NavLink>
            <NavLink to="/games" className={link}>遊戲</NavLink>
            <NavLink to="/wrongbook" className={link}>錯題{wrongCount > 0 ? `(${wrongCount})` : ''}</NavLink>
            <NavLink to="/progress" className={link}>我的紀錄</NavLink>
          </nav>
          <SoundToggle />
          <UserBar />
        </div>
      </header>
      <main className="mx-auto max-w-5xl w-full px-4 py-5 flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/unit/:id" element={<Unit />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice/:qid" element={<Practice />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/learn/:id" element={<Learn />} />
          <Route path="/coach/:qid" element={<Coach />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/wrongbook" element={<WrongBook />} />
          <Route path="/teacher" element={<TeacherHome />} />
          <Route path="/teacher/class/:id" element={<ClassPage />} />
          <Route path="/teacher/student/:id" element={<StudentPage />} />
          <Route path="/teacher/questions" element={<QuestionsPage />} />
          <Route path="/teacher/questions/new" element={<NewQuestion />} />
          <Route path="/teacher/questions/:qid" element={<QuestionEdit />} />
          <Route path="/games" element={<GamesHome />} />
          <Route path="/games/:gid/:lvl" element={<GamePlay />} />
        </Routes>
      </main>
      <footer className="mx-auto max-w-5xl w-full px-4 pb-6"><p className="rounded-2xl bg-white/90 text-center text-xs text-navy-900 py-2 px-3">
        教材來源:台科大圖書《電子學 I》講義、《電子學(上)習作本詳解》(著作權屬原出版者)。本站為教學輔助,非官方產品。範圍:習作 1-1~2-3 整流濾波。題目與解析尚未經專業教師審核。<Link to="/about" className="ml-1 font-bold underline">詳細來源</Link>
      </p></footer>
    </div>
  )
}
