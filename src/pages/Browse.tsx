import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDataset } from '../App'
import { QuestionCard } from '../components/QuestionCard'
import { PageHead, SiteHeader } from '../components/Layout'
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
    <>
      <SiteHeader />
      <main className="page">
        <PageHead title={t.modeBrowse} note={t.modeBrowseDesc} />
        <div className="filters">
          <input
            className="input search"
            type="search"
            placeholder={t.search}
            value={query}
            onChange={(e) => update({ q: e.target.value })}
          />
          <select className="input" value={g} onChange={(e) => update({ g: e.target.value === '0' ? '' : e.target.value })}>
            <option value="0">{t.allGroups}</option>
            {data.groups.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title} ({x.count})
              </option>
            ))}
          </select>
        </div>
        <p className="muted small">{list.length ? t.found(list.length) : t.noResults}</p>

        <div className="q-list">
          {list.slice(0, limit).map((q) => (
            <div key={q.id} className="q-item">
              <QuestionCard q={q} groupTitle={groupTitle(q.g)} selected={null} reveal lazyImage />
            </div>
          ))}
        </div>
        {limit < list.length && (
          <div className="center">
            <button className="btn" onClick={() => setLimit((n) => n + PAGE)}>
              {t.loadMore} ({list.length - limit})
            </button>
          </div>
        )}
      </main>
    </>
  )
}
