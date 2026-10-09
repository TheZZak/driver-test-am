import type { ReactNode } from 'react'
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
  /** left side of the header, e.g. "Հարց 3 / 20"; defaults to the group reference */
  heading?: ReactNode
}

export function QuestionCard({ q, groupTitle, selected, reveal, onSelect, lazyImage, heading }: Props) {
  const locked = reveal || !onSelect
  const ref = `${groupTitle} · № ${q.n}`
  return (
    <article className="question">
      <div className="q-head">
        <span className="q-num">{heading ?? ref}</span>
        {heading != null && <span className="q-ref">{ref}</span>}
        <BookmarkStar id={q.id} />
      </div>
      {q.img && <QuestionImage img={q.img} lazy={lazyImage} />}
      <h2 className="q-text">{q.q}</h2>
      <ol className="options">
        {q.opts.map((text, i) => {
          const n = i + 1
          let state = ''
          if (reveal) {
            if (n === q.a) state = selected == null ? 'key' : 'correct'
            else if (n === selected) state = 'wrong'
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
              </button>
            </li>
          )
        })}
      </ol>
      {reveal && (
        <p className="answer-line">
          {selected != null && (
            <span className={selected === q.a ? 'ok' : 'bad'}>{selected === q.a ? t.correct : t.wrong} · </span>
          )}
          {t.answerLine(q.a)}
        </p>
      )}
    </article>
  )
}
