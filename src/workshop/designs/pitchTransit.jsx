import { rowsOf, spots, surname, kindOf } from '../matchData.js';

// 3. Transit map: the lineup as a rail network diagram. Each row of the formation is a line, each
// player a station, rows are joined by 45-degree links, and the halfway line is the river. Below,
// a service-status board: substitutions are closures, cards are delays, goals are special events.

const sans = "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const W = 700;
const H = 960;
const X0 = 70, X1 = 630, Y0 = 70, Y1 = 890;
const px = (left) => X0 + (left / 100) * (X1 - X0);
const py = (top) => Y0 + (top / 100) * (Y1 - Y0);

// line colour by position in the shape: keeper, defence, midfield(s), attack
const lineColor = (r, n) => (r === 0 ? '#9b0058' : r === n - 1 ? '#0098d4' : r === 1 ? '#007d32' : r === 2 ? '#e32017' : '#ee7c0e');
const lineName = (r, n) => {
  if (r === 0) return 'Goalkeeper';
  if (r === 1) return 'Defence';
  if (r === n - 1) return 'Attack';
  const mids = n - 3;
  return mids === 1 ? 'Midfield' : r === 2 ? 'Holding midfield' : 'Attacking midfield';
};

// a link between two stations that only uses vertical and 45-degree runs, as a rail map does
function link(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const run = Math.min(Math.abs(dx), Math.abs(dy));
  const mid = { x: a.x, y: a.y + Math.sign(dy) * (Math.abs(dy) - run) };
  return `M${a.x} ${a.y}L${mid.x} ${mid.y}L${b.x} ${b.y}`;
}

function statusOf(d, row) {
  const parts = [];
  const goals = row.filter((p) => flag(d, p, 'goals'));
  const off = row.filter((p) => p.subbedOut);
  const booked = row.filter((p) => flag(d, p, 'yellow') || flag(d, p, 'red'));
  if (goals.length) parts.push(`Special event: ${goals.map((p) => `${surname(p.name)} ${d.timeline.find((e) => e.player === p.name && kindOf(e) === 'goal')?.clock}`).join(', ')}`);
  if (off.length) parts.push(`Part closed: ${off.map((p) => surname(p.name)).join(', ')} off`);
  if (booked.length) parts.push(`Minor delays: ${booked.map((p) => surname(p.name)).join(', ')} booked`);
  return parts.length ? parts.join(' · ') : 'Good service';
}
const flag = (d, p, k) => {
  const kinds = d.timeline.filter((e) => e.player === p.name).map(kindOf);
  return k === 'goals' ? kinds.includes('goal') : kinds.includes(k);
};

