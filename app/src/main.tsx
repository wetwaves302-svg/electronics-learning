import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import './index.css'
import App from './App.tsx'
import { api } from './api'
import { restoreSession } from './auth'
import { loadOverrides, type Overrides } from './data/bank'

void restoreSession()
void loadOverrides(() => api<Overrides>('GET', '/api/questions/overrides'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
