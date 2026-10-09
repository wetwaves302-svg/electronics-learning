import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import './index.css'
import App from './App.tsx'
import { api } from './api'
import { restoreSession } from './auth'
import { startCollect } from './collect'
import { loadOverrides, type Overrides } from './data/bank'

// 靜態版(GitHub Pages)沒有伺服器:不登入、不下載老師修訂;若老師設定了 Google 表單,學生同意後紀錄會自動傳給老師
if (import.meta.env.VITE_STATIC === '1') void startCollect(import.meta.env.BASE_URL)
else {
  void restoreSession()
  void loadOverrides(() => api<Overrides>('GET', '/api/questions/overrides'))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
