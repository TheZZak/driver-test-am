import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useDataset } from '../App'
import { PageHead, SiteHeader } from '../components/Layout'
import { NumberStrip, type CellState } from '../components/NumberStrip'
import { QuestionCard } from '../components/QuestionCard'
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
  const states: CellState[] = session.ids.map((id, i) => {
    const a = session.answers[i]
    if (a == null) return 'none'
    return a === data.byId.get(id)!.a ? 'correct' : 'wrong'
  })

  const again = () => {
    if (session.exam) {
      startExam(data, persist, session.label)
      navigate('/exam')
    } else if (startPractice(session.mode, session.label, shuffle(session.ids))) navigate('/quiz')
  }
  const retryMissed = () => startPractice('retry', t.retryWrong, shuffle(missed)) && navigate('/quiz')
  const jump = (i: number) => {
    setWrongOnly(false)
    requestAnimationFrame(() => document.getElementById(`r${i}`)?.scrollIntoView({ block: 'start' }))
  }

  return (
    <>
      <SiteHeader />
      <main className="page">
        <PageHead title={t.results} note={session.label} />

        <section className={'result-box' + (passed === true ? ' pass' : passed === false ? ' fail' : '')}>
          {passed != null && <p className="result-verdict">{passed ? t.passed : t.failed}</p>}
          {timeUp && <p className="muted">{t.timeUp}</p>}
          <table className="data-table result-table">
            <tbody>
              <tr>
                <th>{t.correctCount}</th>
                <td className="ok">
                  {score.correct} / {score.total}
                </td>
              </tr>
              <tr>
                <th>{t.wrongCount}</th>
                <td className={score.wrong ? 'bad' : ''}>{score.wrong}</td>
              </tr>
              {score.skipped > 0 && (
                <tr>
                  <th>{t.skippedCount}</th>
                  <td>{score.skipped}</td>
                </tr>
              )}
              <tr>
                <th>{t.time}</th>
                <td>{formatDuration(session.finishedAt - session.startedAt)}</td>
              </tr>
            </tbody>
          </table>
          {session.exam && <p className="muted small">{t.allowedErrors(session.maxErrors ?? 0)}</p>}
        </section>

        <NumberStrip states={states} current={-1} onJump={jump} />

        <div className="row-actions">
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

        <div className="radio-row" role="radiogroup">
          <label>
            <input type="radio" checked={wrongOnly} onChange={() => setWrongOnly(true)} />
            {t.showWrongOnly} ({missed.length})
          </label>
          <label>
            <input type="radio" checked={!wrongOnly} onChange={() => setWrongOnly(false)} />
            {t.showAll} ({session.ids.length})
          </label>
        </div>

        {wrongOnly && missed.length === 0 && <p className="empty">{t.perfect}</p>}

        <div className="q-list">
          {rows.map(({ q, answer, i }) => {
            const group = data.groups.find((g) => g.id === q.g)!
            return (
              <div key={q.id} id={`r${i}`} className="q-item">
                {answer == null && <p className="muted small no-answer">{t.noAnswer}</p>}
                <QuestionCard
                  q={q}
                  groupTitle={group.title}
                  selected={answer}
                  reveal
                  lazyImage
                  heading={`${t.question} ${i + 1}`}
                />
              </div>
            )
          })}
        </div>
      </main>
    </>
  )
}
