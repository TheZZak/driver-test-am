import { assetUrl } from '../data'

// Must match the runtimeCaching cacheName in vite.config.ts
const CACHE = 'question-images'

export const offlineSupported = () => typeof caches !== 'undefined'

export async function countCachedImages(): Promise<number> {
  if (!offlineSupported()) return 0
  const cache = await caches.open(CACHE)
  return (await cache.keys()).length
}

/** Fetch every question image into the same cache the service worker reads from. */
export async function downloadImages(
  paths: string[],
  onProgress: (done: number, total: number) => void,
): Promise<{ failed: number }> {
  const cache = await caches.open(CACHE)
  const urls = paths.map((p) => new URL(assetUrl(p), location.href).href)
  let done = 0
  let failed = 0
  let next = 0
  const worker = async () => {
    while (next < urls.length) {
      const url = urls[next++]
      try {
        if (!(await cache.match(url))) {
          const res = await fetch(url)
          if (!res.ok) throw new Error(String(res.status))
          await cache.put(url, res)
        }
      } catch {
        failed++
      }
      onProgress(++done, urls.length)
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker))
  return { failed }
}
