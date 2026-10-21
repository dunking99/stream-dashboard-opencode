import { useId } from 'react';
import { spots, surname, kindOf } from '../matchData.js';

// 1. Chalkboard: a wooden tactics board in the dressing room. Everything is drawn in chalk, with
// the wobble and the dust. Goal scorers get the coach's dashed arrow towards goal.

const W = 1050;
const H = 680;
const X0 = 40, X1 = 1010, Y0 = 40, Y1 = 640; // the pitch inside the board
const px = (left) => X0 + (left / 100) * (X1 - X0);
const py = (top) => Y0 + (top / 100) * (Y1 - Y0);
const CHALK = { home: '#f4f1e8', away: '#f6d84c' };
const hand = "'Caveat', 'Segoe Print', 'Bradley Hand', cursive";

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
function GoalArrow({ x, y, side, label, color, filter }) {
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

export function Chalkboard({ d }) {
  const uid = useId().replace(/[^a-z0-9]/gi, '');
  const items = spots(d, 'landscape', 0.95);
  const rough = `url(#rough${uid})`;
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

          {items.map(({ side, p, left, top, f }) => {
            const x = px(left), y = py(top);
            const c = CHALK[side];
            return (
              <g key={`${side}${p.id}`} opacity={p.subbedOut ? 0.7 : 1}>
                <g filter={rough}>
                  <circle cx={x} cy={y} r="25" fill="none" stroke={c} strokeWidth="4.5" />
                  {p.subbedOut && <path d={`M${x - 20} ${y + 20}L${x + 20} ${y - 20}`} stroke={c} strokeWidth="4" strokeLinecap="round" />}
                  {f.yellow && !f.red && <rect x={x - 38} y={y - 34} width="14" height="20" fill="#f6d84c" transform={`rotate(-12 ${x - 31} ${y - 24})`} />}
                  {f.red && <rect x={x - 38} y={y - 34} width="14" height="20" fill="#ef6b6b" transform={`rotate(-12 ${x - 31} ${y - 24})`} />}
                </g>
                <text x={x} y={y + 9} textAnchor="middle" fontFamily={hand} fontSize="29" fontWeight="700" fill={c} opacity={p.subbedOut ? 0.55 : 1}>{p.jersey}</text>
                <text x={x} y={y + 54} textAnchor="middle" fontFamily={hand} fontSize="27" fontWeight="500" fill={c}>{surname(p.name)}</text>
              </g>
            );
          })}

          {items.filter((i) => i.f.goals > 0).map(({ side, p, left, top }) => (
            <GoalArrow key={`g${p.id}`} x={px(left)} y={py(top)} side={side} label={`${goalMin(p.name) ?? ''}'`} color={CHALK[side]} filter={rough} />
          ))}

          <g fontFamily={hand} fontWeight="700" filter={`url(#soft${uid})`}>
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
