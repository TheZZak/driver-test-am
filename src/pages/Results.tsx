import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useDataset } from '../App'
import { QuestionCard } from '../components/QuestionCard'
import { TopBar } from '../components/TopBar'
import { t } from '../i18n/hy'
import { examPassed, formatDuration, sessionScore, startExam, startPractice } from '../lib/sessions'
import { shuffle } from '../lib/shuffle'
import { usePersist, useSession } from '../lib/storage'

export function Results() {
  const data = useDataset()
  const persist = usePersist()
  const session = useSession()
  const navigate = useNavigate()
  const [wrongOnly, setWrongOnly] = useState(true)

  if (!session || !session.finishedAt) return <Navigate to="/" replace />

  const score = sessionScore(session, data)
  const passed = session.exam ? examPassed(session, data) : null
  const timeUp = session.deadline != null && session.finishedAt >= session.deadline
  const missed = session.ids.filter((id, i) => session.answers[i] !== data.byId.get(id)!.a)
  const rows = session.ids
    .map((id, i) => ({ q: data.byId.get(id)!, answer: session.answers[i], i }))
    .filter((r) => !wrongOnly || r.answer !== r.q.a)

  const again = () => {
    if (session.exam) {
      startExam(data, persist, session.label)
      navigate('/exam')
    } else if (startPractice(session.mode, session.label, shuffle(session.ids))) navigate('/quiz')
  }
  const retryMissed = () => startPractice('retry', t.retryWrong, shuffle(missed)) && navigate('/quiz')

  return (
    <div className="page">
      <TopBar title={t.results} />

      <section className={'card result-hero' + (passed === true ? ' pass' : passed === false ? ' fail' : '')}>
        <div className="muted">{session.label}</div>
        {passed != null && <div className="result-verdict">{passed ? t.passed : t.failed}</div>}
        {timeUp && <div className="muted">{t.timeUp}</div>}
        <div className="result-score">
          {score.correct} <small>/ {score.total}</small>
        </div>
        <div className="result-stats">
          <span className="ok">
            {t.correctCount}՝ {score.correct}
          </span>
          <span className="bad">
            {t.wrongCount}՝ {score.wrong}
          </span>
          {score.skipped > 0 && (
            <span>
              {t.skippedCount}՝ {score.skipped}
            </span>
          )}
          <span>
            {t.time}՝ {formatDuration(session.finishedAt - session.startedAt)}
          </span>
        </div>
        {session.exam && <div className="muted">{t.allowedErrors(session.maxErrors ?? 0)}</div>}
      </section>

      <div className="actions">
        {missed.length > 0 && (
          <button className="btn primary" onClick={retryMissed}>
            {t.retryWrong} ({missed.length})
          </button>
        )}
        <button className="btn" onClick={again}>
          {session.exam ? t.newExam : t.again}
        </button>
        <Link className="btn" to="/">
          {t.home}
        </Link>
      </div>

      <div className="chips center">
        <button className={'chip' + (wrongOnly ? ' on' : '')} onClick={() => setWrongOnly(true)}>
          {t.showWrongOnly} ({missed.length})
        </button>
        <button className={'chip' + (!wrongOnly ? ' on' : '')} onClick={() => setWrongOnly(false)}>
          {t.showAll} ({session.ids.length})
        </button>
      </div>

      {wrongOnly && missed.length === 0 && <p className="center big-note">{t.perfect}</p>}

      <div className="review-list">
        {rows.map(({ q, answer, i }) => {
          const group = data.groups.find((g) => g.id === q.g)!
          return (
            <div key={q.id}>
              {answer == null && <div className="review-note muted">{t.noAnswer}</div>}
              <QuestionCard q={q} groupTitle={group.title} selected={answer} reveal lazyImage index={i + 1} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
