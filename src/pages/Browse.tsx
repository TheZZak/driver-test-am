import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDataset } from '../App'
import { QuestionCard } from '../components/QuestionCard'
import { TopBar } from '../components/TopBar'
import { t } from '../i18n/hy'

const PAGE = 25

// Search only: the PDFs spell "and" both as "եւ" and "և", so match either.
const fold = (s: string) => s.toLocaleLowerCase('hy').replace(/և/g, 'եւ')

export function Browse() {
  const data = useDataset()
  const [params, setParams] = useSearchParams()
  const g = Number(params.get('g')) || 0
  const query = params.get('q') ?? ''
  const [limit, setLimit] = useState(PAGE)

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next, { replace: true })
    setLimit(PAGE)
  }

  const index = useMemo(
    () => data.questions.map((q) => ({ q, text: fold([q.q, ...q.opts].join(' ')) })),
    [data],
  )
  const list = useMemo(() => {
    const needle = fold(query.trim())
    return index
      .filter((r) => (!g || r.q.g === g) && (!needle || r.text.includes(needle)))
      .map((r) => r.q)
  }, [index, g, query])

  const groupTitle = (id: number) => data.groups.find((x) => x.id === id)!.title

  return (
    <div className="page">
      <TopBar title={t.modeBrowse} />

      <input
        className="search"
        type="search"
        placeholder={t.search}
        value={query}
        onChange={(e) => update({ q: e.target.value })}
      />
      <div className="chips scroll-x">
        <button className={'chip' + (!g ? ' on' : '')} onClick={() => update({ g: '' })}>
          {t.allGroups}
        </button>
        {data.groups.map((x) => (
          <button key={x.id} className={'chip' + (g === x.id ? ' on' : '')} onClick={() => update({ g: String(x.id) })}>
            {x.title}
          </button>
        ))}
      </div>
      <p className="muted">{list.length ? t.found(list.length) : t.noResults}</p>

      <div className="review-list">
        {list.slice(0, limit).map((q) => (
          <QuestionCard key={q.id} q={q} groupTitle={groupTitle(q.g)} selected={null} reveal lazyImage />
        ))}
      </div>
      {limit < list.length && (
        <div className="center">
          <button className="btn" onClick={() => setLimit((n) => n + PAGE)}>
            {t.loadMore} ({list.length - limit})
          </button>
        </div>
      )}
    </div>
  )
}
