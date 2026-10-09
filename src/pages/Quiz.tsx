import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useDataset } from '../App'
import { TestHeader } from '../components/Layout'
import { NumberStrip, type CellState } from '../components/NumberStrip'
import { QuestionCard } from '../components/QuestionCard'
import { t } from '../i18n/hy'
import { sessionScore } from '../lib/sessions'
import { getSession, recordAnswer, setSession, toggleBookmark, useSession } from '../lib/storage'
import { useKeys, usePrefetchImage } from '../lib/hooks'
import type { Session } from '../types'

export function Quiz() {
  const session = useSession()
  if (!session || session.exam) return <Navigate to="/" replace />
  if (session.finishedAt) return <Navigate to="/results" replace />
  return <PracticeRunner session={session} />
}

function PracticeRunner({ session }: { session: Session }) {
  const data = useDataset()
  const navigate = useNavigate()
  const { idx, ids } = session
  const q = data.byId.get(ids[idx])!
  const group = data.groups.find((g) => g.id === q.g)!
  const selected = session.answers[idx]
  const reveal = selected != null
  const isLast = idx === ids.length - 1
  const score = sessionScore(session, data)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [idx])
  usePrefetchImage(data, ids[idx + 1])

  // handlers read the stored session so fast key presses never act on a stale render
  const answer = (n: number) => {
    const s = getSession()
    if (!s || s.finishedAt || s.answers[s.idx] != null) return
    const cur = data.byId.get(s.ids[s.idx])!
    recordAnswer(cur.id, n === cur.a)
    setSession({ ...s, answers: s.answers.map((a, i) => (i === s.idx ? n : a)) })
  }
  const finish = () => {
    const s = getSession()
    if (!s || s.finishedAt) return
    setSession({ ...s, finishedAt: Date.now() })
    navigate('/results')
  }
  const goTo = (i: number) => {
    const s = getSession()
    if (s && !s.finishedAt && i >= 0 && i < s.ids.length) setSession({ ...s, idx: i })
  }
  const next = () => {
    const s = getSession()
    if (!s || s.finishedAt) return
    if (s.idx >= s.ids.length - 1) finish()
    else goTo(s.idx + 1)
  }
  const prev = () => goTo((getSession()?.idx ?? idx) - 1)

  useKeys((e) => {
    const d = Number(e.key)
    if (d >= 1 && d <= q.opts.length) answer(d)
    else if (e.key === 'Enter' || e.key === 'ArrowRight') next()
    else if (e.key === 'ArrowLeft') prev()
    else if (e.key === 'b' || e.key === 'B') toggleBookmark(q.id)
    else return
    e.preventDefault()
  })

  const states: CellState[] = ids.map((id, i) => {
    const a = session.answers[i]
    if (a == null) return 'none'
    return a === data.byId.get(id)!.a ? 'correct' : 'wrong'
  })

  return (
    <>
      <TestHeader
        title={session.label}
        right={
          <>
            <span className="score">
              <span className="ok">{score.correct}</span> / <span className="bad">{score.wrong}</span>
            </span>
            <button className="btn small" onClick={finish}>
              {t.finish}
            </button>
          </>
        }
      />
      <main className="page test">
        <NumberStrip states={states} current={idx} onJump={goTo} />
        <QuestionCard
          key={q.id}
          q={q}
          groupTitle={group.title}
          selected={selected}
          reveal={reveal}
          onSelect={answer}
          heading={`${t.question} ${t.of(idx + 1, ids.length)}`}
        />
        <div className="test-nav">
          <button className="btn" onClick={prev} disabled={idx === 0}>
            ← {t.prev}
          </button>
          <button className={'btn' + (reveal ? ' primary' : '')} onClick={next}>
            {reveal ? (isLast ? t.finish : t.next) : isLast ? t.finish : t.skip} →
          </button>
        </div>
        <p className="hint kbd-hint">{t.keyboardHint}</p>
      </main>
    </>
  )
}
