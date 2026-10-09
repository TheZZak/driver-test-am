import type { Dataset, Persist, Question, Session, SessionMode } from '../types'
import { sample, shuffle } from './shuffle'
import { setSession } from './storage'

export type Order = 'seq' | 'shuffle'

export interface PickOptions {
  groups: number[]
  count: number | 'all'
  order: Order
  onlyNew?: boolean
}

const byPosition = (a: Question, b: Question) => a.g - b.g || a.n - b.n

/** Split `n` across buckets in proportion to their sizes (largest-remainder rounding). */
export function proportionalCounts(sizes: number[], n: number): number[] {
  const total = sizes.reduce((s, x) => s + x, 0)
  if (total === 0) return sizes.map(() => 0)
  n = Math.min(n, total)
  const exact = sizes.map((s) => (s * n) / total)
  const counts = exact.map(Math.floor)
  let rest = n - counts.reduce((s, x) => s + x, 0)
  const byRemainder = exact
    .map((x, i) => ({ i, r: x - Math.floor(x) }))
    .sort((a, b) => b.r - a.r)
  for (const { i } of byRemainder) {
    if (rest <= 0) break
    if (counts[i] < sizes[i]) {
      counts[i]++
      rest--
    }
  }
  return counts
}

export function poolFor(data: Dataset, persist: Persist, groups: number[], onlyNew = false): Question[][] {
  return groups.map((g) =>
    (data.byGroup.get(g) ?? []).filter((q) => !onlyNew || !persist.stats[q.id]?.seen),
  )
}

/** Choose questions from the selected groups, spreading a partial count evenly across groups. */
export function pickQuestions(data: Dataset, persist: Persist, opts: PickOptions): string[] {
  const pools = poolFor(data, persist, opts.groups, opts.onlyNew)
  const total = pools.reduce((s, p) => s + p.length, 0)
  const n = opts.count === 'all' ? total : Math.min(opts.count, total)
  const counts = proportionalCounts(
    pools.map((p) => p.length),
    n,
  )
  const picked = pools.flatMap((p, i) => (counts[i] === p.length ? p : sample(p, counts[i])))
  const ordered = opts.order === 'shuffle' ? shuffle(picked) : picked.sort(byPosition)
  return ordered.map((q) => q.id)
}

function newSession(mode: SessionMode, label: string, ids: string[], exam = false): Session {
  return {
    id: Math.random().toString(36).slice(2),
    mode,
    exam,
    label,
    ids,
    answers: ids.map(() => null),
    idx: 0,
    startedAt: Date.now(),
  }
}

/** Create and store a practice session; returns false when there is nothing to ask. */
export function startPractice(mode: SessionMode, label: string, ids: string[]): boolean {
  if (!ids.length) return false
  setSession(newSession(mode, label, ids))
  return true
}

export function startExam(data: Dataset, persist: Persist, label: string): void {
  const { examCount, examMinutes, examMaxErrors } = persist.settings
  const ids = pickQuestions(data, persist, {
    groups: data.groups.map((g) => g.id),
    count: examCount,
    order: 'shuffle',
  })
  const s = newSession('exam', label, ids, true)
  s.deadline = s.startedAt + examMinutes * 60_000
  s.maxErrors = examMaxErrors
  setSession(s)
}

export function sessionScore(s: Session, data: Dataset) {
  let correct = 0
  let wrong = 0
  s.ids.forEach((id, i) => {
    const a = s.answers[i]
    if (a == null) return
    if (a === data.byId.get(id)?.a) correct++
    else wrong++
  })
  const skipped = s.ids.length - correct - wrong
  return { correct, wrong, skipped, total: s.ids.length }
}

/** Exam pass rule: unanswered questions count as errors. */
export function examPassed(s: Session, data: Dataset): boolean {
  const { correct, total } = sessionScore(s, data)
  return total - correct <= (s.maxErrors ?? 0)
}

export function formatDuration(ms: number): string {
  const sec = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
