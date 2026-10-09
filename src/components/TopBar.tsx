import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { t } from '../i18n/hy'

export function TopBar({ title, back = '/', right }: { title: ReactNode; back?: string | null; right?: ReactNode }) {
  return (
    <header className="topbar">
      {back != null ? (
        <Link to={back} className="icon-btn" aria-label={t.back} title={t.back}>
          ←
        </Link>
      ) : (
        <span className="icon-btn placeholder" />
      )}
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-right">{right}</div>
    </header>
  )
}
