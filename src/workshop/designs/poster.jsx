import { useState } from 'react';
import { surname, numOf, kindOf, flagsOf, layoutTeam, onColor } from '../matchData.js';

// D. Matchday poster: neo-brutalist. Electric-blue field, flat team-colour blocks (taken from the
// teams' own colours), thick black outlines, hard offset shadows, chunky type. Loud on purpose.

const BLUE = '#2b3bff';
const BLACK = '#0a0a0a';
const PINK = '#ff5fa8';
const GREEN = '#37d67a';
const head = { fontFamily: "'Archivo Black', 'Arial Black', Impact, sans-serif" };
const mono = { fontFamily: "'Space Mono', ui-monospace, Menlo, monospace" };
const BOX = 'border-[3px] border-black shadow-[5px_5px_0_#000]';

const colorOf = (d, side) => d[side].color || (side === 'home' ? '#ffd400' : '#00c2a8');

// a label stuck on the corner of a card
const Tag = ({ children, tilt = -2, bg = PINK }) => (
  <span className="absolute -top-3.5 left-3 z-10 border-[3px] border-black px-2.5 py-0.5 text-[13px] uppercase leading-tight text-black" style={{ ...head, background: bg, transform: `rotate(${tilt}deg)` }}>{children}</span>
);
const Card = ({ title, tilt, children, className = '' }) => (
  <section className={`relative min-w-0 bg-white p-4 pt-6 ${BOX} ${className}`}>
    <Tag tilt={tilt}>{title}</Tag>
    {children}
  </section>
);
const Empty = ({ children }) => <p className="border-[3px] border-dashed border-black px-3 py-5 text-center text-xs font-bold uppercase" style={mono}>{children}</p>;

function Glyph({ kind, size = 18 }) {
  const s = { width: size, height: size, flexShrink: 0 };
  switch (kind) {
    case 'goal': return <svg viewBox="0 0 16 16" style={s} aria-hidden="true"><circle cx="8" cy="8" r="7" fill={BLACK} /><path d="m8 4.4 2.5 1.8-1 2.9H6.5l-1-2.9L8 4.4Z" fill="#fff" /></svg>;
    case 'yellow': return <svg viewBox="0 0 16 16" style={s} aria-hidden="true"><rect x="3.5" y="1.5" width="9" height="13" rx="1" fill="#ffe14d" stroke={BLACK} strokeWidth="1.8" /></svg>;
    case 'red': return <svg viewBox="0 0 16 16" style={s} aria-hidden="true"><rect x="3.5" y="1.5" width="9" height="13" rx="1" fill="#ff3b30" stroke={BLACK} strokeWidth="1.8" /></svg>;
    case 'miss': return <svg viewBox="0 0 16 16" style={s} aria-hidden="true"><path d="m3 3 10 10m0-10L3 13" stroke={BLACK} strokeWidth="3" strokeLinecap="square" fill="none" /></svg>;
    default: return <svg viewBox="0 0 16 16" style={s} aria-hidden="true"><circle cx="8" cy="8" r="3.5" fill={BLACK} /></svg>;
  }
}

// ---------------------------------------------------------------------------------------------
function ScoreBlock({ d, side }) {
  const c = colorOf(d, side);
  const ink = onColor(c);
  const scorers = d.timeline.filter((e) => e.side === side && e.scoring);
  const scheduled = d.status.state === 'scheduled';
  return (
    <div className={`relative flex min-h-[210px] flex-col justify-between p-4 ${side === 'away' ? 'items-end text-right' : ''} ${BOX}`} style={{ background: c, color: ink }}>
      <span className={`${side === 'away' ? 'self-end' : 'self-start'} border-[3px] border-black bg-black px-2 py-0.5 text-sm uppercase text-white`} style={head}>{d[side].name}</span>
      <div className="leading-[0.85]" style={{ ...head, fontSize: 'clamp(90px, 15vw, 150px)' }}>{scheduled ? '–' : d[side].score}</div>
      <div className={`flex min-h-[26px] flex-wrap gap-1.5 ${side === 'away' ? 'justify-end' : ''}`}>
        {scorers.map((e) => (
          <span key={e.id} className="inline-flex items-center gap-1.5 border-[3px] border-black bg-white px-1.5 py-0.5 text-xs font-bold uppercase text-black" style={mono}>
            <Glyph kind="goal" size={13} />{surname(e.player)} {e.clock}
          </span>
        ))}
      </div>
    </div>
  );
}

