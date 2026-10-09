import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useDataset } from '../App'
import { t } from '../i18n/hy'
import { mistakeIds, startPractice } from '../lib/sessions'
import { shuffle } from '../lib/shuffle'
import { usePersist } from '../lib/storage'
import { IconBack, IconBook, IconMistake, IconSettings, IconStar, IconWheel } from './Icons'

/** Site header for all non-test pages. */
export function SiteHeader() {
  const data = useDataset()
  const persist = usePersist()
  const navigate = useNavigate()
  const mistakes = mistakeIds(data, persist)
  const bookmarks = persist.bookmarks.filter((id) => data.byId.has(id))

  const start = (mode: 'mistakes' | 'bookmarks', label: string, ids: string[]) => {
    if (startPractice(mode, label, shuffle(ids))) navigate('/quiz')
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand">
          <IconWheel />
          <span>{t.appName}</span>
        </Link>
        <nav className="site-nav">
          <NavLink to="/browse">
            <IconBook /> {t.navBrowse}
          </NavLink>
          <button
            type="button"
            className="nav-btn"
            disabled={!mistakes.length}
            onClick={() => start('mistakes', t.modeMistakes, mistakes)}
          >
            <IconMistake /> {t.navMistakes} <span className="count">{mistakes.length}</span>
          </button>
          <button
            type="button"
            className="nav-btn"
            disabled={!bookmarks.length}
            onClick={() => start('bookmarks', t.modeBookmarks, bookmarks)}
          >
            <IconStar /> {t.navBookmarks} <span className="count">{bookmarks.length}</span>
          </button>
          <NavLink to="/settings">
            <IconSettings /> {t.settings}
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

/** Page heading with a "back to home" link above it, like the official site. */
export function PageHead({ title, note, back = '/' }: { title: ReactNode; note?: ReactNode; back?: string | null }) {
  return (
    <div className="page-head">
      {back != null && (
        <Link to={back} className="back-link">
          <IconBack /> {t.home}
        </Link>
      )}
      <h1>{title}</h1>
      {note && <p className="page-note">{note}</p>}
    </div>
  )
}

/** Compact bar shown while answering questions. */
export function TestHeader({ title, right }: { title: ReactNode; right?: ReactNode }) {
  return (
    <header className="test-header">
      <div className="test-header-inner">
        <Link to="/" className="back-link">
          <IconBack /> {t.exit}
        </Link>
        <span className="test-title">{title}</span>
        <div className="test-header-right">{right}</div>
      </div>
    </header>
  )
}
