import { kindOf } from '../matchData.js';

// H. Territory: the stats are drawn on a pitch, not listed. Possession is who owns the grass (the
// boundary between the two colours sits where the possession split is). Every shot is a ball in the
// goal it was aimed at: solid for on target, hollow for off. Corners are flags in the corners,
// cards are cards on the touchline. Read it at a glance; the numbers are underneath.

const BG = '#0f1411';
const colorOf = (d, side) => d[side].color || '#888';
const W = 840, H = 420;

function Ball({ x, y, solid = true, r = 9 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={solid ? '#fff' : 'none'} stroke="#fff" strokeWidth={solid ? 0 : 1.6} />
      {solid && <path d={`m0 ${-r * 0.55} ${r * 0.5} ${r * 0.36}-${r * 0.2} ${r * 0.58}h-${r * 0.6}l-${r * 0.2}-${r * 0.58}z`} fill="#0b1118" />}
    </g>
  );
}

function Flag({ x, y, n, color }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 14V-16" stroke="#fff" strokeWidth="2" /><path d="M1 -16 20 -10 1 -4Z" fill={color} />
      <text x="26" y="4" fill="#fff" fontSize="16" fontWeight="700" fontFamily="ui-monospace, monospace">{n}</text>
    </g>
  );
}

const num = (d, name, side) => parseFloat(d.stats?.find((s) => s.name === name)?.[side]) || 0;

export function Territory({ d }) {
  const hasStats = d.stats?.length;
  const poss = num(d, 'possessionPct', 'home') || 50;
  const bx = (poss / 100) * W;
  const hc = colorOf(d, 'home'), ac = colorOf(d, 'away');
  const shots = (side) => ({ total: num(d, 'totalShots', side), on: num(d, 'shotsOnTarget', side) });
  const goalBalls = (side) => {
    const s = shots(side);
    const n = Math.min(s.total, 24);
    // home attacks right: balls collect in the right goal area; away in the left
    return Array.from({ length: n }, (_, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const x = side === 'home' ? W - 24 - col * 22 : 24 + col * 22;
      return { x, y: 150 + row * 22, solid: i < s.on };
    });
  };
  const cards = (side) => d.timeline.filter((e) => e.side === side && ['yellow', 'red'].includes(kindOf(e)));

  // wavy possession boundary
  const wave = Array.from({ length: 22 }, (_, i) => {
    const y = (i / 21) * H;
    return `${i ? 'L' : 'M'}${bx + Math.sin(i * 0.9) * 10} ${y}`;
  }).join(' ');

  return (
    <div className="rounded-2xl p-4 text-white" style={{ background: BG }}>
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="text-sm font-bold" style={{ color: hc }}>{d.home.name}</div>
        <div className="font-mono text-2xl font-bold">{d.home.score ?? '–'} <span className="text-white/35">:</span> {d.away.score ?? '–'}</div>
        <div className="text-sm font-bold" style={{ color: ac }}>{d.away.name}</div>
      </div>

      {!hasStats ? (
        <div className="grid h-60 place-items-center rounded-xl border border-dashed border-white/15 text-sm text-white/50">Territory fills in once the match has stats.</div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl" role="img" aria-label="Match stats drawn on a pitch">
          <defs>
            <clipPath id="pitchClip"><rect width={W} height={H} rx="12" /></clipPath>
          </defs>
          <g clipPath="url(#pitchClip)">
            <rect width={W} height={H} fill="#1a4f2e" />
            {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 84} width="42" height={H} fill="#000" opacity=".08" />)}
            <path d={`${wave} L${W} ${H} L${W} 0 Z`} fill={ac} opacity=".35" />
            <path d={`${wave} L0 ${H} L0 0 Z`} fill={hc} opacity=".35" />
            <path d={wave} fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="5 6" opacity=".8" />
            <g fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2">
              <rect x="4" y="4" width={W - 8} height={H - 8} rx="4" /><path d={`M${W / 2} 4V${H - 4}`} /><circle cx={W / 2} cy={H / 2} r="44" />
              <rect x="4" y={H / 2 - 100} width="110" height="200" /><rect x={W - 114} y={H / 2 - 100} width="110" height="200" />
            </g>
          </g>
          {goalBalls('home').map((b, i) => <Ball key={`h${i}`} {...b} />)}
          {goalBalls('away').map((b, i) => <Ball key={`a${i}`} {...b} />)}
          <Flag x={14} y={34} n={num(d, 'wonCorners', 'home')} color={hc} />
          <Flag x={14} y={H - 14} n={num(d, 'wonCorners', 'home')} color={hc} />
          <Flag x={W - 56} y={34} n={num(d, 'wonCorners', 'away')} color={ac} />
          <Flag x={W - 56} y={H - 14} n={num(d, 'wonCorners', 'away')} color={ac} />
          <text x={bx} y={H / 2 + 6} textAnchor="middle" fill="#fff" fontSize="44" fontWeight="800" fontFamily="'Archivo Black', system-ui, sans-serif" opacity=".92" stroke="#000" strokeOpacity=".35" strokeWidth="6" paintOrder="stroke">{Math.round(poss)}%</text>
        </svg>
      )}

      {hasStats ? (
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 px-1 text-[12px] text-white/70 sm:grid-cols-4">
          {[['Shots', 'totalShots'], ['On target', 'shotsOnTarget'], ['Corners', 'wonCorners'], ['Fouls', 'foulsCommitted']].map(([label, key]) => (
            <div key={key} className="flex items-baseline justify-between gap-3 border-t border-white/10 pt-1.5">
              <span className="font-mono text-base font-bold" style={{ color: hc }}>{num(d, key, 'home')}</span>
              <span className="uppercase tracking-wider">{label}</span>
              <span className="font-mono text-base font-bold" style={{ color: ac }}>{num(d, key, 'away')}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex justify-between px-1">
        {['home', 'away'].map((side) => (
          <div key={side} className={`flex items-center gap-1.5 ${side === 'away' ? 'flex-row-reverse' : ''}`} aria-label={`${d[side].name} cards`}>
            {cards(side).map((e) => <span key={e.id} className="h-4 w-3 rounded-[2px]" title={`${e.player} ${e.clock}`} style={{ background: kindOf(e) === 'red' ? '#e5372b' : '#f2c200' }} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