function Map({ d }) {
  const items = spots(d, 'portrait', 0.93);
  const out = [];
  for (const side of ['home', 'away']) {
    const mine = items.filter((i) => i.side === side);
    const n = Math.max(0, ...mine.map((i) => i.row)) + 1;
    const rows = Array.from({ length: n }, (_, r) => mine.filter((i) => i.row === r).map((i) => ({ ...i, x: px(i.left), y: py(i.top) })).sort((a, b) => a.x - b.x));
    out.push({ side, rows, n });
  }
  const midY = py(50);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Lineup drawn as a rail network" style={{ fontFamily: sans }}>
      <rect x="6" y="6" width={W - 12} height={H - 12} rx="14" fill="#fbfaf6" stroke="#0b2b6b" strokeWidth="6" />
      <rect x="6" y={midY - 28} width={W - 12} height="56" fill="#cde7f3" />
      <text x="34" y={midY + 7} fontStyle="italic" fontWeight="500" fontSize="21" fill="#6a9bb3">The Halfway</text>

      {out.map(({ side, rows, n }) => (
        <g key={side}>
          {rows.map((row, r) => row.length > 0 && (
            <path key={`l${r}`} d={`M${row[0].x - (row.length === 1 ? 70 : 34)} ${row[0].y}H${row[row.length - 1].x + (row.length === 1 ? 70 : 34)}`} stroke={lineColor(r, n)} strokeWidth="13" strokeLinecap="round" fill="none" />
          ))}
          {rows.slice(1).map((row, i) => {
            const above = rows[i];
            if (!above.length || !row.length) return null;
            const near = (arr) => arr.reduce((best, s) => (Math.abs(s.x - W / 2) < Math.abs(best.x - W / 2) ? s : best), arr[0]);
            return <path key={`k${i}`} d={link(near(above), near(row))} stroke={lineColor(i + 1, n)} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" />;
          })}
        </g>
      ))}

      {out.flatMap(({ side, rows }) => rows.flat().map((s) => {
        const special = s.f.goals > 0;
        return (
          <g key={`${side}${s.p.id}`} opacity={s.p.subbedOut ? 0.8 : 1}>
            {special && <circle cx={s.x} cy={s.y} r="23" fill="#fff" stroke="#111" strokeWidth="5" />}
            <circle cx={s.x} cy={s.y} r={special ? 14 : 16} fill={s.p.subbedOut ? '#e4e2da' : '#fff'} stroke={s.p.subbedOut ? '#777' : '#111'} strokeWidth="5" />
            <text x={s.x} y={s.y + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="#111">{s.p.jersey}</text>
            {s.p.subbedOut && <path d={`M${s.x - 20} ${s.y + 20}L${s.x + 20} ${s.y - 20}`} stroke="#e32017" strokeWidth="4" strokeLinecap="round" />}
            <text transform={`translate(${s.x + 12} ${s.y - 22}) rotate(-38)`} fontSize="19" fontWeight="700" fill="#111" stroke="#fbfaf6" strokeWidth="6" paintOrder="stroke" strokeLinejoin="round">
              {surname(s.p.name)}
            </text>
            {(s.f.yellow || s.f.red) && <rect x={s.x - 29} y={s.y - 20} width="9" height="13" rx="1.5" fill={s.f.red ? '#e32017' : '#ffd329'} stroke="#111" strokeWidth="1.5" />}
          </g>
        );
      }))}

      <text x="34" y="46" fontSize="22" fontWeight="800" fill="#0b2b6b">{d.away.name}</text>
      <text x={W - 34} y="46" fontSize="20" fontWeight="700" fill="#0b2b6b" textAnchor="end">{d.lineups.away?.formation}</text>
      <text x="34" y={H - 24} fontSize="22" fontWeight="800" fill="#0b2b6b">{d.home.name}</text>
      <text x={W - 34} y={H - 24} fontSize="20" fontWeight="700" fill="#0b2b6b" textAnchor="end">{d.lineups.home?.formation}</text>
    </svg>
  );
}

function Board({ d }) {
  return (
    <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      {['home', 'away'].map((side) => {
        const rows = rowsOf(d.lineups[side]);
        return (
          <section key={side} className="overflow-hidden border-2 border-[#0b2b6b] bg-white" style={{ fontFamily: sans }}>
            <h4 className="bg-[#0b2b6b] px-3 py-1.5 text-[15px] font-bold text-white">{d[side].name}: service status</h4>
            <ul>
              {rows.map((row, r) => (
                <li key={r} className="grid border-t border-[#0b2b6b]/20" style={{ gridTemplateColumns: '9.5rem 1fr' }}>
                  <span className="px-3 py-2 text-[14px] font-bold text-white" style={{ background: lineColor(r, rows.length) }}>{lineName(r, rows.length)}</span>
                  <span className="px-3 py-2 text-[14px] text-[#111]">{statusOf(d, row)}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function TransitMap({ d }) {
  if (!rowsOf(d.lineups?.home).length && !rowsOf(d.lineups?.away).length) {
    return <p className="rounded border border-dashed border-gray-600 p-8 text-center text-sm text-gray-400">The network map is drawn once lineups are announced.</p>;
  }
  return (
    <div className="mx-auto w-full max-w-[980px]">
      <div className="mx-auto w-full max-w-[540px]"><Map d={d} /></div>
      <Board d={d} />
    </div>
  );
}
