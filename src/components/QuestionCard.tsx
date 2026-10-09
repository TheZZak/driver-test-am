import { t } from '../i18n/hy'
import type { Question } from '../types'
import { BookmarkStar } from './BookmarkStar'
import { QuestionImage } from './QuestionImage'

interface Props {
  q: Question
  groupTitle: string
  /** option the user picked (1-based) */
  selected: number | null
  /** show correct/wrong colouring and the answer line */
  reveal: boolean
  onSelect?: (option: number) => void
  lazyImage?: boolean
  index?: number
}

export function QuestionCard({ q, groupTitle, selected, reveal, onSelect, lazyImage, index }: Props) {
  const locked = reveal || !onSelect
  return (
    <article className="card question">
      <header className="q-meta">
        <span className="badge">
          {groupTitle} · #{q.n}
        </span>
        {index != null && <span className="q-index">{t.question} {index}</span>}
        <BookmarkStar id={q.id} />
      </header>
      <h2 className="q-text">{q.q}</h2>
      {q.img && <QuestionImage img={q.img} lazy={lazyImage} />}
      <ol className="options">
        {q.opts.map((text, i) => {
          const n = i + 1
          let state = ''
          if (reveal) {
            if (n === q.a) state = 'correct'
            else if (n === selected) state = 'wrong'
            else state = 'dim'
          } else if (n === selected) state = 'selected'
          return (
            <li key={n}>
              <button
                type="button"
                className={'option ' + state}
                disabled={locked}
                aria-pressed={n === selected}
                onClick={() => onSelect?.(n)}
              >
                <span className="opt-num">{n}.</span>
                <span className="opt-text">{text}</span>
                {reveal && n === q.a && <span className="opt-mark" aria-label={t.correct}>✓</span>}
                {reveal && n === selected && n !== q.a && (
                  <span className="opt-mark" aria-label={t.wrong}>✗</span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
      {reveal && (
        <p className={'answer-line' + (selected != null && selected !== q.a ? ' after-wrong' : '')}>
          {selected != null && <strong>{selected === q.a ? t.correct : t.wrong} · </strong>}
          {t.answerLine(q.a)}
        </p>
      )}
    </article>
  )
}
