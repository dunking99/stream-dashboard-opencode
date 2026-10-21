import { useId } from 'react';
import { onColor, kindOf } from '../matchData.js';

// Little shared parts: crest placeholder, icons, tally light, switch, sparkline, key cap.

export function Shield({ color = '#888', label = '', size = 22 }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 20 22" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M2 2h16v10c0 4.5-3.5 7-8 9-4.5-2-8-4.5-8-9Z" fill={color} stroke="rgba(0,0,0,.45)" />
      <text x="10" y="13.4" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={onColor(color)} fontFamily="IBM Plex Sans, sans-serif">{label.slice(0, 2)}</text>
    </svg>
  );
}

const ICONS = {
  play: ['M8 5v14l11-7Z', true], pause: ['M7 5h3.6v14H7zM13.4 5H17v14h-3.6z', true],
  vol: ['M4 9.5v5h3.6L13 19V5L7.6 9.5zM16.2 9a4.2 4.2 0 0 1 0 6', false], pip: ['M3 5.5h18v13H3zM12 12h7v5.5h-7z', false],
  theatre: ['M3 6h18v12H3zM3 15h18', false], full: ['M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5', false],
  star: ['M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.6 6.9 19.3l1-5.7-4.1-4 5.7-.8Z', false],
  search: ['M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.8-4.8', false],
  plus: ['M12 5v14M5 12h14', false], help: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01', false],
  chev: ['M7 10l5 5 5-5', false], x: ['M6 6l12 12M18 6L6 18', false], bolt: ['M13 3 5 14h6l-1 7 8-11h-6Z', false],
  undo: ['M9 7 4 12l5 5M4 12h10a6 6 0 0 1 0 12', false], flag: ['M6 21V4M6 5h11l-2 4 2 4H6', false], eye: ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', false],
  eyeoff: ['M3 3l18 18M10.6 6.2A9 9 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3 3.6M6.5 7.7A17 17 0 0 0 2 12s4 7 10 7a9 9 0 0 0 4.2-1', false],
  sliders: ['M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M8 15v4', false], bell: ['M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0', false], link: ['M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3A4 4 0 0 0 11 18.6l1-1', false],
};
export function Icon({ name, size = 16, className = '' }) {
  const [d, filled] = ICONS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

// a tally light: red = on air, green = preview, amber = trouble, grey = no signal
export function Tally({ kind = 'off', pulse = false, size = 9 }) {
  const c = { pgm: 'var(--red)', pvw: 'var(--green)', warn: 'var(--amber)', off: 'var(--dead)' }[kind];
  return <span aria-hidden="true" className={pulse ? 'tally-on' : undefined} style={{ width: size, height: size, borderRadius: '50%', background: c, boxShadow: kind === 'off' ? 'none' : `0 0 0 2px rgba(0,0,0,.35), 0 0 8px ${c}`, display: 'inline-block', flexShrink: 0 }} />;
}

export function Switch({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} style={{ width: 34, height: 18, borderRadius: 9, border: '1px solid var(--line2)', background: on ? 'var(--green)' : '#3a3833', position: 'relative', padding: 0, flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 1, left: on ? 17 : 1, width: 14, height: 14, borderRadius: '50%', background: on ? '#0d2a1b' : '#bdb8ac', transition: 'left .15s' }} />
    </button>
  );
}

