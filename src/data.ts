import { useEffect, useState } from 'react'
import type { Dataset, Group, Question } from './types'

let cache: Promise<Dataset> | null = null

export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path
}

function load(): Promise<Dataset> {
  if (!cache) {
    cache = fetch(assetUrl('data/questions.json'))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<{ groups: Group[]; questions: Question[] }>
      })
      .then(({ groups, questions }) => {
        const byId = new Map(questions.map((q) => [q.id, q]))
        const byGroup = new Map<number, Question[]>(groups.map((g) => [g.id, []]))
        for (const q of questions) byGroup.get(q.g)!.push(q)
        return { groups, questions, byId, byGroup }
      })
    cache.catch(() => {
      cache = null
    })
  }
  return cache
}

export type DataState =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'ready'; data: Dataset }

export function useData(): DataState {
  const [state, setState] = useState<DataState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    setState({ status: 'loading' })
    load().then(
      (data) => alive && setState({ status: 'ready', data }),
      () => alive && setState({ status: 'error', retry: () => setAttempt((n) => n + 1) }),
    )
    return () => {
      alive = false
    }
  }, [attempt])
  return state
}
