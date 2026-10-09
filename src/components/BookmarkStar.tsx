import { t } from '../i18n/hy'
import { toggleBookmark, usePersist } from '../lib/storage'
import { IconStar } from './Icons'

export function BookmarkStar({ id }: { id: string }) {
  const on = usePersist().bookmarks.includes(id)
  const label = on ? t.bookmarkRemove : t.bookmarkAdd
  return (
    <button
      type="button"
      className={'star' + (on ? ' on' : '')}
      onClick={() => toggleBookmark(id)}
      aria-pressed={on}
      aria-label={label}
      title={label}
    >
      <IconStar filled={on} />
    </button>
  )
}