function Hero({ d }) {
  const live = d.status.state === 'live';
  const scheduled = d.status.state === 'scheduled';
  return (
    <div className="relative grid grid-cols-2 gap-5">
      <ScoreBlock d={d} side="home" />
      <ScoreBlock d={d} side="away" />
      <span
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 border-[3px] border-black px-3 py-1.5 text-center text-lg uppercase leading-none text-black shadow-[4px_4px_0_#000]"
        style={{ ...head, background: live ? PINK : '#fff', transform: 'translate(-50%,-50%) rotate(-4deg)' }}
      >
        {scheduled ? <>Kick-off<br />{d.status.detail}</> : live ? <>Live<br />{d.status.detail}</> : <>Full<br />time</>}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Minute grid: 6 rows of 15 minutes. Goals, cards and misses fill their cell with the team's colour;
// substitutions are a dot. Stoppage-time incidents sit in the cell of the minute they follow.
const baseMin = (e) => Number(String(e.clock).match(/^\d+/)?.[0] ?? e.min);

function MinuteGrid({ d }) {
  const live = d.status.state === 'live';
  const now = live ? Math.floor(d.status.clockSeconds / 60) : 90;
  const byMin = {};
  for (const e of d.timeline) (byMin[Math.min(90, baseMin(e))] ||= []).push(e);
  if (d.status.state === 'scheduled') return <Empty>The grid fills in minute by minute once the game starts.</Empty>;

  return (
    <div>
      <div className="space-y-1.5">
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div key={row} className={`grid items-center gap-1.5 ${row === 3 ? 'mt-4' : ''}`} style={{ gridTemplateColumns: '2.4rem repeat(15, minmax(0, 1fr))' }}>
            <span className="text-[10px] font-bold tabular-nums" style={mono}>{row * 15 + 1}'</span>
            {Array.from({ length: 15 }, (_, i) => {
              const m = row * 15 + i + 1;
              const evs = byMin[m] || [];
              const big = evs.find((e) => kindOf(e) !== 'sub');
              const sub = !big && evs[0];
              const e = big || sub;
              const future = m > now;
              const c = e ? colorOf(d, e.side) : null;
              return (
                <span
                  key={m}
                  title={evs.map((x) => `${x.clock} ${x.text}`).join('\n')}
                  className={`relative flex aspect-square items-center justify-center border-[2px] ${future ? 'border-dashed border-black/40 bg-transparent' : 'border-black bg-white'} ${m === now && live ? 'ring-[3px] ring-black ring-offset-2 ring-offset-white' : ''}`}
                  style={big ? { background: c } : undefined}
                >
                  {big && <Glyph kind={kindOf(big)} size={18} />}
                  {sub && <span className="h-2 w-2 rounded-full border-2 border-black" style={{ background: c }} />}
                  {evs.length > 1 && <span className="absolute -right-1.5 -top-2 border-2 border-black bg-white px-0.5 text-[9px] font-bold leading-tight" style={mono}>{evs.length}</span>}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold uppercase" style={mono}>
        <span className="flex items-center gap-1.5"><Glyph kind="goal" size={14} />Goal</span>
        <span className="flex items-center gap-1.5"><Glyph kind="yellow" size={14} />Card</span>
        <span className="flex items-center gap-1.5"><Glyph kind="miss" size={14} />Miss</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border-2 border-black bg-black" />Sub</span>
        {['home', 'away'].map((s) => <span key={s} className="ml-auto flex items-center gap-1.5 first:ml-auto"><span className="h-3 w-3 border-2 border-black" style={{ background: colorOf(d, s) }} />{d[s].abbreviation}</span>)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Pitch: portrait, away team at the top attacking down, home at the bottom attacking up.
// Players are square tiles in the team colour; names sit on white tags.
function PitchLines() {
  const l = { fill: 'none', stroke: BLACK, strokeWidth: 3, vectorEffect: 'non-scaling-stroke' };
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 68 118" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="67" height="117" {...l} />
      <path d="M0.5 59h67" {...l} />
      <ellipse cx="34" cy="59" rx="9.15" ry="10.3" {...l} />
      <rect x="13.85" y="0.5" width="40.3" height="18.5" {...l} />
      <rect x="13.85" y="99" width="40.3" height="18.5" {...l} />
      <rect x="24.85" y="0.5" width="18.3" height="6" {...l} />
      <rect x="24.85" y="111.5" width="18.3" height="6" {...l} />
    </svg>
  );
}

function Tile({ d, side, item }) {
  const { p, x, y } = item;
  // squeeze each half a little towards its own goal so the forward lines don't collide at halfway
  const top = side === 'home' ? 100 - (6 + (x - 6) * 0.93) : 6 + ((100 - x) - 6) * 0.93;
  const c = colorOf(d, side);
  const f = flagsOf(d, p.name);
  return (
    <div className="absolute flex w-[84px] -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${y}%`, top: `${top}%` }}>
      <span
        className={`relative flex h-[32px] w-[32px] items-center justify-center border-[3px] border-black text-[13px] leading-none ${p.subbedOut ? 'border-dashed opacity-60' : 'shadow-[2px_2px_0_#000]'}`}
        style={{ ...head, background: c, color: onColor(c) }}
      >
        {p.jersey}
        {f.goals > 0 && <span className="absolute -right-3 -top-3 rounded-full border-2 border-black bg-white p-0.5"><Glyph kind="goal" size={12} /></span>}
        {(f.yellow || f.red) && <span className="absolute -left-3 -top-3"><Glyph kind={f.red ? 'red' : 'yellow'} size={15} /></span>}
        {p.subbedOut && <span className="absolute -bottom-2.5 -right-2.5 border-2 border-black bg-white px-0.5 text-[9px] font-bold leading-none text-black" style={mono}>↓</span>}
      </span>
      <span className="mt-1.5 max-w-full truncate border-2 border-black bg-white px-1 text-[10px] font-bold uppercase leading-tight text-black" style={mono}>{surname(p.name)}</span>
    </div>
  );
}

function PitchBoard({ d }) {
  if (!d.lineups) return <Empty>Lineups drop about an hour before kick-off.</Empty>;
  const home = layoutTeam(d.lineups.home, 'home');
  const away = layoutTeam(d.lineups.away, 'away');
  if (!home.length && !away.length) return <Empty>No formation data for this one.</Empty>;
  return (
    <div className="grid items-start gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <div className="relative mx-auto w-full max-w-[460px] border-[3px] border-black" style={{ aspectRatio: '68 / 118', background: GREEN }}>
        <PitchLines />
        <span className="absolute left-2 top-2 z-10 border-[3px] border-black px-1.5 text-[11px] font-bold uppercase" style={{ ...mono, background: colorOf(d, 'away'), color: onColor(colorOf(d, 'away')) }}>{d.away.abbreviation} · {d.lineups.away?.formation}</span>
        <span className="absolute bottom-2 left-2 z-10 border-[3px] border-black px-1.5 text-[11px] font-bold uppercase" style={{ ...mono, background: colorOf(d, 'home'), color: onColor(colorOf(d, 'home')) }}>{d.home.abbreviation} · {d.lineups.home?.formation}</span>
        {away.map((it) => <Tile key={`a${it.p.id}`} d={d} side="away" item={it} />)}
        {home.map((it) => <Tile key={`h${it.p.id}`} d={d} side="home" item={it} />)}
      </div>
      <div className="space-y-4">
        {['home', 'away'].map((side) => {
          const bench = d.lineups[side]?.bench || [];
          if (!bench.length) return null;
          return (
            <div key={side}>
              <div className="mb-1.5 inline-block border-[3px] border-black px-2 text-xs uppercase" style={{ ...head, background: colorOf(d, side), color: onColor(colorOf(d, side)) }}>{d[side].name} · bench</div>
              <div className="flex flex-wrap gap-1.5">
                {bench.map((b) => (
                  <span key={b.id} className={`border-[3px] border-black px-1.5 py-0.5 text-[11px] font-bold uppercase ${b.subbedIn ? 'bg-white' : 'border-dashed bg-transparent text-black/60'}`} style={mono}>
                    {b.subbedIn && <span className="mr-1">↑{b.inMin > 90 ? '90+' : b.inMin}'</span>}{surname(b.name)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
function StatBar({ d, s, tall }) {
  const [h, a] = [numOf(s.home) ?? 0, numOf(s.away) ?? 0];
  const hp = h + a > 0 ? (h / (h + a)) * 100 : 50;
  const pct = s.name === 'possessionPct';
  const [hc, ac] = [colorOf(d, 'home'), colorOf(d, 'away')];
  const fmt = (v) => (pct ? `${Math.round(numOf(v))}%` : v);
  return (
    <div>
      <div className="mb-1 text-[11px] font-bold uppercase" style={mono}>{s.label}</div>
      <div className={`flex border-[3px] border-black ${tall ? 'h-14 text-3xl' : 'h-9 text-lg'}`} style={head}>
        <div className="flex items-center pl-2" style={{ flexBasis: `${hp}%`, minWidth: tall ? 64 : 40, background: hc, color: onColor(hc) }}>{fmt(s.home)}</div>
        <div className="flex flex-1 items-center justify-end border-l-[3px] border-black pr-2" style={{ minWidth: tall ? 64 : 40, background: ac, color: onColor(ac) }}>{fmt(s.away)}</div>
      </div>
    </div>
  );
}

function StatsCard({ d }) {
  if (!d.stats.length) return <Empty>No stats yet. Wait for kick-off.</Empty>;
  const poss = d.stats.find((s) => s.name === 'possessionPct');
  return (
    <div className="space-y-3.5">
      {poss && <StatBar d={d} s={poss} tall />}
      {d.stats.filter((s) => s !== poss).map((s) => <StatBar key={s.name} d={d} s={s} />)}
    </div>
  );
}

function Versus({ d }) {
  if (!d.leaders.length) return <Empty>Top performers show up after kick-off.</Empty>;
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
      {d.leaders.map((c) => (
        <div key={c.label} className="border-[3px] border-black">
          <div className="border-b-[3px] border-black bg-black px-2 py-0.5 text-[11px] font-bold uppercase text-white" style={mono}>{c.label}</div>
          <div className="grid grid-cols-2">
            {[['home', c.home], ['away', c.away]].map(([side, [name, value]]) => (
              <div key={side} className={`px-2.5 py-2 ${side === 'away' ? 'border-l-[3px] border-black text-right' : ''}`} style={{ background: colorOf(d, side), color: onColor(colorOf(d, side)) }}>
                <div className="text-3xl leading-none" style={head}>{value}</div>
                <div className="mt-1 truncate text-[11px] font-bold uppercase" style={mono}>{surname(name)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Highlights({ d }) {
  const [subs, setSubs] = useState(false);
  const items = [...d.timeline].reverse().filter((e) => subs || kindOf(e) !== 'sub');
  if (!d.timeline.length) return <Empty>Nothing yet.</Empty>;
  return (
    <div>
      <ol className="space-y-2">
        {items.map((e) => {
          const kind = kindOf(e);
          const goal = kind === 'goal';
          const c = colorOf(d, e.side);
          return (
            <li key={e.id} className="flex items-stretch border-[3px] border-black">
              <span className="flex w-[4.5rem] shrink-0 items-center justify-center border-r-[3px] border-black text-lg" style={{ ...head, background: c, color: onColor(c) }}>{e.clock.replace(/'/g, '')}'</span>
              <span className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-2 ${goal ? 'bg-black text-white' : 'bg-white text-black'}`} style={mono}>
                <span className={goal ? 'rounded-full bg-white p-0.5' : ''}><Glyph kind={kind} size={goal ? 18 : 16} /></span>
                <span className={`min-w-0 truncate font-bold uppercase ${goal ? 'text-base' : 'text-xs'}`}>{e.player} · {e.label}</span>
              </span>
            </li>
          );
        })}
      </ol>
      {d.timeline.some((e) => kindOf(e) === 'sub') && (
        <button type="button" onClick={() => setSubs(!subs)} className="mt-3 border-[3px] border-black bg-white px-3 py-1 text-xs font-bold uppercase text-black shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none" style={mono}>
          {subs ? 'Hide subs −' : 'Show subs +'}
        </button>
      )}
    </div>
  );
}

export function Poster({ d }) {
  const chips = [d.venue && `${d.venue}${d.city ? `, ${d.city}` : ''}`, d.attendance && `${d.attendance.toLocaleString()} fans`, d.kickoffLabel, d.broadcasts?.[0]].filter(Boolean);
  return (
    <div className="space-y-9 border-[3px] border-black p-5 text-black sm:p-6" style={{ background: BLUE }}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="border-[3px] border-black bg-black px-2.5 py-1 text-sm uppercase text-white" style={head}>Match centre</span>
        <span className="border-[3px] border-black bg-white px-2 py-0.5 text-xs font-bold uppercase" style={mono}>ESPN · {d.updatedLabel}</span>
        <button type="button" className="ml-auto border-[3px] border-black bg-white px-3 py-1 text-xs font-bold uppercase text-black shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none" style={mono}>Refresh</button>
      </div>

      <Hero d={d} />

      <div className="flex flex-wrap gap-2">
        {chips.map((c) => <span key={c} className="border-[3px] border-black bg-white px-2.5 py-1 text-xs font-bold uppercase text-black" style={mono}>{c}</span>)}
      </div>

      <Card title="Minute by minute" tilt={-2}><MinuteGrid d={d} /></Card>
      <Card title="Lineups" tilt={1.5}><PitchBoard d={d} /></Card>
      <div className="grid items-start gap-9" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Card title="The numbers" tilt={-1.5}><StatsCard d={d} /></Card>
        <div className="min-w-0 space-y-9">
          <Card title="Top performers" tilt={2}><Versus d={d} /></Card>
          <Card title="Highlights" tilt={-1}><Highlights d={d} /></Card>
        </div>
      </div>
    </div>
  );
}
