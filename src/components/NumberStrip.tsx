import { useEffect, useState, type CSSProperties } from 'react'
import { t } from '../i18n/hy'

export type CellState = 'none' | 'answered' | 'correct' | 'wrong'

const PAGE = 20

/** Row of numbered squares, as on exam simulators. Long sessions are paged by 20. */
export function NumberStrip({
  states,
  current,
  onJump,
}: {
  states: CellState[]
  current: number
  onJump: (i: number) => void
}) {
  const paged = states.length > 30
  const pageOf = (i: number) => Math.floor(Math.max(0, i) / PAGE)
  const [page, setPage] = useState(pageOf(current))
  useEffect(() => {
    setPage(pageOf(current))
  }, [current])

  const start = paged ? page * PAGE : 0
  const end = paged ? Math.min(states.length, start + PAGE) : states.length
  const cells = []
  for (let i = start; i < end; i++) {
    cells.push(
      <button
        key={i}
        type="button"
        className={'cell ' + states[i] + (i === current ? ' current' : '')}
        onClick={() => onJump(i)}
        aria-current={i === current}
        aria-label={`${t.question} ${i + 1}`}
      >
        {i + 1}
      </button>,
    )
  }
  const cols = Math.min(PAGE, end - start)
  const style = { '--cols': cols, '--cols-sm': Math.min(10, cols) } as CSSProperties
  return (
    <nav className="strip" aria-label={t.question}>
      {paged && (
        <button type="button" className="cell page" disabled={page === 0} onClick={() => setPage(page - 1)}>
          ‹
        </button>
      )}
      <div className="strip-cells" style={style}>
        {cells}
      </div>
      {paged && (
        <button type="button" className="cell page" disabled={end >= states.length} onClick={() => setPage(page + 1)}>
          ›
        </button>
      )}
    </nav>
  )
}
