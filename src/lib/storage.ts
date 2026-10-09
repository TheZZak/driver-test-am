import { useSyncExternalStore } from 'react'
import type { ExamRecord, Persist, QStat, Session, Settings } from '../types'

const KEY = 'dt:v1'
const SESSION_KEY = 'dt:session:v1'

export const DEFAULT_SETTINGS: Settings = {
  examCount: 20,
  examMinutes: 30,
  examMaxErrors: 2,
  theme: 'auto',
}

const EMPTY: Persist = { v: 1, stats: {}, bookmarks: [], settings: DEFAULT_SETTINGS, exams: [] }

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}

function createStore<T>(key: string, initial: T) {
  let state = initial
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(next: T) {
      state = next
      write(key, next)
      listeners.forEach((l) => l())
    },
    subscribe(l: () => void) {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

function loadPersist(): Persist {
  const saved = read<Persist>(KEY)
  if (!saved || saved.v !== 1) return EMPTY
  return {
    ...EMPTY,
    ...saved,
    settings: { ...DEFAULT_SETTINGS, ...saved.settings },
  }
}

const persist = createStore<Persist>(KEY, loadPersist())
const session = createStore<Session | null>(SESSION_KEY, read<Session>(SESSION_KEY))

export function usePersist(): Persist {
  return useSyncExternalStore(persist.subscribe, persist.get)
}

export function useSession(): Session | null {
  return useSyncExternalStore(session.subscribe, session.get)
}

export const getPersist = persist.get
export const getSession = session.get
export const setSession = (s: Session | null) => session.set(s)

const NEW_STAT: QStat = { seen: 0, correct: 0, wrong: 0, streak: 0, mistake: false, last: 0 }

/** Record one answer. A wrong answer adds the question to the mistakes pool;
 *  two correct answers in a row take it out again. */
export function recordAnswer(id: string, isCorrect: boolean) {
  const s = persist.get()
  const prev = s.stats[id] ?? NEW_STAT
  const streak = isCorrect ? prev.streak + 1 : 0
  const stat: QStat = {
    seen: prev.seen + 1,
    correct: prev.correct + (isCorrect ? 1 : 0),
    wrong: prev.wrong + (isCorrect ? 0 : 1),
    streak,
    mistake: isCorrect ? prev.mistake && streak < 2 : true,
    last: Date.now(),
  }
  persist.set({ ...s, stats: { ...s.stats, [id]: stat } })
}

export function toggleBookmark(id: string) {
  const s = persist.get()
  const has = s.bookmarks.includes(id)
  persist.set({ ...s, bookmarks: has ? s.bookmarks.filter((b) => b !== id) : [...s.bookmarks, id] })
}

export function updateSettings(patch: Partial<Settings>) {
  const s = persist.get()
  persist.set({ ...s, settings: { ...s.settings, ...patch } })
}

export function addExam(rec: ExamRecord) {
  const s = persist.get()
  persist.set({ ...s, exams: [rec, ...s.exams].slice(0, 50) })
}

export function resetProgress() {
  const s = persist.get()
  persist.set({ ...EMPTY, settings: s.settings })
  session.set(null)
}

/** A question counts as mastered when its latest answer was correct and it is not in the mistakes pool. */
export function isMastered(stat: QStat | undefined): boolean {
  return !!stat && stat.streak > 0 && !stat.mistake
}
