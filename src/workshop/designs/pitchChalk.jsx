import { surname } from '../matchData.js';
import { Board, GoalArrow, CHALK, hand } from './chalkBoard.jsx';

// 1. Chalkboard: a wooden tactics board in the dressing room. Everything is drawn in chalk, with
// the wobble and the dust. Goal scorers get the coach's dashed arrow towards goal.
// (The board itself lives in chalkBoard.jsx; this is the original chalk-circle player style.)

export function Chalkboard({ d }) {
  return (
    <Board d={d}>
      {({ items, px, py, rough, goalMin }) => (
        <>
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
        </>
      )}
    </Board>
  );
}
