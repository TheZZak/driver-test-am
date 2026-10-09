import { useEffect, useMemo, useState } from 'react'
import { useDataset } from '../App'
import { TopBar } from '../components/TopBar'
import { t } from '../i18n/hy'
import { countCachedImages, downloadImages, offlineSupported } from '../lib/offline'
import { DEFAULT_SETTINGS, resetProgress, updateSettings, usePersist } from '../lib/storage'
import type { Settings as S, Theme } from '../types'

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (n: number) => void
}) {
  const [text, setText] = useState(String(value))
  useEffect(() => {
    setText(String(value))
  }, [value])
  const commit = () => {
    const n = Math.round(Number(text))
    if (Number.isFinite(n) && text.trim() !== '') onChange(Math.min(max, Math.max(min, n)))
    else setText(String(value))
  }
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
    </label>
  )
}

export function Settings() {
  const data = useDataset()
  const { settings } = usePersist()
  const images = useMemo(() => data.questions.flatMap((q) => (q.img ? [q.img.src] : [])), [data])
  const [cached, setCached] = useState<number | null>(null)
  const [progress, setProgress] = useState<[number, number] | null>(null)
  const [error, setError] = useState(false)
  const [resetMsg, setResetMsg] = useState(false)

  useEffect(() => {
    if (offlineSupported()) countCachedImages().then(setCached, () => setCached(0))
  }, [])

  const set = (patch: Partial<S>) => {
    const next = { ...settings, ...patch }
    next.examMaxErrors = Math.min(next.examMaxErrors, next.examCount)
    updateSettings(next)
  }

  const download = async () => {
    setError(false)
    setProgress([0, images.length])
    try {
      const { failed } = await downloadImages(images, (d, n) => setProgress([d, n]))
      setError(failed > 0)
    } catch {
      setError(true)
    }
    setProgress(null)
    setCached(await countCachedImages().catch(() => 0))
  }

  const themes: [Theme, string][] = [
    ['auto', t.themeAuto],
    ['light', t.themeLight],
    ['dark', t.themeDark],
  ]

  return (
    <div className="page">
      <TopBar title={t.settings} />

      <section className="card form-section">
        <h3>{t.examRules}</h3>
        <div className="fields">
          <NumberField label={t.examCount} value={settings.examCount} min={5} max={100} onChange={(n) => set({ examCount: n })} />
          <NumberField label={t.examMinutes} value={settings.examMinutes} min={1} max={180} onChange={(n) => set({ examMinutes: n })} />
          <NumberField
            label={t.examMaxErrors}
            value={settings.examMaxErrors}
            min={0}
            max={settings.examCount}
            onChange={(n) => set({ examMaxErrors: n })}
          />
        </div>
        <button
          className="link-btn"
          onClick={() =>
            set({
              examCount: DEFAULT_SETTINGS.examCount,
              examMinutes: DEFAULT_SETTINGS.examMinutes,
              examMaxErrors: DEFAULT_SETTINGS.examMaxErrors,
            })
          }
        >
          {t.resetDefaults}
        </button>
      </section>

      <section className="card form-section">
        <h3>{t.theme}</h3>
        <div className="chips">
          {themes.map(([value, label]) => (
            <button key={value} className={'chip' + (settings.theme === value ? ' on' : '')} onClick={() => set({ theme: value })}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="card form-section">
        <h3>{t.offline}</h3>
        {offlineSupported() ? (
          <>
            <p className="muted">{t.offlineDesc}</p>
            {cached != null && <p>{t.offlineDone(Math.min(cached, images.length))} / {images.length}</p>}
            {progress ? (
              <p>{t.offlineProgress(progress[0], progress[1])}</p>
            ) : (
              <button className="btn primary" onClick={download}>
                {t.offlineDownload}
              </button>
            )}
            {error && <p className="bad">{t.offlineError}</p>}
            <p className="muted small">{t.installHint}</p>
          </>
        ) : (
          <p className="muted">{t.offlineUnsupported}</p>
        )}
      </section>

      <section className="card form-section">
        <h3>{t.progress}</h3>
        <button
          className="btn danger"
          onClick={() => {
            if (window.confirm(t.resetConfirm)) {
              resetProgress()
              setResetMsg(true)
            }
          }}
        >
          {t.resetProgress}
        </button>
        {resetMsg && <p className="ok">{t.resetDone}</p>}
      </section>

      <footer className="footer muted">{t.source}</footer>
    </div>
  )
}
