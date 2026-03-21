// components/Icons.jsx
// ─────────────────────────────────────────────────────────────
// Inline SVG icon library.
// Usage: <Ic n="home" size={20} c="var(--accent)" />
// ─────────────────────────────────────────────────────────────

const ICONS = {
  home: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  search: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  map: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  heart: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  heartFill: (s, c) => (
    <svg width={s} height={s} fill={c} stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  msg: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  user: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  pin: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  check: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  sliders: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
      <line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  ),
  grid: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  list: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  send: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  logout: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  star: (s, c) => (
    <svg width={s} height={s} fill={c} viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  chevron: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  female: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="5"/>
      <line x1="12" y1="13" x2="12" y2="21"/>
      <line x1="9" y1="18" x2="15" y2="18"/>
    </svg>
  ),
  male: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="10" cy="14" r="5"/>
      <line x1="19" y1="5" x2="14.14" y2="9.86"/>
      <polyline points="15 5 19 5 19 9"/>
    </svg>
  ),
  settings: (s, c) => (
    <svg width={s} height={s} fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
};

/**
 * Ic – Inline SVG icon component
 * @param {{ n: string, size?: number, c?: string }} props
 */
export function Ic({ n, size = 18, c = "currentColor" }) {
  const render = ICONS[n];
  return render ? render(size, c) : null;
}

export default Ic;
