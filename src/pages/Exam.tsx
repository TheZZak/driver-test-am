import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useDataset } from '../App'
import { QuestionCard } from '../components/QuestionCard'
import { TopBar } from '../components/TopBar'
import { t } from '../i18n/hy'
import { examPassed, formatDuration, sessionScore } from '../lib/sessions'
import { addExam, getSession, recordAnswer, setSession, toggleBookmark, useSession } from '../lib/storage'
import { useKeys, usePrefetchImage } from '../lib/hooks'
import type { Session } from '../types'

export function Exam() {
  const session = useSession()
  if (!session || !session.exam) return <Navigate to="/" replace />
  if (session.finishedAt) return <Navigate to="/results" replace />
  return <ExamRunner session={session} />
}

function ExamRunner({ session }: { session: Session }) {
  const data = useDataset()
  const navigate = useNavigate()
  const { idx, ids, answers } = session
  const q = data.byId.get(ids[idx])!
  const group = data.groups.find((g) => g.id === q.g)!
  const [now, setNow] = useState(Date.now())
  const finished = useRef(false)
  const remaining = (session.deadline ?? Infinity) - now

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [idx])
  usePrefetchImage(data, ids[idx + 1])

  const finish = useCallback(() => {
    // read the latest stored session so a timer firing mid-render never loses answers
    const s = getSession()
    if (finished.current || !s || s.finishedAt) return
    finished.current = true
    const end = Math.min(Date.now(), s.deadline ?? Infinity)
    s.ids.forEach((id, i) => {
      const a = s.answers[i]
      if (a != null) recordAnswer(id, a === data.byId.get(id)?.a)
    })
    const done = { ...s, finishedAt: end }
    const { correct, total } = sessionScore(done, data)
    addExam({ at: end, total, correct, passed: examPassed(done, data), seconds: Math.round((end - s.startedAt) / 1000) })
    setSession(done)
    navigate('/results')
  }, [data, navigate])

  const expired = remaining <= 0
  useEffect(() => {
    if (expired) {
      finish()
      return
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [expired, finish])

  const select = (n: number) => {
    const s = getSession()
    if (s && !s.finishedAt) setSession({ ...s, answers: s.answers.map((a, i) => (i === s.idx ? n : a)) })
  }
  const goTo = (i: number) => {
    const s = getSession()
    if (s && !s.finishedAt && i >= 0 && i < s.ids.length) setSession({ ...s, idx: i })
  }
  const step = (d: number) => goTo((getSession()?.idx ?? idx) + d)
  const unanswered = answers.filter((a) => a == null).length
  const askFinish = () => {
    if (window.confirm(t.finishConfirm(unanswered))) finish()
  }

  useKeys((e) => {
    const d = Number(e.key)
    if (d >= 1 && d <= q.opts.length) select(d)
    else if (e.key === 'Enter' || e.key === 'ArrowRight') step(1)
    else if (e.key === 'ArrowLeft') step(-1)
    else if (e.key === 'b' || e.key === 'B') toggleBookmark(q.id)
    else return
    e.preventDefault()
  })

  return (
    <div className="page quiz exam">
      <TopBar
        title={session.label}
        right={
          <span className={'timer' + (remaining < 5 * 60_000 ? ' low' : '')} title={t.timeLeft} aria-label={t.timeLeft}>
            ⏱ {formatDuration(remaining)}
          </span>
        }
      />

      <div className="quiz-status">
        <span className="counter">
          {t.question} {t.of(idx + 1, ids.length)}
        </span>
        <button className="link-btn" onClick={askFinish}>
          {t.finishExam}
        </button>
      </div>
      <nav className="qnav" aria-label={t.question}>
        {ids.map((id, i) => (
          <button
            key={id}
            className={'qnav-item' + (i === idx ? ' current' : '') + (answers[i] != null ? ' done' : '')}
            onClick={() => goTo(i)}
            aria-current={i === idx}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      <QuestionCard
        key={q.id}
        q={q}
        groupTitle={group.title}
        selected={answers[idx]}
        reveal={false}
        onSelect={select}
      />
      <p className="hint muted">{t.allowedErrors(session.maxErrors ?? 0)}</p>

      <nav className="bottom-bar">
        <button className="btn" onClick={() => goTo(idx - 1)} disabled={idx === 0}>
          ← {t.prev}
        </button>
        {idx < ids.length - 1 ? (
          <button className={'btn' + (answers[idx] != null ? ' primary' : '')} onClick={() => goTo(idx + 1)}>
            {t.next} →
          </button>
        ) : (
          <button className="btn primary" onClick={askFinish}>
            {t.finishExam}
          </button>
        )}
      </nav>
    </div>
  )
}
