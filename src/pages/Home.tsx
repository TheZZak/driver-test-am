import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDataset } from '../App'
import { ProgressBar } from '../components/ProgressBar'
import { t } from '../i18n/hy'
import { startExam, startPractice } from '../lib/sessions'
import { shuffle } from '../lib/shuffle'
import { isMastered, usePersist, useSession } from '../lib/storage'

export function Home() {
  const data = useDataset()
  const persist = usePersist()
  const session = useSession()
  const navigate = useNavigate()
  const { stats, settings, exams } = persist

  const summary = useMemo(() => {
    const perGroup = new Map<number, { seen: number; mastered: number }>()
    let seen = 0
    let mastered = 0
    let correct = 0
    let wrong = 0
    const mistakes: string[] = []
    for (const q of data.questions) {
      const s = stats[q.id]
      const g = perGroup.get(q.g) ?? { seen: 0, mastered: 0 }
      if (s?.seen) {
        g.seen++
        seen++
        correct += s.correct
        wrong += s.wrong
      }
      if (isMastered(s)) {
        g.mastered++
        mastered++
      }
      if (s?.mistake) mistakes.push(q.id)
      perGroup.set(q.g, g)
    }
    const accuracy = correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : null
    return { perGroup, seen, mastered, accuracy, mistakes }
  }, [data, stats])

  const bookmarks = persist.bookmarks.filter((id) => data.byId.has(id))
  const active = session && !session.finishedAt ? session : null
  const activeDone = active ? active.answers.filter((a) => a != null).length : 0
  const passedExams = exams.filter((e) => e.passed).length

  const go = (ok: boolean) => ok && navigate('/quiz')

  return (
    <div className="page">
      <header className="hero">
        <div>
          <h1>{t.appName}</h1>
          <p>
            {t.appSub} · {t.questionsCount(data.questions.length)} · {t.groupsCount(data.groups.length)}
          </p>
        </div>
        <Link to="/settings" className="icon-btn on-dark" aria-label={t.settings} title={t.settings}>
          ⚙
        </Link>
      </header>

      {active && (
        <button className="card continue" onClick={() => navigate(active.exam ? '/exam' : '/quiz')}>
          <div>
            <div className="continue-title">{t.continueSession}</div>
            <div className="muted">
              {active.label} · {t.of(activeDone, active.ids.length)}
            </div>
          </div>
          <span className="chevron">→</span>
        </button>
      )}

      <h2 className="section-title">{t.modes}</h2>
      <div className="tiles">
        <button
          className="tile tile-exam"
          onClick={() => {
            startExam(data, persist, t.modeExam)
            navigate('/exam')
          }}
        >
          <span className="tile-icon">⏱</span>
          <span className="tile-title">{t.modeExam}</span>
          <span className="tile-desc">
            {t.modeExamDesc(settings.examCount, settings.examMinutes, settings.examMaxErrors)}
          </span>
        </button>
        <Link className="tile" to="/setup/random">
          <span className="tile-icon">🔀</span>
          <span className="tile-title">{t.modeRandom}</span>
          <span className="tile-desc">{t.modeRandomDesc}</span>
        </Link>
        <Link className="tile" to="/setup/mix">
          <span className="tile-icon">🧩</span>
          <span className="tile-title">{t.modeMix}</span>
          <span className="tile-desc">{t.modeMixDesc}</span>
        </Link>
        <button
          className="tile"
          disabled={!summary.mistakes.length}
          onClick={() => go(startPractice('mistakes', t.modeMistakes, shuffle(summary.mistakes)))}
        >
          <span className="tile-icon">✗</span>
          <span className="tile-title">{t.modeMistakes}</span>
          <span className="tile-desc">{t.modeMistakesDesc(summary.mistakes.length)}</span>
        </button>
        <button
          className="tile"
          disabled={!bookmarks.length}
          onClick={() => go(startPractice('bookmarks', t.modeBookmarks, shuffle(bookmarks)))}
        >
          <span className="tile-icon">★</span>
          <span className="tile-title">{t.modeBookmarks}</span>
          <span className="tile-desc">{t.modeBookmarksDesc(bookmarks.length)}</span>
        </button>
        <Link className="tile" to="/browse">
          <span className="tile-icon">📖</span>
          <span className="tile-title">{t.modeBrowse}</span>
          <span className="tile-desc">{t.modeBrowseDesc}</span>
        </Link>
      </div>

      <h2 className="section-title">{t.groups}</h2>
      <div className="groups">
        {data.groups.map((g) => {
          const gs = summary.perGroup.get(g.id) ?? { seen: 0, mastered: 0 }
          return (
            <Link key={g.id} className="card group-card" to={`/setup/group?g=${g.id}`}>
              <div className="group-head">
                <span className="group-title">{g.title}</span>
                <span className="muted">{t.questionsCount(g.count)}</span>
              </div>
              <ProgressBar value={gs.mastered} total={g.count} label={t.mastered} />
              <div className="group-foot muted">
                <span>
                  {t.mastered}՝ {gs.mastered}
                </span>
                <span>
                  {t.answered}՝ {gs.seen}
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      <h2 className="section-title">{t.stats}</h2>
      <div className="card stats">
        <div className="stat">
          <span className="stat-value">
            {summary.seen}
            <small> / {data.questions.length}</small>
          </span>
          <span className="stat-label">{t.answered}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{summary.mastered}</span>
          <span className="stat-label">{t.mastered}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{summary.accuracy == null ? '—' : `${summary.accuracy}%`}</span>
          <span className="stat-label">{t.accuracy}</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {passedExams}
            <small> / {exams.length}</small>
          </span>
          <span className="stat-label">{t.examsPassed}</span>
        </div>
      </div>

      {exams.length > 0 && (
        <>
          <h2 className="section-title">{t.recentExams}</h2>
          <ul className="card exam-list">
            {exams.slice(0, 5).map((e) => (
              <li key={e.at}>
                <span className={'pill ' + (e.passed ? 'ok' : 'bad')}>{e.passed ? '✓' : '✗'}</span>
                <span>
                  {e.correct} / {e.total}
                </span>
                <span className="muted">{new Date(e.at).toLocaleString('hy-AM', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <footer className="footer muted">{t.source}</footer>
    </div>
  )
}
