import { useId } from 'react';
import { spots, kindOf } from '../matchData.js';

// The wooden chalkboard itself: frame, slate, dust, chalk pitch markings, headers and the ledge.
// It draws no players. Pass a function as children and draw whatever you like on it:
//   <Board d={d}>{({ items, px, py, uid, rough }) => <g>…</g>}</Board>
// `items` are the 22 players from spots(); px / py turn their left / top percentages into board
// coordinates; `rough` is the chalk filter reference to put on anything chalk-drawn.

export const W = 1050;
export const H = 680;
export const X0 = 40, X1 = 1010, Y0 = 40, Y1 = 640; // the pitch inside the board
export const px = (left) => X0 + (left / 100) * (X1 - X0);
export const py = (top) => Y0 + (top / 100) * (Y1 - Y0);
export const CHALK = { home: '#f4f1e8', away: '#f6d84c' };
export const hand = "'Caveat', 'Segoe Print', 'Bradley Hand', cursive";
export const SLATE = '#27332f';

function Lines({ filter }) {
  const g = { stroke: '#f4f1e8', strokeWidth: 4, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round', opacity: 0.85 };
  const midX = (X0 + X1) / 2, midY = (Y0 + Y1) / 2;
  const boxW = 152, boxH = 356, sixW = 51, sixH = 161;
  return (
    <g filter={filter} {...g}>
      <rect x={X0} y={Y0} width={X1 - X0} height={Y1 - Y0} />
      <path d={`M${midX} ${Y0}V${Y1}`} />
      <ellipse cx={midX} cy={midY} rx="85" ry="81" />
      <circle cx={midX} cy={midY} r="3" fill="#f4f1e8" />
      <rect x={X0} y={midY - boxH / 2} width={boxW} height={boxH} />
      <rect x={X1 - boxW} y={midY - boxH / 2} width={boxW} height={boxH} />
      <rect x={X0} y={midY - sixH / 2} width={sixW} height={sixH} />
      <rect x={X1 - sixW} y={midY - sixH / 2} width={sixW} height={sixH} />
    </g>
  );
}

// a curved, dashed arrow from the scorer to the goal they were attacking
export function GoalArrow({ x, y, side, label, color, filter }) {
  const gx = side === 'home' ? X1 - 6 : X0 + 6;
  const gy = (Y0 + Y1) / 2;
  const cx = (x + gx) / 2;
  const cy = 20; // control point near the top edge, so the arrow arcs over the pitch
  const t = 0.97; // stop just short of the line, then draw the head
  const bx = (1 - t) ** 2 * x + 2 * (1 - t) * t * cx + t * t * gx;
  const by = (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t * t * gy;
  const ang = Math.atan2(gy - by, gx - bx);
  const head = [[0, 0], [-22, -11], [-22, 11]].map(([a, b]) => `${gx + a * Math.cos(ang) - b * Math.sin(ang)},${gy + a * Math.sin(ang) + b * Math.cos(ang)}`).join(' ');
  return (
    <g filter={filter} stroke={color} fill="none" strokeWidth="5" strokeLinecap="round">
      <path d={`M${x} ${y}Q${cx} ${cy} ${bx} ${by}`} strokeDasharray="4 16" />
      <polygon points={head} fill={color} strokeWidth="2" />
      <text x={cx} y={0.25 * y + 0.5 * cy + 0.25 * gy - 14} fill={color} stroke="none" fontFamily={hand} fontSize="34" fontWeight="700" textAnchor="middle">{label}</text>
    </g>
  );
}

export function Board({ d, children, squeeze = 0.95 }) {
  const uid = useId().replace(/[^a-z0-9]/gi, '');
  const items = spots(d, 'landscape', squeeze);
  const rough = `url(#rough${uid})`;
  const soft = `url(#soft${uid})`;
  const scheduled = d.status.state === 'scheduled';
  const goalMin = (name) => d.timeline.find((e) => e.player === name && kindOf(e) === 'goal')?.clock.replace(/'/g, '');
  return (
    <div className="mx-auto w-full max-w-[980px]">
      <div className="rounded-sm p-3.5" style={{ background: 'linear-gradient(135deg,#8a6339,#6b4a2a 55%,#7c5933)', boxShadow: '0 14px 30px -12px rgba(0,0,0,.7), inset 0 2px 0 rgba(255,255,255,.15)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Tactics board with both teams' formations">
          <defs>
            <filter id={`rough${uid}`} x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4" result="warp" />
              <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" result="wobbly" />
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="9" result="grain" />
              <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.55" result="holes" />
              <feComposite in="wobbly" in2="holes" operator="in" />
            </filter>
            <filter id={`soft${uid}`}><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="2" result="w" /><feDisplacementMap in="SourceGraphic" in2="w" scale="3" /></filter>
            <filter id={`dust${uid}`}><feGaussianBlur stdDeviation="14" /></filter>
            <radialGradient id={`slate${uid}`} cx="50%" cy="45%" r="75%"><stop offset="0" stopColor="#33423b" /><stop offset="1" stopColor="#202a25" /></radialGradient>
          </defs>
          <rect width={W} height={H} fill={`url(#slate${uid})`} />
          <g filter={`url(#dust${uid})`} fill="#fff" opacity="0.07">
            <ellipse cx="300" cy="470" rx="230" ry="60" /><ellipse cx="760" cy="200" rx="190" ry="50" /><ellipse cx="520" cy="610" rx="260" ry="30" />
          </g>
          <Lines filter={rough} />

          {children({ d, items, uid, rough, soft, px, py, goalMin })}

          <g fontFamily={hand} fontWeight="700" filter={soft}>
            <text x="46" y="31" fontSize="30" fill={CHALK.home}>{d.home.name} · {d.lineups?.home?.formation}</text>
            <text x={W - 46} y="31" fontSize="30" fill={CHALK.away} textAnchor="end">{d.lineups?.away?.formation} · {d.away.name}</text>
            {!scheduled && <text x={W / 2} y={H - 8} fontSize="34" fill="#f4f1e8" textAnchor="middle">{d.status.state === 'live' ? `${d.status.detail}  ` : 'FT  '}{d.home.score} – {d.away.score}</text>}
          </g>
        </svg>
      </div>
      {/* the ledge: a stick of chalk and the felt rubber */}
      <div className="relative mx-3 h-[14px] rounded-b-sm" style={{ background: 'linear-gradient(#5b3f23,#46301a)', boxShadow: '0 8px 14px -6px rgba(0,0,0,.6)' }}>
        <span className="absolute -top-[7px] left-[18%] h-[8px] w-[54px] rounded-[3px]" style={{ background: '#f4f1e8', transform: 'rotate(-3deg)' }} />
        <span className="absolute -top-[10px] right-[14%] h-[11px] w-[70px] rounded-[2px]" style={{ background: 'linear-gradient(#c9b98c 0 35%, #3a3a36 35%)' }} />
      </div>
    </div>
  );
}
