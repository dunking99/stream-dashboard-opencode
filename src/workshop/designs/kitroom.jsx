import { spots, surname, kindOf, onColor } from '../matchData.js';

// G. Kit room: the match told with shirts. The score is printed on the back of each club's shirt,
// the XI are shirts laid out on the pitch, subs are shirts on the bench, and the stats are a tug of
// war in club colours. No boxes; the shirts are the pictures.

const BG = '#14181a';
const colorOf = (d, side) => d[side].color || '#888';

function Shirt({ color, number, size = 40, dim = false, ring = false, label }) {
  const ink = onColor(color);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label || `Shirt ${number}`} style={{ opacity: dim ? 0.4 : 1, overflow: 'visible' }}>
      <path d="M31 6 8 20 0 46l19 6 4-10v50h54V42l4 10 19-6-8-26L69 6c-4 10-34 10-38 0Z" fill={color} stroke={ring ? '#fff' : 'rgba(0,0,0,.35)'} strokeWidth={ring ? 3 : 2} strokeLinejoin="round" />
      <path d="M31 6c4 10 34 10 38 0" fill="none" stroke={ink} strokeOpacity=".75" strokeWidth="5" strokeLinecap="round" />
      <path d="M0 46l19 6m81-6-19 6" stroke={ink} strokeOpacity=".5" strokeWidth="4" />
      <text x="50" y="64" textAnchor="middle" fontSize={number != null && String(number).length > 2 ? 28 : 38} fontWeight="800" fill={ink} fontFamily="'Archivo Black', 'Arial Black', system-ui, sans-serif">{number ?? '–'}</text>
    </svg>
  );
}

const Ball = ({ size = 12 }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#fff" /><path d="m8 4.6 2.4 1.7-.9 2.8H6.5l-.9-2.8L8 4.6Z" fill="#0b1118" /></svg>
);

function HeroSide({ d, side }) {
  const scorers = d.timeline.filter((e) => e.side === side && kindOf(e) === 'goal');
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center text-center">
      <Shirt color={colorOf(d, side)} number={d[side].score} size={150} label={`${d[side].name} ${d[side].score ?? ''}`} />
      <div className="mt-2 text-lg font-bold text-white">{d[side].name}</div>
      <ul className="mt-1.5 min-h-[2.5rem] space-y-0.5 text-[12px] text-white/70">
        {scorers.map((e) => (
          <li key={e.id} className="flex items-center justify-center gap-1.5"><Ball size={11} />{surname(e.player)} <span className="font-mono text-white/45">{e.clock}</span></li>
        ))}
      </ul>
    </div>
  );
}

function Hero({ d }) {
  const live = d.status.state === 'live';
  return (
    <header className="relative px-5 pb-4 pt-6">
      <div className="absolute inset-x-5 top-4 h-1.5 rounded-full bg-white/10" aria-hidden="true" />
      <div className="flex items-start gap-2 pt-3">
        <HeroSide d={d} side="home" />
        <div className="flex w-24 shrink-0 flex-col items-center pt-14 text-center">
          <span className={`rounded-full px-3 py-1 font-mono text-xs font-bold ${live ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/80'}`}>{live ? `● ${d.status.detail}` : d.status.detail}</span>
          <span className="mt-2 text-[11px] uppercase tracking-widest text-white/40">{d.venue}</span>
        </div>
        <HeroSide d={d} side="away" />
      </div>
    </header>
  );
}

function Pitch({ d }) {
  const dots = spots(d, 'landscape', 0.93);
  return (
    <section>
      <h3 className="mb-2 px-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">On the pitch</h3>
      <div className="relative mx-5 overflow-hidden rounded-lg" style={{ aspectRatio: '2 / 1', background: 'repeating-linear-gradient(90deg, #1d5a35 0 8.33%, #226a3d 8.33% 16.66%)' }}>
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth=".5" aria-hidden="true">
          <rect x="1" y="1" width="198" height="98" /><path d="M100 1v98" /><circle cx="100" cy="50" r="10" />
          <rect x="1" y="26" width="16" height="48" /><rect x="183" y="26" width="16" height="48" />
        </svg>
        {dots.map(({ side, p, left, top, f }) => (
          <div key={`${side}${p.name}`} className="absolute flex w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${left}%`, top: `${top}%` }}>
            <div className="relative">
              <Shirt color={colorOf(d, side)} number={p.jersey} size={34} dim={p.subbedOut} />
              {f.goals > 0 && <span className="absolute -right-1.5 -top-1"><Ball size={13} /></span>}
              {(f.yellow || f.red) && <span className="absolute -left-1 -top-0.5 h-3 w-2 rounded-[1px]" style={{ background: f.red ? '#e5372b' : '#f2c200' }} />}
            </div>
            <span className="mt-0.5 max-w-full truncate rounded bg-black/55 px-1 text-[10px] font-semibold leading-tight text-white">{surname(p.name)}</span>
          </div>
        ))}
      </div>
      <div className="mx-5 mt-3 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {['home', 'away'].map((side) => {
          const on = d.lineups?.[side]?.bench.filter((b) => b.subbedIn) || [];
          const off = d.lineups?.[side]?.bench.filter((b) => !b.subbedIn) || [];
          return (
            <div key={side} className="rounded-lg bg-white/[0.04] px-3 pb-2 pt-2.5">
              <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-white/40">{d[side].name} bench</div>
              <div className="flex flex-wrap gap-x-2 gap-y-1.5 border-b-[5px] border-[#6b4a2b] pb-1">
                {[...on, ...off].map((b) => (
                  <div key={b.name} className="flex w-11 flex-col items-center" title={`${b.jersey} ${b.name}${b.subbedIn ? ` (on ${b.inMin}')` : ''}`}>
                    <Shirt color={colorOf(d, side)} number={b.jersey} size={30} dim={!b.subbedIn} ring={b.subbedIn} />
                    <span className="max-w-full truncate text-[9.5px] text-white/65">{surname(b.name)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Tug({ d }) {
  const rows = (d.stats || []).filter((s) => !/red/i.test(s.label));
  if (!rows.length) return null;
  const val = (v) => parseFloat(v) || 0;
  return (
    <section className="px-5">
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Tug of war</h3>
      <div className="space-y-3">
        {rows.map((s) => {
          const h = val(s.home), a = val(s.away), total = h + a || 1;
          const hp = (h / total) * 100;
          return (
            <div key={s.name}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className={`font-mono font-bold ${h >= a ? 'text-white' : 'text-white/50'}`}>{s.home}</span>
                <span className="text-[11.5px] uppercase tracking-wider text-white/55">{s.label}</span>
                <span className={`font-mono font-bold ${a >= h ? 'text-white' : 'text-white/50'}`}>{s.away}</span>
              </div>
              <div className="relative flex h-3 overflow-hidden rounded-full bg-white/10">
                <div style={{ width: `${hp}%`, background: colorOf(d, 'home') }} />
                <div className="flex-1" style={{ background: colorOf(d, 'away') }} />
                <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${hp}%` }}><Ball size={16} /></span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function KitRoom({ d }) {
  return (
    <div className="space-y-6 rounded-2xl pb-6 text-white" style={{ background: BG }}>
      <Hero d={d} />
      <Pitch d={d} />
      <Tug d={d} />
    </div>
  );
}
