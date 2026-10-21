import { useId } from 'react';
import { spots, surname } from '../matchData.js';

// 4. Stained glass: the pitch as a cathedral window. Every player owns the ground nearest to them
// (a Voronoi diagram, computed from their position), and each piece of ground is a pane of coloured
// glass held in black lead. Warm glass for one side, cool for the other, lighter towards attack.

const W = 1050;
const H = 680;
const serif = "'Fraunces', 'Iowan Old Style', Georgia, serif";
const WARM = ['#8f1d2c', '#c4531f', '#e08a1e', '#f0b92c', '#f7dc7a'];
const COOL = ['#2b2a78', '#1c5f9a', '#1d8a9a', '#2fb59a', '#8fd9b8'];

// keep the part of a polygon where a*x + b*y <= c
function clip(poly, a, b, c) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const dp = a * P[0] + b * P[1] - c, dq = a * Q[0] + b * Q[1] - c;
    if (dp <= 0) out.push(P);
    if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) { const t = dp / (dp - dq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
// the ground nearer to each point than to any other, inside the pitch rectangle
function territories(points) {
  return points.map((pi, i) => points.reduce((poly, pj, j) => (j === i ? poly : clip(poly, pj[0] - pi[0], pj[1] - pi[1], (pj[0] ** 2 + pj[1] ** 2 - pi[0] ** 2 - pi[1] ** 2) / 2)), [[0, 0], [W, 0], [W, H], [0, H]]));
}
const area = (poly) => Math.abs(poly.reduce((s, P, i) => { const Q = poly[(i + 1) % poly.length]; return s + P[0] * Q[1] - Q[0] * P[1]; }, 0)) / 2;

const hexToRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (hex, to, t) => `rgb(${hexToRgb(hex).map((v, i) => Math.round(v + (to[i] - v) * t)).join(',')})`;

export function StainedGlass({ d }) {
  const uid = useId().replace(/[^a-z0-9]/gi, '');
  const items = spots(d, 'landscape', 0.95).map((i) => ({ ...i, x: (i.left / 100) * W, y: (i.top / 100) * H }));
  if (!items.length) return <p className="rounded border border-dashed border-gray-600 p-8 text-center text-sm text-gray-400">The window is leaded once lineups are announced.</p>;

  const cells = territories(items.map((i) => [i.x, i.y]));
  const rowsOfSide = (side) => Math.max(...items.filter((i) => i.side === side).map((i) => i.row)) + 1;
  const total = cells.reduce((s, c) => s + area(c), 0);
  const share = (side) => items.reduce((s, it, i) => s + (it.side === side ? area(cells[i]) : 0), 0) / total;
  const colour = (it) => {
    const n = rowsOfSide(it.side);
    return (it.side === 'home' ? WARM : COOL)[Math.round((it.row / (n - 1)) * 4)];
  };
  const hs = share('home');

  return (
    <div className="mx-auto w-full max-w-[980px]">
      <div className="mb-3 flex items-center gap-3 text-[15px] text-gray-200" style={{ fontFamily: serif }}>
        <span className="italic">{d.home.name}</span>
        <div className="flex h-3 flex-1 overflow-hidden rounded-sm bg-black">
          <span style={{ width: `${hs * 100}%`, background: WARM[2] }} /><span className="flex-1" style={{ background: COOL[2] }} />
        </div>
        <span className="italic">{d.away.name}</span>
        <span className="tabular-nums text-gray-400">{Math.round(hs * 100)}% / {Math.round((1 - hs) * 100)}% of the ground</span>
      </div>

      <div className="p-3" style={{ background: 'linear-gradient(#6c665c,#4a463f)', boxShadow: '0 14px 30px -12px rgba(0,0,0,.8)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Each player's territory as stained glass">
          <defs>
            {items.map((it, i) => (
              <radialGradient key={i} id={`pane${uid}${i}`} cx="50%" cy="38%" r="80%">
                <stop offset="0" stopColor={mix(colour(it), [255, 255, 255], 0.38)} />
                <stop offset="0.55" stopColor={colour(it)} />
                <stop offset="1" stopColor={mix(colour(it), [0, 0, 0], 0.32)} />
              </radialGradient>
            ))}
            <filter id={`tex${uid}`}>
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="3" seed="11" />
              <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.45" />
            </filter>
            <pattern id={`hatch${uid}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="rgba(0,0,0,.14)" /><rect width="4" height="14" fill="rgba(0,0,0,.2)" /></pattern>
          </defs>
          <rect width={W} height={H} fill="#0c0a09" />
          {cells.map((poly, i) => (
            <g key={i}>
              <polygon points={poly.map((p) => p.join(',')).join(' ')} fill={`url(#pane${uid}${i})`} />
              {items[i].p.subbedOut && <polygon points={poly.map((p) => p.join(',')).join(' ')} fill={`url(#hatch${uid})`} />}
            </g>
          ))}
          <rect width={W} height={H} filter={`url(#tex${uid})`} opacity="0.2" style={{ mixBlendMode: 'soft-light' }} />
          {cells.map((poly, i) => <polygon key={`l${i}`} points={poly.map((p) => p.join(',')).join(' ')} fill="none" stroke="#0c0a09" strokeWidth="9" strokeLinejoin="round" />)}
          <g fill="none" stroke="#0c0a09" strokeWidth="5" opacity="0.55">
            <path d={`M${W / 2} 0V${H}`} /><circle cx={W / 2} cy={H / 2} r="86" />
          </g>
          <rect x="4" y="4" width={W - 8} height={H - 8} fill="none" stroke="#0c0a09" strokeWidth="14" />

          {items.map((it) => (
            <g key={`${it.side}${it.p.id}`} fontFamily={serif} textAnchor="middle" opacity={it.p.subbedOut ? 0.75 : 1}>
              <text x={it.x} y={it.y + 8} fontSize="42" fontWeight="700" fill="#fff" stroke="#0c0a09" strokeWidth="6" paintOrder="stroke" strokeLinejoin="round">{it.p.jersey}</text>
              <text x={it.x} y={it.y + 40} fontSize="23" fontStyle="italic" fontWeight="500" fill="#fff" stroke="#0c0a09" strokeWidth="5" paintOrder="stroke" strokeLinejoin="round">{surname(it.p.name)}{it.p.subbedOut ? ' ↓' : ''}</text>
              {it.f.goals > 0 && <path transform={`translate(${it.x + 34} ${it.y - 30})`} d="M0-18C2-6 6-2 18 0 6 2 2 6 0 18-2 6-6 2-18 0-6-2-2-6 0-18Z" fill="#fff" stroke="#0c0a09" strokeWidth="3" />}
              {(it.f.yellow || it.f.red) && <rect x={it.x - 42} y={it.y - 36} width="13" height="19" fill={it.f.red ? '#e03a2c' : '#f2c200'} stroke="#0c0a09" strokeWidth="3" />}
            </g>
          ))}
        </svg>
      </div>
      <p className="mt-2 text-[13px] italic text-gray-400" style={{ fontFamily: serif }}>Each pane is the part of the pitch closest to that player. Hatched glass: substituted off.</p>
    </div>
  );
}
