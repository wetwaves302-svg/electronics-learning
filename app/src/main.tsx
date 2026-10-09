import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import './index.css'
import App from './App.tsx'
import { api } from './api'
import { restoreSession } from './auth'
import { loadOverrides, type Overrides } from './data/bank'

// 靜態版(GitHub Pages)沒有伺服器:不登入、不下載老師修訂
if (import.meta.env.VITE_STATIC !== '1') {
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
