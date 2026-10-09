// Small inline icons (stroke follows currentColor)
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const IconClock = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export const IconStar = ({ filled = false }: { filled?: boolean }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
  </svg>
)

export const IconBack = () => (
  <svg {...base}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

export const IconWheel = () => (
  <svg {...base} width={22} height={22} strokeWidth={2.2}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="2" />
    <path d="M3.8 11.2l6.2.8M20.2 11.2l-6.2.8M12 14v6.5" />
  </svg>
)