export function Spark({ values, width = 120, height = 26, color = 'var(--dim)', fill = false }) {
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 2 - ((v - min) / (max - min || 1)) * (height - 4)}`);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: 'block' }}>
      {fill && <polygon points={`0,${height} ${pts.join(' ')} ${width},${height}`} fill={color} opacity="0.15" />}
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export const Kbd = ({ children }) => <span className="kbd">{children}</span>;

// incident symbol by kind (goal, card, miss, sub)
export function EventGlyph({ e, size = 14 }) {
  const kind = typeof e === 'string' ? e : kindOf(e);
  const s = { width: size, height: size, flexShrink: 0 };
  switch (kind) {
    case 'goal': return <svg viewBox="0 0 16 16" style={s} aria-label="Goal"><circle cx="8" cy="8" r="7" fill="#f4f1e8" /><path d="m8 4.4 2.5 1.8-1 2.9H6.5l-1-2.9L8 4.4Z" fill="#151412" /></svg>;
    case 'yellow': return <svg viewBox="0 0 16 16" style={s} aria-label="Yellow card"><rect x="4" y="2" width="8" height="12" rx="1.2" fill="#f2c200" /></svg>;
    case 'red': return <svg viewBox="0 0 16 16" style={s} aria-label="Red card"><rect x="4" y="2" width="8" height="12" rx="1.2" fill="#e03a2c" /></svg>;
    case 'miss': return <svg viewBox="0 0 16 16" style={s} aria-label="Missed penalty"><path d="m4 4 8 8m0-8-8 8" stroke="#ff6a5e" strokeWidth="2" strokeLinecap="round" /></svg>;
    default: return <svg viewBox="0 0 16 16" style={s} aria-label="Substitution" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13V3m0 0L2.8 5.2M5 3l2.2 2.2" stroke="#35d07f" /><path d="M11 3v10m0 0 2.2-2.2M11 13l-2.2-2.2" stroke="#ff6a5e" /></svg>;
  }
}

// a pitch-like picture that stands in for video: broadcast-ish, with a few runners
export function FakeVideo({ tint = 0, dead = false, dim = false }) {
  const uid = useId().replace(/[^a-z0-9]/gi, '');
  const hue = ['#2f8a3a', '#2c8f4a', '#3a8a30', '#2a7f45'][tint % 4];
  const runners = [[-60, 12, 6.2, 380, 520, '#ffd400'], [40, -10, 7.1, 560, 470, '#ffd400'], [-30, 20, 5.4, 760, 560, '#00c2a8'], [50, -16, 6.6, 900, 500, '#00c2a8'], [-20, -8, 7.8, 1040, 590, '#ffd400'], [30, 14, 5.9, 1180, 470, '#00c2a8']];
  return (
    <svg viewBox="0 0 1600 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: 'block', filter: dim ? 'saturate(.35) brightness(.55)' : undefined }}>
      <defs>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b0b0a" /><stop offset="1" stopColor="#262420" /></linearGradient>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={hue} stopOpacity=".72" /><stop offset="1" stopColor={hue} /></linearGradient>
        <filter id={`n${uid}`}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5" /><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.3 -.55" /></filter>
      </defs>
      <rect width="1600" height="900" fill={`url(#sky${uid})`} />
      <g fill="#3a3833" opacity=".8">{Array.from({ length: 60 }, (_, i) => <circle key={i} cx={20 + i * 27} cy={90 + ((i * 37) % 70)} r={5 + (i % 3)} />)}</g>
      <rect y="220" width="1600" height="680" fill={`url(#g${uid})`} />
      {Array.from({ length: 8 }, (_, i) => <polygon key={i} points={`${-200 + i * 260},900 ${-200 + i * 260 + 130},900 ${300 + i * 130 + 65},220 ${300 + i * 130},220`} fill="#000" opacity={i % 2 ? 0.07 : 0} />)}
      <g fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="5"><path d="M520 300H1080M400 860H1200M520 300 400 860M1080 300 1200 860M800 300V860" /><ellipse cx="800" cy="580" rx="150" ry="60" /></g>
      {runners.map(([dx, dy, t, x, y, c], i) => (
        <g key={i} className="runner" style={{ '--dx': `${dx}px`, '--dy': `${dy}px`, '--t': `${t}s` }}>
          <ellipse cx={x} cy={y + 34} rx="16" ry="5" fill="#000" opacity=".3" /><rect x={x - 9} y={y - 18} width="18" height="38" rx="7" fill={c} /><circle cx={x} cy={y - 28} r="8" fill="#e8c9a4" />
        </g>
      ))}
      <g className="runner" style={{ '--dx': '90px', '--dy': '-20px', '--t': '3.4s' }}><circle cx="860" cy="610" r="9" fill="#fff" /></g>
      {dead && <rect className="static" width="1700" height="960" x="-50" y="-30" filter={`url(#n${uid})`} opacity=".9" />}
    </svg>
  );
}
