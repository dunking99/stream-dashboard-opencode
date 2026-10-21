import { surname, onColor } from '../matchData.js';
import { Board, GoalArrow, CHALK, SLATE, Y0, Y1, hand } from './chalkBoard.jsx';

// Five ways to put the players on the same chalkboard: magnets, pinned index cards, chalk-drawn
// shirts, coaching X's and O's, and table-football rods. The board is shared (chalkBoard.jsx).

const sans = "'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif";
const mono = "'Space Mono', ui-monospace, Menlo, monospace";
const colorOf = (d, side) => d[side].color || (side === 'home' ? '#ffd400' : '#00c2a8');
const mix = (hex, to, t) => {
  const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
  const ch = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
// a name that always fits its space: shrink the type for long names
const fit = (name, px, max) => Math.min(max, px / (name.length * 0.44));
const CARD = (f) => (f.red ? '#e03a2c' : '#f2c200');
const star = (r) => Array.from({ length: 10 }, (_, i) => { const a = (Math.PI / 5) * i - Math.PI / 2; const rad = i % 2 ? r * 0.45 : r; return `${(Math.cos(a) * rad).toFixed(1)},${(Math.sin(a) * rad).toFixed(1)}`; }).join(' ');

// ---------------------------------------------------------------------------------------------
// A. Magnets: round plastic magnets in the team colours, with a label-maker tape for the name.
export function Magnets({ d }) {
  return (
    <Board d={d}>
      {({ items, px, py, uid, rough, goalMin }) => (
        <>
          <defs>
            {['home', 'away'].map((s) => (
              <radialGradient key={s} id={`mg${uid}${s}`} cx="38%" cy="30%" r="85%">
                <stop offset="0" stopColor={mix(colorOf(d, s), '#ffffff', 0.55)} /><stop offset="0.45" stopColor={colorOf(d, s)} /><stop offset="1" stopColor={mix(colorOf(d, s), '#000000', 0.38)} />
              </radialGradient>
            ))}
            <filter id={`ms${uid}`} x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="2" dy="5" stdDeviation="3.5" floodColor="#000" floodOpacity="0.55" /></filter>
          </defs>
          {items.map(({ side, p, left, top, f }) => {
            const x = px(left), y = py(top);
            const c = colorOf(d, side);
            const name = surname(p.name).toUpperCase();
            const tw = name.length * 9.6 + 16;
            const tilt = ((Number(p.jersey) || 0) % 3) - 1;
            return (
              <g key={`${side}${p.id}`}>
                {p.subbedOut ? (
                  <g>
                    <circle cx={x} cy={y} r="27" fill="none" stroke={CHALK[side]} strokeWidth="3" strokeDasharray="7 7" opacity="0.55" filter={rough} />
                    <text x={x} y={y + 9} textAnchor="middle" fontFamily={sans} fontWeight="800" fontSize="24" fill={CHALK[side]} opacity="0.5">{p.jersey}</text>
                  </g>
                ) : (
                  <g filter={`url(#ms${uid})`}>
                    <circle cx={x} cy={y} r="27" fill={`url(#mg${uid}${side})`} />
                    <circle cx={x} cy={y} r="27" fill="none" stroke="rgba(0,0,0,.4)" strokeWidth="2" />
                    <circle cx={x} cy={y} r="20.5" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2" />
                    <ellipse cx={x - 9} cy={y - 14} rx="11" ry="5.5" fill="#fff" opacity="0.38" transform={`rotate(-32 ${x - 9} ${y - 14})`} />
                    <text x={x} y={y + 9} textAnchor="middle" fontFamily={sans} fontWeight="800" fontSize="26" fill={onColor(c)}>{p.jersey}</text>
                  </g>
                )}
                <g transform={`translate(${x} ${y + 44}) rotate(${tilt})`} opacity={p.subbedOut ? 0.55 : 1}>
                  <rect x={-tw / 2} y="-12" width={tw} height="23" rx="3" fill="#161616" stroke="rgba(255,255,255,.15)" />
                  <text y="5" textAnchor="middle" fontFamily={mono} fontWeight="700" fontSize="15" fill="#f4f1e8">{name}</text>
                </g>
                {f.goals > 0 && (
                  <g filter={`url(#ms${uid})`}>
                    <circle cx={x + 24} cy={y - 24} r="12" fill="#fff" /><path d={`M${x + 24} ${y - 30}l6 4.4-2.3 7h-7.4l-2.3-7Z`} fill="#161616" />
                  </g>
                )}
                {(f.yellow || f.red) && <rect x={x - 38} y={y - 36} width="14" height="20" rx="2" fill={CARD(f)} stroke="#161616" strokeWidth="1.5" transform={`rotate(-14 ${x - 31} ${y - 26})`} filter={`url(#ms${uid})`} />}
              </g>
            );
          })}
          {items.filter((i) => i.f.goals > 0).map(({ side, p, left, top }) => (
            <GoalArrow key={`g${p.id}`} x={px(left)} y={py(top)} side={side} label={`${goalMin(p.name) ?? ''}'`} color={CHALK[side]} filter={rough} />
          ))}
        </>
      )}
    </Board>
  );
}

// ---------------------------------------------------------------------------------------------
// B. Pinned cards: an index card per player, held to the board with a drawing pin in the team colour.
export function PinnedCards({ d }) {
  return (
    <Board d={d}>
      {({ items, px, py, uid, goalMin }) => (
        <>
          <defs>
            <filter id={`cs${uid}`} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="1.5" dy="4" stdDeviation="2.4" floodColor="#000" floodOpacity="0.55" /></filter>
          </defs>
          {items.map(({ side, p, left, top, f }) => {
            const x = px(left), y = py(top);
            const c = colorOf(d, side);
            const rot = (((Number(p.jersey) || 0) % 5) - 2) * 1.8;
            const name = surname(p.name);
            return (
              <g key={`${side}${p.id}`} transform={`translate(${x} ${y}) rotate(${rot})`} opacity={p.subbedOut ? 0.62 : 1}>
                <g filter={`url(#cs${uid})`}>
                  <rect x="-39" y="-26" width="78" height="52" fill="#f3edda" />
                  <rect x="-39" y="-26" width="78" height="5" fill={c} />
                  <path d="M-39 -3H39M-39 11H39" stroke="#9db7d6" strokeWidth="1.1" opacity="0.8" />
                </g>
                <text x="-33" y="-1" fontFamily={hand} fontWeight="700" fontSize="32" fill="#26241f">{p.jersey}</text>
                <text x="34" y="-9" textAnchor="end" fontFamily={mono} fontSize="11" fontWeight="700" fill="#7b7664">{p.position}</text>
                <text x="0" y="20" textAnchor="middle" fontFamily={hand} fontWeight="700" fontSize={fit(name, 70, 24)} fill="#26241f">{name}</text>
                {f.goals > 0 && (
                  <g transform="translate(40 -27)">
                    <polygon points={star(16)} fill="#ffd23f" stroke="#b8860b" strokeWidth="1.5" />
                    <text y="4" textAnchor="middle" fontFamily={sans} fontWeight="800" fontSize="10" fill="#5a4300">{goalMin(p.name)}'</text>
                  </g>
                )}
                {(f.yellow || f.red) && <rect x="-30" y="22" width="11" height="15" rx="1.5" fill={CARD(f)} stroke="#26241f" strokeWidth="1" />}
                {p.subbedOut && (
                  <g transform="translate(24 22) rotate(-14)">
                    <rect x="-20" y="-8" width="40" height="16" fill="#d94b3a" />
                    <text y="4" textAnchor="middle" fontFamily={mono} fontWeight="700" fontSize="11" fill="#fff">OFF</text>
                  </g>
                )}
                {!p.subbedOut && (
                  <g>
                    <ellipse cx="3" cy="-20" rx="8" ry="3.6" fill="rgba(0,0,0,.35)" />
                    <circle cx="0" cy="-26" r="8" fill={mix(c, '#000000', 0.25)} /><circle cx="0" cy="-27" r="6.6" fill={c} />
                    <circle cx="-2.2" cy="-29.4" r="2.2" fill="#fff" opacity="0.65" />
                  </g>
                )}
              </g>
            );
          })}
        </>
      )}
    </Board>
  );
}

// ---------------------------------------------------------------------------------------------
// C. Chalk shirts: a little drawn shirt for each player, hatched in; scorers wear hoops, and the
// shirt of a player who's gone off is left as an empty dashed outline.
const SHIRT = 'M-14 -26L-6 -22Q0 -16 6 -22L14 -26L33 -12L25 -1L16 -7V26H-16V-7L-25 -1L-33 -12Z';
export function ChalkShirts({ d }) {
  return (
    <Board d={d}>
      {({ items, px, py, uid, rough, goalMin }) => (
        <>
          <defs>
            {['home', 'away'].map((s) => (
              <g key={s}>
                <pattern id={`ht${uid}${s}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V7" stroke={CHALK[s]} strokeWidth="2.4" opacity="0.5" /></pattern>
                <pattern id={`hp${uid}${s}`} width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 4H14M0 11H14" stroke={CHALK[s]} strokeWidth="5" opacity="0.65" /></pattern>
              </g>
            ))}
          </defs>
          {items.map(({ side, p, left, top, f }) => {
            const x = px(left), y = py(top);
            const c = CHALK[side];
            const name = surname(p.name);
            return (
              <g key={`${side}${p.id}`}>
                <g transform={`translate(${x} ${y}) scale(1.15)`} filter={rough}>
                  <path d={SHIRT} fill={p.subbedOut ? 'none' : f.goals ? `url(#hp${uid}${side})` : `url(#ht${uid}${side})`} stroke={c} strokeWidth="4" strokeLinejoin="round" strokeDasharray={p.subbedOut ? '8 7' : undefined} />
                  <path d="M-6 -22Q0 -12 6 -22" fill="none" stroke={c} strokeWidth="3.5" />
                  {(f.yellow || f.red) && <rect x="-44" y="-26" width="12" height="17" fill={CARD(f)} transform="rotate(-18 -38 -18)" />}
                </g>
                <text x={x} y={y + 11} textAnchor="middle" fontFamily={hand} fontWeight="700" fontSize="31" fill={c} stroke={SLATE} strokeWidth="7" paintOrder="stroke" opacity={p.subbedOut ? 0.6 : 1}>{p.jersey}</text>
                <text x={x} y={y + 54} textAnchor="middle" fontFamily={hand} fontWeight="500" fontSize={fit(name, 96, 27)} fill={c} opacity={p.subbedOut ? 0.7 : 1}>{name}</text>
                {f.goals > 0 && (
                  <g filter={rough}>
                    <circle cx={x + 46} cy={y - 24} r="11" fill="none" stroke={c} strokeWidth="3.5" /><path d={`M${x + 46} ${y - 30}l5.5 4-2.1 6.4h-6.8l-2.1-6.4Z`} fill={c} />
                    <text x={x + 62} y={y - 15} fontFamily={hand} fontWeight="700" fontSize="26" fill={c} stroke="none">{goalMin(p.name)}'</text>
                  </g>
                )}
              </g>
            );
          })}
        </>
      )}
    </Board>
  );
}

// ---------------------------------------------------------------------------------------------
// D. X's and O's: coaching notation. O for the home side, X for the away side, the formation drawn
// as a web, a short run arrow for each scorer, and a walk-off arrow to the touchline for a sub.
export function XsAndOs({ d }) {
  return (
    <Board d={d}>
      {({ items, px, py, rough, goalMin }) => {
        const pts = items.map((i) => ({ ...i, x: px(i.left), y: py(i.top) }));
        const webs = [];
        for (const side of ['home', 'away']) {
          const mine = pts.filter((i) => i.side === side);
          const nRows = Math.max(...mine.map((i) => i.row), -1) + 1;
          for (let r = 0; r < nRows; r++) {
            const row = mine.filter((i) => i.row === r).sort((a, b) => a.y - b.y);
            for (let k = 0; k < row.length - 1; k++) webs.push([row[k], row[k + 1]]);
            const next = mine.filter((i) => i.row === r + 1);
            for (const a of row) {
              if (!next.length) continue;
              const b = next.reduce((best, c) => (Math.abs(c.y - a.y) < Math.abs(best.y - a.y) ? c : best), next[0]);
              webs.push([a, b]);
            }
          }
        }
        return (
          <>
            <g filter={rough} stroke="#f4f1e8" strokeWidth="2.6" strokeDasharray="2 9" strokeLinecap="round" opacity="0.5">
              {webs.map(([a, b], i) => <path key={i} d={`M${a.x} ${a.y}L${b.x} ${b.y}`} />)}
            </g>
            {pts.map(({ side, p, x, y, f }) => {
              const c = CHALK[side];
              const dir = side === 'home' ? 1 : -1;
              const down = y > (Y0 + Y1) / 2;
              const ex = x + dir * 70, ey = down ? Y1 - 6 : Y0 + 6;
              return (
                <g key={`${side}${p.id}`} opacity={p.subbedOut ? 0.75 : 1}>
                  <g filter={rough} stroke={c} fill="none" strokeWidth="5" strokeLinecap="round">
                    {side === 'home' ? <circle cx={x} cy={y} r="17" /> : <path d={`M${x - 14} ${y - 14}L${x + 14} ${y + 14}M${x + 14} ${y - 14}L${x - 14} ${y + 14}`} />}
                    {p.subbedOut && (
                      <>
                        <path d={`M${x} ${y + (down ? 24 : -24)}Q${x + dir * 12} ${(y + ey) / 2} ${ex} ${ey}`} strokeWidth="3.5" strokeDasharray="1 9" />
                        <path d={`M${ex} ${ey}l${-dir * 11} ${down ? -3 : 3}M${ex} ${ey}l${-dir * 3} ${down ? -12 : 12}`} strokeWidth="3.5" />
                      </>
                    )}
                    {f.goals > 0 && (
                      <>
                        <path d={`M${x + dir * 20} ${y - 14}L${x + dir * 64} ${y - 50}`} strokeWidth="6" />
                        <path d={`M${x + dir * 64} ${y - 50}l${-dir * 4} 15M${x + dir * 64} ${y - 50}l${-dir * 15} 3`} strokeWidth="6" />
                      </>
                    )}
                  </g>
                  <text x={x + 21} y={y - 15} fontFamily={hand} fontWeight="700" fontSize="23" fill={c}>{p.jersey}</text>
                  <text x={x} y={y + 46} textAnchor="middle" fontFamily={hand} fontWeight="500" fontSize="25" fill={c}>{surname(p.name)}</text>
                  {f.goals > 0 && <text x={x + dir * 78} y={y - 56} textAnchor="middle" fontFamily={hand} fontWeight="700" fontSize="28" fill={c}>{goalMin(p.name)}'</text>}
                  {(f.yellow || f.red) && <rect x={x - 38} y={y - 34} width="12" height="17" fill={CARD(f)} transform={`rotate(-14 ${x - 32} ${y - 26})`} />}
                </g>
              );
            })}
          </>
        );
      }}
    </Board>
  );
}

// ---------------------------------------------------------------------------------------------
// E. Table football: every row of the formation is a rod running across the pitch, and the players
// are little men screwed on to it, facing the other goal. The goalkeeper gets a rod of his own.
export function Foosball({ d }) {
  return (
    <Board d={d}>
      {({ items, px, py, rough, goalMin }) => {
        const pts = items.map((i) => ({ ...i, x: px(i.left), y: py(i.top) }));
        const rods = [];
        for (const side of ['home', 'away']) {
          const mine = pts.filter((i) => i.side === side);
          for (let r = 0; r <= Math.max(...mine.map((i) => i.row), -1); r++) {
            const row = mine.filter((i) => i.row === r);
            if (row.length) rods.push({ side, x: row.reduce((s, i) => s + i.x, 0) / row.length });
          }
        }
        return (
          <>
            <g filter={rough} stroke="#f4f1e8" strokeWidth="5" strokeLinecap="round" opacity="0.7">
              {rods.map((r, i) => (
                <g key={i}>
                  <path d={`M${r.x} ${Y0 - 4}V${Y1 + 4}`} opacity="0.65" />
                  <circle cx={r.x} cy={Y0 - 4} r="7" fill="#f4f1e8" /><circle cx={r.x} cy={Y1 + 4} r="7" fill="#f4f1e8" />
                </g>
              ))}
            </g>
            {pts.map(({ side, p, x, y, f }) => {
              const c = CHALK[side];
              const dir = side === 'home' ? 1 : -1;
              return (
                <g key={`${side}${p.id}`} opacity={p.subbedOut ? 0.7 : 1}>
                  <g filter={rough} stroke={c} fill={SLATE} strokeWidth="4.5" strokeLinejoin="round" strokeDasharray={p.subbedOut ? '7 6' : undefined}>
                    <rect x={dir > 0 ? x + 8 : x - 34} y={y + 2} width="26" height="13" rx="6" />
                    <rect x={x - 13} y={y - 20} width="26" height="40" rx="10" />
                    {f.goals > 0 && <circle cx={x + dir * 52} cy={y + 8} r="9" fill="#f4f1e8" />}
                  </g>
                  <text x={x} y={y + 8} textAnchor="middle" fontFamily={hand} fontWeight="700" fontSize="23" fill={c}>{p.jersey}</text>
                  <text x={x} y={y + 50} textAnchor="middle" fontFamily={hand} fontWeight="500" fontSize="25" fill={c} stroke={SLATE} strokeWidth="6" paintOrder="stroke">{surname(p.name)}</text>
                  {f.goals > 0 && <text x={x + dir * 52} y={y - 10} textAnchor="middle" fontFamily={hand} fontWeight="700" fontSize="26" fill={c} stroke={SLATE} strokeWidth="6" paintOrder="stroke">{goalMin(p.name)}'</text>}
                  {(f.yellow || f.red) && <rect x={x - 36} y={y - 32} width="12" height="17" fill={CARD(f)} transform={`rotate(-14 ${x - 30} ${y - 24})`} />}
                </g>
              );
            })}
          </>
        );
      }}
    </Board>
  );
}
