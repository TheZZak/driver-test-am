export interface Group {
  id: number
  title: string
  subtitle: string
  count: number
}

export interface QuestionImage {
  src: string
  w: number
  h: number
}

export interface Question {
  id: string // "<group>-<number>"
  g: number
  n: number
  q: string
  opts: string[]
  a: number // 1-based correct option, as in "Պատ.՝ N"
  img: QuestionImage | null
}

export interface Dataset {
  groups: Group[]
  questions: Question[]
  byId: Map<string, Question>
  byGroup: Map<number, Question[]>
}

export interface QStat {
  seen: number
  correct: number
  wrong: number
  streak: number // consecutive correct answers
  mistake: boolean // in the "my mistakes" pool
  last: number // timestamp of last answer
}

export type Theme = 'auto' | 'light' | 'dark'

export interface Settings {
  examCount: number
  examMinutes: number
  examMaxErrors: number
  theme: Theme
}

export interface ExamRecord {
  at: number
  total: number
  correct: number
  passed: boolean
  seconds: number
}

export interface Persist {
  v: 1
  stats: Record<string, QStat>
  bookmarks: string[]
  settings: Settings
  exams: ExamRecord[]
}

export type SessionMode = 'group' | 'random' | 'mix' | 'mistakes' | 'bookmarks' | 'retry' | 'exam'

export interface Session {
  id: string
  mode: SessionMode
  exam: boolean
  label: string
  ids: string[]
  answers: (number | null)[]
  idx: number
  startedAt: number
  deadline?: number // exam only
  maxErrors?: number // exam only
  finishedAt?: number
}
