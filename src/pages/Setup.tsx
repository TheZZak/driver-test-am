import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDataset } from '../App'
import { TopBar } from '../components/TopBar'
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
    <div className="page">
      <TopBar title={title} />

      {isGroup && <p className="muted center">{group!.subtitle} · {t.questionsCount(group!.count)}</p>}

      {isMix && (
        <section className="card form-section">
          <div className="row-between">
            <h3>{t.selectGroups}</h3>
            <div className="row">
              <button className="link-btn" onClick={() => setSelected(data.groups.map((g) => g.id))}>
                {t.selectAll}
              </button>
              <button className="link-btn" onClick={() => setSelected([])}>
                {t.clearAll}
              </button>
            </div>
          </div>
          <div className="chips">
            {data.groups.map((g) => (
              <button
                key={g.id}
                className={'chip' + (selected.includes(g.id) ? ' on' : '')}
                aria-pressed={selected.includes(g.id)}
                onClick={() => toggle(g.id)}
              >
                {g.title} <small>({g.count})</small>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="card form-section">
        <h3>{t.count}</h3>
        <div className="chips">
          {COUNTS.filter((c) => c < available).map((c) => (
            <button key={c} className={'chip' + (count === c ? ' on' : '')} onClick={() => setCount(c)}>
              {c}
            </button>
          ))}
          <button className={'chip' + (count === 'all' ? ' on' : '')} onClick={() => setCount('all')}>
            {t.all} ({available})
          </button>
        </div>
      </section>

      {mode !== 'random' && (
        <section className="card form-section">
          <h3>{t.order}</h3>
          <div className="chips">
            <button className={'chip' + (order === 'seq' ? ' on' : '')} onClick={() => setOrder('seq')}>
              {t.orderSeq}
            </button>
            <button className={'chip' + (order === 'shuffle' ? ' on' : '')} onClick={() => setOrder('shuffle')}>
              {t.orderShuffle}
            </button>
          </div>
        </section>
      )}

      <section className="card form-section">
        <label className="check">
          <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
          {t.onlyUnanswered}
        </label>
        <p className="muted">{t.available(available)}</p>
      </section>

      <div className="actions">
        <button className="btn primary big" disabled={!effective} onClick={begin}>
          {t.start} · {t.questionsCount(effective)}
        </button>
        {isGroup && (
          <Link className="btn" to={`/browse?g=${group!.id}`}>
            {t.browseGroup}
          </Link>
        )}
      </div>
    </div>
  )
}
