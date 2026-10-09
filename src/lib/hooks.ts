import { useEffect, useRef } from 'react'
import { assetUrl } from '../data'
import type { Dataset } from '../types'

/** Global keyboard shortcuts; ignored while typing in a form field. */
export function useKeys(handler: (e: KeyboardEvent) => void) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      // let a focused button/link handle its own activation keys
      if ((e.key === 'Enter' || e.key === ' ') && el && (el.tagName === 'BUTTON' || el.tagName === 'A')) return
      ref.current(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** Warm the browser cache with the next question's image. */
export function usePrefetchImage(data: Dataset, id: string | undefined) {
  const src = id ? data.byId.get(id)?.img?.src : undefined
  useEffect(() => {
    if (src) new Image().src = assetUrl(src)
  }, [src])
}
