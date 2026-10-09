import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDataset } from '../App'
import { GroupSign } from '../components/GroupSign'
import {
  IconAlert,
  IconBook,
  IconClock,
  IconList,
  IconMistake,
  IconShuffle,
  IconSliders,
  IconStar,
} from '../components/Icons'
import { PageHead, SiteHeader } from '../components/Layout'
import { t } from '../i18n/hy'
import { formatDuration, mistakeIds, pickQuestions, startExam, startPractice } from '../lib/sessions'
import { shuffle } from '../lib/shuffle'
import { isMastered, usePersist, useSession } from '../lib/storage'

const RANDOM_COUNTS = [20, 50, 100] as const

export function Home() {
  const data = useDataset()
  const persist = usePersist()
  const session = useSession()
  const navigate = useNavigate()
  const { stats, settings, exams } = persist

  const summary = useMemo(() => {
    const perGroup = new Map<number, { seen: number; mastered: number; mistakes: number }>()
    let seen = 0
    let mastered = 0
    let correct = 0
    let wrong = 0
    for (const q of data.questions) {
      const s = stats[q.id]
      const g = perGroup.get(q.g) ?? { seen: 0, mastered: 0, mistakes: 0 }
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
      if (s?.mistake) g.mistakes++
      perGroup.set(q.g, g)
    }
    const accuracy = correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : null
    return { perGroup, seen, mastered, accuracy }
  }, [data, stats])

  const mistakes = mistakeIds(data, persist)
  const bookmarks = persist.bookmarks.filter((id) => data.byId.has(id))
  const active = session && !session.finishedAt ? session : null
  const activeDone = active ? active.answers.filter((a) => a != null).length : 0
  const passedExams = exams.filter((e) => e.passed).length

  const practice = (ok: boolean) => ok && navigate('/quiz')
  const startGroup = (g: number, title: string, shuffled: boolean) => {
    const ids = (data.byGroup.get(g) ?? []).map((q) => q.id)
    practice(startPractice('group', title, shuffled ? shuffle(ids) : ids))
  }
  const startRandom = (count: number | 'all') =>
    practice(
      startPractice(
        'random',
        t.modeRandom,
        pickQuestions(data, persist, { groups: data.groups.map((g) => g.id), count, order: 'shuffle' }),
      ),
    )

  return (
    <>
      <SiteHeader />
      <main className="page">
        {active && (
          <div className="notice">
            <span>
              <strong>{t.unfinished}</strong> — {active.label}, {t.of(activeDone, active.ids.length)}
            </span>
            <button className="btn primary small" onClick={() => navigate(active.exam ? '/exam' : '/quiz')}>
              {t.continueSession}
            </button>
          </div>
        )}

        <section className="exam-box">
          <div className="exam-box-text">
            <h1>{t.modeExam}</h1>
            <ul className="exam-facts">
              <li>
                <IconList /> {t.examFactQuestions(settings.examCount)}
              </li>
              <li>
                <IconClock /> {t.examFactMinutes(settings.examMinutes)}
              </li>
              <li>
                <IconAlert /> {t.examFactErrors(settings.examMaxErrors)}
              </li>
            </ul>
            <p className="muted small">{t.examIntro}</p>
          </div>
          <button
            className="btn primary big"
            onClick={() => {
              startExam(data, persist, t.modeExam)
              navigate('/exam')
            }}
          >
            {t.startExam}
          </button>
        </section>

        <PageHead title={t.questionBank} note={t.questionBankNote} back={null} />
        <div className="table-wrap">
          <table className="groups-table">
            <thead>
              <tr>
                <th>{t.colGroup}</th>
                <th className="num">{t.colAnswered}</th>
                <th className="num hide-md">{t.mastered}</th>
                <th className="num hide-sm">{t.colMistakes}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.groups.map((g) => {
                const gs = summary.perGroup.get(g.id) ?? { seen: 0, mastered: 0, mistakes: 0 }
                return (
                  <tr key={g.id}>
                    <th scope="row">
                      <Link to={`/setup/group?g=${g.id}`} className="group-cell">
                        <GroupSign group={g.id} />
                        <span>
                          <span className="group-name">{g.title}</span>
                          <span className="group-topic">{t.groupTopics[g.id]}</span>
                        </span>
                      </Link>
                    </th>
                    <td className="num answered-cell" data-label={t.colAnswered}>
                      <span className="meter-cell">
                        <span className="meter" aria-hidden="true">
                          <span style={{ width: `${(gs.seen / g.count) * 100}%` }} />
                        </span>
                        <span>
                          {gs.seen}
                          <span className="of-total"> / {g.count}</span>
                        </span>
                      </span>
                    </td>
                    <td className="num hide-md">{gs.mastered}</td>
                    <td className={'num hide-sm' + (gs.mistakes ? ' bad' : '')}>{gs.mistakes}</td>
                    <td className="actions-cell">
                      <button className="link" onClick={() => startGroup(g.id, g.title, false)}>
                        {t.actSolve}
                      </button>
                      <button className="link" onClick={() => startGroup(g.id, g.title, true)}>
                        {t.actShuffle}
                      </button>
                      <Link className="link" to={`/browse?g=${g.id}`}>
                        {t.actBrowse}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <h2 className="section-title">{t.otherModes}</h2>
        <ul className="mode-list">
          <li>
            <span className="mode-icon">
              <IconShuffle />
            </span>
            <div className="mode-text">
              <div className="mode-title">{t.randomFrom}</div>
              <div className="muted small">{t.questionsCount(data.questions.length)}</div>
            </div>
            <div className="mode-actions">
              {RANDOM_COUNTS.map((n) => (
                <button key={n} className="btn small" onClick={() => startRandom(n)}>
                  {n}
                </button>
              ))}
              <button className="btn small" onClick={() => startRandom('all')}>
                {t.all}
              </button>
            </div>
          </li>
          <li>
            <span className="mode-icon">
              <IconSliders />
            </span>
            <div className="mode-text">
              <div className="mode-title">{t.modeMix}</div>
              <div className="muted small">{t.modeMixDesc}</div>
            </div>
            <div className="mode-actions">
              <Link className="btn small" to="/setup/mix">
                {t.actOptions}
              </Link>
            </div>
          </li>
          <li>
            <span className="mode-icon">
              <IconMistake />
            </span>
            <div className="mode-text">
              <div className="mode-title">{t.modeMistakes}</div>
              <div className="muted small">{t.modeMistakesDesc(mistakes.length)}</div>
            </div>
            <div className="mode-actions">
              <button
                className="btn small"
                disabled={!mistakes.length}
                onClick={() => practice(startPractice('mistakes', t.modeMistakes, shuffle(mistakes)))}
              >
                {t.start}
              </button>
            </div>
          </li>
          <li>
            <span className="mode-icon">
              <IconStar />
            </span>
            <div className="mode-text">
              <div className="mode-title">{t.modeBookmarks}</div>
              <div className="muted small">{t.modeBookmarksDesc(bookmarks.length)}</div>
            </div>
            <div className="mode-actions">
              <button
                className="btn small"
                disabled={!bookmarks.length}
                onClick={() => practice(startPractice('bookmarks', t.modeBookmarks, shuffle(bookmarks)))}
              >
                {t.start}
              </button>
            </div>
          </li>
          <li>
            <span className="mode-icon">
              <IconBook />
            </span>
            <div className="mode-text">
              <div className="mode-title">{t.modeBrowse}</div>
              <div className="muted small">{t.modeBrowseDesc}</div>
            </div>
            <div className="mode-actions">
              <Link className="btn small" to="/browse">
                {t.actBrowse}
              </Link>
            </div>
          </li>
        </ul>

        <h2 className="section-title">{t.stats}</h2>
        <dl className="stats">
          <div>
            <dt>{t.answered}</dt>
            <dd>
              {summary.seen} / {data.questions.length}
            </dd>
          </div>
          <div>
            <dt>{t.mastered}</dt>
            <dd>{summary.mastered}</dd>
          </div>
          <div>
            <dt>{t.accuracy}</dt>
            <dd>{summary.accuracy == null ? '—' : `${summary.accuracy}%`}</dd>
          </div>
          <div>
            <dt>{t.examsPassed}</dt>
            <dd>
              {passedExams} / {exams.length}
            </dd>
          </div>
        </dl>

        {exams.length > 0 && (
          <>
            <h2 className="section-title">{t.recentExams}</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.date}</th>
                    <th className="num">{t.correctCount}</th>
                    <th className="num">{t.time}</th>
                    <th>{t.result}</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.slice(0, 5).map((e) => (
                    <tr key={e.at}>
                      <td>{new Date(e.at).toLocaleString('hy-AM', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className="num">
                        {e.correct} / {e.total}
                      </td>
                      <td className="num">{formatDuration(e.seconds * 1000)}</td>
                      <td className={e.passed ? 'ok' : 'bad'}>{e.passed ? t.passShort : t.failShort}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <footer className="footer muted">{t.source}</footer>
      </main>
    </>
  )
}
