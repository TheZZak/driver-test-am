import { createContext, useContext, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useData } from './data'
import { t } from './i18n/hy'
import { getSession, setSession, usePersist } from './lib/storage'
import { Browse } from './pages/Browse'
import { Exam } from './pages/Exam'
import { Home } from './pages/Home'
import { Quiz } from './pages/Quiz'
import { Results } from './pages/Results'
import { Settings } from './pages/Settings'
import { Setup } from './pages/Setup'
import type { Dataset } from './types'

const DataContext = createContext<Dataset | null>(null)

export function useDataset(): Dataset {
  const d = useContext(DataContext)
  if (!d) throw new Error('Dataset not loaded')
  return d
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function useTheme() {
  const theme = usePersist().settings.theme
  useEffect(() => {
    const el = document.documentElement
    if (theme === 'auto') delete el.dataset.theme
    else el.dataset.theme = theme
  }, [theme])
}

export function App() {
  useTheme()
  const state = useData()

  if (state.status === 'loading') {
    return <div className="center-screen muted">{t.loading}</div>
  }
  if (state.status === 'error') {
    return (
      <div className="center-screen">
        <p>{t.loadError}</p>
        <button className="btn primary" onClick={state.retry}>
          {t.retry}
        </button>
      </div>
    )
  }

  // drop a saved session that refers to questions no longer in the data set
  const saved = getSession()
  if (saved && !saved.ids.every((id) => state.data.byId.has(id))) setSession(null)

  return (
    <DataContext.Provider value={state.data}>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setup/:mode" element={<Setup />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/results" element={<Results />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </DataContext.Provider>
  )
}
