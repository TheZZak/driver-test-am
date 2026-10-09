import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDataset } from '../App'
import { PageHead, SiteHeader } from '../components/Layout'
import { t } from '../i18n/hy'
import { pickQuestions, poolFor, startPractice, type Order } from '../lib/sessions'
import { usePersist } from '../lib/storage'

const COUNTS = [10, 20, 50, 100] as const

export function Setup() {
  const { mode } = useParams()
  const [params] = useSearchParams()
  const data = useDataset()
  const persist = usePersist()
  const navigate = useNavigate()

  const groupId = Number(params.get('g'))
  const group = data.groups.find((g) => g.id === groupId)
  const isGroup = mode === 'group'
  const isMix = mode === 'mix'

  const [selected, setSelected] = useState<number[]>(() => data.groups.map((g) => g.id))
  const [order, setOrder] = useState<Order>(isGroup ? 'seq' : 'shuffle')
  const [count, setCount] = useState<number | 'all'>(isGroup ? 'all' : 20)
  const [onlyNew, setOnlyNew] = useState(false)

  const groups = isGroup ? (group ? [group.id] : []) : isMix ? selected : data.groups.map((g) => g.id)
  const groupsKey = groups.join(',')
  const available = useMemo(
    () => poolFor(data, persist, groups, onlyNew).reduce((s, p) => s + p.length, 0),
    [data, persist.stats, groupsKey, onlyNew],
  )

  if (mode !== 'group' && mode !== 'random' && mode !== 'mix') return <Navigate to="/" replace />
  if (isGroup && !group) return <Navigate to="/" replace />

  const title = isGroup ? group!.title : isMix ? t.modeMix : t.modeRandom
  const effective = count === 'all' ? available : Math.min(count, available)

  const begin = () => {
    const ids = pickQuestions(data, persist, { groups, count, order, onlyNew })
    if (startPractice(mode, title, ids)) navigate('/quiz')
  }

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].sort((a, b) => a - b)))

  return (
    <>
      <SiteHeader />
      <main className="page narrow">
        <PageHead
          title={title}
          note={isGroup ? `${group!.subtitle} · ${t.questionsCount(group!.count)}` : undefined}
        />

        {isMix && (
          <fieldset className="form-block">
            <legend>{t.selectGroups}</legend>
            <div className="check-grid">
              {data.groups.map((g) => (
                <label key={g.id} className="check">
                  <input type="checkbox" checked={selected.includes(g.id)} onChange={() => toggle(g.id)} />
                  {g.title} <span className="muted">({g.count})</span>
                </label>
              ))}
            </div>
            <div className="row-links">
              <button className="link" onClick={() => setSelected(data.groups.map((g) => g.id))}>
                {t.selectAll}
              </button>
              <button className="link" onClick={() => setSelected([])}>
                {t.clearAll}
              </button>
            </div>
          </fieldset>
        )}

        <fieldset className="form-block">
          <legend>{t.count}</legend>
          <div className="radio-row">
            {COUNTS.filter((c) => c < available).map((c) => (
              <label key={c}>
                <input type="radio" name="count" checked={count === c} onChange={() => setCount(c)} />
                {c}
              </label>
            ))}
            <label>
              <input type="radio" name="count" checked={count === 'all'} onChange={() => setCount('all')} />
              {t.all} ({available})
            </label>
          </div>
        </fieldset>

        {mode !== 'random' && (
          <fieldset className="form-block">
            <legend>{t.order}</legend>
            <div className="radio-row">
              <label>
                <input type="radio" name="order" checked={order === 'seq'} onChange={() => setOrder('seq')} />
                {t.orderSeq}
              </label>
              <label>
                <input type="radio" name="order" checked={order === 'shuffle'} onChange={() => setOrder('shuffle')} />
                {t.orderShuffle}
              </label>
            </div>
          </fieldset>
        )}

        <fieldset className="form-block">
          <label className="check">
            <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
            {t.onlyUnanswered}
          </label>
          <p className="muted small">{t.available(available)}</p>
        </fieldset>

        <div className="row-actions">
          <button className="btn primary big" disabled={!effective} onClick={begin}>
            {t.start} · {t.questionsCount(effective)}
          </button>
          {isGroup && (
            <Link className="btn big" to={`/browse?g=${group!.id}`}>
              {t.browseGroup}
            </Link>
          )}
        </div>
      </main>
    </>
  )
}
