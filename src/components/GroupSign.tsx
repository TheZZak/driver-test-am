// A small road sign drawn for each question group, matching its topic.
const BLUE = '#1f5aa6'
const RED = '#d22630'
const INK = '#1a1a1a'

const warning = (inner: JSX.Element) => (
  <>
    <path d="M24 5 44.5 41.5h-41z" fill="#fff" stroke={RED} strokeWidth="4.5" strokeLinejoin="round" />
    {inner}
  </>
)
const prohibition = (inner: JSX.Element) => (
  <>
    <circle cx="24" cy="24" r="19.5" fill="#fff" stroke={RED} strokeWidth="5" />
    {inner}
  </>
)
const service = (inner: JSX.Element) => (
  <>
    <rect x="7" y="2" width="34" height="44" rx="3" fill={BLUE} />
    <rect x="11" y="6" width="26" height="26" fill="#fff" />
    {inner}
  </>
)

const SIGNS: Record<number, JSX.Element> = {
  // maneuvers: blue "turn left" mandatory sign
  1: (
    <>
      <circle cx="24" cy="24" r="21.5" fill={BLUE} stroke="#fff" strokeWidth="1.5" />
      <path d="M29 37V24a5 5 0 0 0-5-5h-6" fill="none" stroke="#fff" strokeWidth="4.5" />
      <path d="M19 12.5 11.5 19l7.5 6.5z" fill="#fff" />
    </>
  ),
  // law and definitions: information sign
  2: (
    <>
      <rect x="3" y="3" width="42" height="42" rx="4" fill={BLUE} />
      <circle cx="24" cy="13.5" r="3.5" fill="#fff" />
      <path d="M19.5 20h7v16h3v3.5h-10V36h3V23.5h-3z" fill="#fff" />
    </>
  ),
  // vehicle faults: maintenance sign with a wrench
  3: service(
    <>
      <path d="M15.5 28.5 26 18" stroke={INK} strokeWidth="4.4" strokeLinecap="round" />
      <circle cx="28.4" cy="15.6" r="5.6" fill={INK} />
      <path d="M29.2 9.4l4.9 4.9-2.9 2.9-4.9-4.9z" fill="#fff" />
    </>,
  ),
  // signs and markings: give way
  4: <path d="M4.5 7.5h39L24 42z" fill="#fff" stroke={RED} strokeWidth="4.5" strokeLinejoin="round" />,
  // intersections: crossroads warning
  5: warning(<path d="M24 18.5v18M16 28.5h16" stroke={INK} strokeWidth="3.6" />),
  // traffic lights
  6: warning(
    <>
      <rect x="19.8" y="16" width="8.4" height="21.5" rx="2.2" fill={INK} />
      <circle cx="24" cy="20.4" r="2.3" fill="#e5332a" />
      <circle cx="24" cy="26.7" r="2.3" fill="#f7c600" />
      <circle cx="24" cy="33" r="2.3" fill="#2fa84f" />
    </>,
  ),
  // stopping and parking
  7: (
    <>
      <rect x="3" y="3" width="42" height="42" rx="4" fill={BLUE} />
      <path d="M17 37V11h9.5a8 8 0 0 1 0 16H22.5v10z M22.5 15.5v7h3.8a3.5 3.5 0 0 0 0-7z" fill="#fff" fillRule="evenodd" />
    </>
  ),
  // speed limit
  8: prohibition(
    <text x="24" y="30.5" textAnchor="middle" fontSize="17" fontWeight="800" fontFamily="Arial, sans-serif" fill={INK}>
      90
    </text>,
  ),
  // overtaking and special signals: no overtaking
  9: prohibition(
    <>
      <rect x="11.5" y="23" width="11" height="7.5" rx="1.5" fill={RED} />
      <rect x="13.5" y="18.5" width="7" height="5.5" rx="1.5" fill={RED} />
      <rect x="25.5" y="23" width="11" height="7.5" rx="1.5" fill={INK} />
      <rect x="27.5" y="18.5" width="7" height="5.5" rx="1.5" fill={INK} />
    </>,
  ),
  // first aid
  10: service(<path d="M21 11h6v6h6v6h-6v6h-6v-6h-6v-6h6z" fill={RED} />),
}

export function GroupSign({ group, size = 40 }: { group: number; size?: number }) {
  return (
    <svg className="group-sign" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      {SIGNS[group]}
    </svg>
  )
}
