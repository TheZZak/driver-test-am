import { useEffect, useState } from 'react'
import { assetUrl } from '../data'
import { t } from '../i18n/hy'
import type { QuestionImage as Img } from '../types'

export function QuestionImage({ img, lazy = false }: { img: Img; lazy?: boolean }) {
  const [zoom, setZoom] = useState(false)
  const src = assetUrl(img.src)

  useEffect(() => {
    if (!zoom) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setZoom(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [zoom])

  return (
    <>
      <button type="button" className="q-image" onClick={() => setZoom(true)} title={t.zoomHint}>
        <img
          src={src}
          width={img.w}
          height={img.h}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          alt=""
          style={{ aspectRatio: `${img.w} / ${img.h}` }}
        />
      </button>
      {zoom && (
        <div className="zoom" role="dialog" aria-label={t.zoomHint} onClick={() => setZoom(false)}>
          <img src={src} alt="" />
          <button type="button" className="zoom-close" aria-label={t.close}>
            ✕
          </button>
        </div>
      )}
    </>
  )
}
