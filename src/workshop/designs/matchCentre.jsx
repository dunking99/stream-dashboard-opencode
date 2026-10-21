import { useState } from 'react';
import { Crest } from '../../components/EventCard';
import { Programme } from './programme.jsx';
import { Poster } from './poster.jsx';
import { Ceefax } from './ceefax.jsx';
import { Plain } from './plain.jsx';
import { KitRoom } from './kitroom.jsx';
import { Territory } from './territory.jsx';
import { FINISHED, LIVE, PRE, surname, numOf, kindOf, flagsOf, layoutTeam } from '../matchData.js';

// Match centre ideas: less text and rules, more picture. The lineup is a pitch map, the timeline is
// drawn along a 90-minute axis, stats are mirrored bars, and the feed keeps only the moments that
// matter. The mock data has the same shape as /api/event-detail (providers/espnDetail.js), so a
// chosen variant can be dropped into MatchCentre.jsx without touching the backend.

const TONE = {
  home: { bg: 'bg-accent', text: 'text-accent', soft: 'bg-accent/15', ring: 'ring-accent', dot: 'bg-accent' },
  away: { bg: 'bg-amber', text: 'text-amber', soft: 'bg-amber/15', ring: 'ring-amber', dot: 'bg-amber' },
};

// ---------------------------------------------------------------------------------------------
// Small shared pieces
const Empty = ({ children }) => <div className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-xs text-muted">{children}</div>;

const Section = ({ title, aside, children }) => (
  <section className="min-w-0 rounded-xl border border-line bg-ink-850/50 p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="label">{title}</h3>
      {aside}
    </div>
    {children}
  </section>
);

const TeamKey = ({ d }) => (
  <div className="flex items-center gap-3 text-[11px] text-muted">
    {['home', 'away'].map((s) => (
      <span key={s} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${TONE[s].dot}`} />{d[s].abbreviation || d[s].name}</span>
    ))}
  </div>
);

// one little picture per kind of incident
function EventIcon({ kind, size = 14 }) {
  const s = { width: size, height: size };
  switch (kind) {
    case 'goal':
      return <svg viewBox="0 0 16 16" style={s} aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#fff" /><path d="m8 4.6 2.4 1.7-.9 2.8H6.5l-.9-2.8L8 4.6Z" fill="#0b1118" /></svg>;
    case 'yellow':
      return <svg viewBox="0 0 16 16" style={s} aria-hidden="true"><rect x="3.5" y="1.5" width="9" height="13" rx="1.6" fill="#f5c84b" /></svg>;
    case 'red':
      return <svg viewBox="0 0 16 16" style={s} aria-hidden="true"><rect x="3.5" y="1.5" width="9" height="13" rx="1.6" fill="#ff5d6c" /></svg>;
    case 'sub':
      return <svg viewBox="0 0 16 16" style={s} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 13V3m0 0L2.5 5.5M5 3l2.5 2.5" stroke="#54d9a4" /><path d="M11 3v10m0 0 2.5-2.5M11 13l-2.5-2.5" stroke="#ff5d6c" /></svg>;
    case 'miss':
      return <svg viewBox="0 0 16 16" style={s} fill="none" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6.4" stroke="#ff5d6c" strokeWidth="1.4" /><path d="m5.6 5.6 4.8 4.8m0-4.8-4.8 4.8" stroke="#ff5d6c" /></svg>;
    default:
      return <svg viewBox="0 0 16 16" style={s} aria-hidden="true"><circle cx="8" cy="8" r="3" fill="#8ea1b5" /></svg>;
  }
}

const ICONS = {
  pin: 'M10 18s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Zm0-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  people: 'M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6.5-.5a2.5 2.5 0 1 0 0-5M2 17c0-3 2.2-5 5-5s5 2 5 5m1-5c2.5 0 5 1.5 5 5',
  clock: 'M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-12v4l2.5 2',
  tv: 'M3 6h14v9H3zM7 3l3 3 3-3',
};
const Chip = ({ icon, children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-gray-300">
    <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true"><path d={ICONS[icon]} /></svg>
    {children}
  </span>
);

function InfoStrip({ d }) {
  return (
    <div className="flex flex-wrap gap-2">
      {d.venue && <Chip icon="pin">{d.venue}{d.city ? `, ${d.city}` : ''}</Chip>}
      {d.attendance && <Chip icon="people">{d.attendance.toLocaleString()}</Chip>}
      <Chip icon="clock">{d.kickoffLabel}</Chip>
      {d.broadcasts?.length > 0 && <Chip icon="tv">{d.broadcasts.join(', ')}</Chip>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Scoreboard: crests, big score, and who scored underneath each side
function HeroSide({ d, side }) {
  const t = d[side];
  const right = side === 'home';
  const scorers = d.timeline.filter((e) => e.side === side && e.scoring);
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${right ? 'items-end text-right' : 'items-start text-left'}`}>
      <div className={`flex min-w-0 items-center gap-3 ${right ? 'flex-row-reverse' : ''}`}>
        <Crest src={t.logo} name={t.name} size={44} />
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-gray-100">{t.name}</div>
          <div className={`h-0.5 w-8 rounded-full ${TONE[side].bg} ${right ? 'ml-auto' : ''}`} />
        </div>
      </div>
      <ul className="space-y-0.5 text-xs text-gray-300">
        {scorers.map((e) => (
          <li key={e.id} className={`flex items-center gap-1.5 ${right ? 'flex-row-reverse' : ''}`}>
            <EventIcon kind="goal" size={12} />{surname(e.player)} <span className="tabular text-muted">{e.clock}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Hero({ d }) {
  const live = d.status.state === 'live';
  const scheduled = d.status.state === 'scheduled';
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 px-5 py-5">
      <HeroSide d={d} side="home" />
      <div className="pt-1 text-center">
        {scheduled ? (
          <>
            <div className="font-display text-3xl font-semibold text-gray-300">vs</div>
            <div className="mt-1 text-xs text-muted">{d.status.detail}</div>
          </>
        ) : (
          <>
            <div className="font-display text-5xl font-bold leading-none text-white tabular">
              {d.home.score}<span className="mx-2 text-muted/50">:</span>{d.away.score}
            </div>
            <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${live ? 'bg-live/15 text-live' : 'bg-ink-700 text-muted'}`}>
              {live && <span className="h-1.5 w-1.5 rounded-full bg-live motion-safe:animate-pulse" aria-hidden="true" />}
              {d.status.detail}
            </div>
          </>
        )}
      </div>
      <HeroSide d={d} side="away" />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Match flow: the incidents laid along a minute axis; home above the line, away below.
// Incidents of one kind within two minutes of each other become one icon with a count.
function MatchFlow({ d }) {
  const events = d.timeline.filter((e) => e.side);
  if (!events.length) return <Empty>The match flow fills in once the game kicks off.</Empty>;

  const axisMax = Math.max(96, ...events.map((e) => e.min + 3));
  const nowMin = d.status.state === 'live' ? d.status.clockSeconds / 60 : null;
  const SIDE = 64; // room for icons above / below the axis
  const AXIS = SIDE + 11;
  const pct = (m) => Math.min(98, Math.max(2, (m / axisMax) * 100));

  const clusters = [];
  for (const e of events) {
    const kind = kindOf(e);
    const hit = clusters.find((c) => c.side === e.side && c.kind === kind && Math.abs(c.min - e.min) <= 2);
    if (hit) hit.items.push(e); else clusters.push({ side: e.side, kind, min: e.min, items: [e] });
  }
  clusters.forEach((c, i) => {
    c.lane = Math.min(1, clusters.slice(0, i).filter((o) => o.side === c.side && Math.abs(o.min - c.min) < 4).length);
  });

  return (
    <div className="relative" style={{ height: SIDE * 2 + 22 }} role="img" aria-label="Match incidents by minute">
      <div className="absolute inset-x-0 h-px bg-line" style={{ top: AXIS }} />
      <div className="absolute inset-y-0 border-l border-dashed border-line" style={{ left: `${pct(45)}%` }} />
      {[0, 15, 30, 45, 60, 75, 90].map((t) => (
        <span key={t} className="absolute -translate-x-1/2 -translate-y-1/2 bg-ink-850 px-1 text-[10px] text-muted tabular" style={{ left: `${pct(t)}%`, top: AXIS }}>
          {t === 45 ? 'HT' : `${t}'`}
        </span>
      ))}
      {nowMin !== null && (
        <div className="absolute inset-y-0 border-l-2 border-live" style={{ left: `${pct(nowMin)}%` }}>
          <span className="absolute -top-0.5 left-1 rounded bg-live px-1 text-[9px] font-bold text-ink-950">NOW</span>
        </div>
      )}
      {clusters.map((c, i) => {
        const off = 26 + c.lane * 28;
        const cy = c.side === 'home' ? AXIS - off : AXIS + off;
        return (
          <div key={i}>
            <div className="absolute w-px bg-line" style={{ left: `${pct(c.min)}%`, top: Math.min(AXIS, cy), height: Math.abs(cy - AXIS) }} />
            <div
              className={`absolute flex h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink-900 ring-2 ${TONE[c.side].ring}`}
              style={{ left: `${pct(c.min)}%`, top: cy }}
              title={c.items.map((e) => e.text).join('\n')}
            >
              <EventIcon kind={c.kind} size={15} />
              {c.items.length > 1 && <span className="absolute -right-1.5 -top-1.5 rounded-full bg-ink-700 px-1 text-[9px] font-bold text-gray-100">{c.items.length}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Pitch map: both XIs on one pitch, home attacking right. Rows come from the formation string
// ("4-2-3-1") and the players' formationPlace order; L / R in the position code sets left-right.
const L = { vectorEffect: 'non-scaling-stroke' };
function PitchLines() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 105 68" preserveAspectRatio="none" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" aria-hidden="true">
      <rect x="0.5" y="0.5" width="104" height="67" {...L} />
      <path d="M52.5 0.5v67" {...L} />
      <circle cx="52.5" cy="34" r="9.15" {...L} />
      <rect x="0.5" y="13.85" width="16.5" height="40.3" {...L} />
      <rect x="88" y="13.85" width="16.5" height="40.3" {...L} />
      <rect x="0.5" y="24.85" width="5.5" height="18.3" {...L} />
      <rect x="99" y="24.85" width="5.5" height="18.3" {...L} />
    </svg>
  );
}

function Marker({ d, side, item }) {
  const { p, x, y } = item;
  const f = flagsOf(d, p.name);
  return (
    <div className="absolute flex w-[72px] -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${x}%`, top: `${y}%` }} title={`${p.jersey} ${p.name}${p.position ? ` (${p.position})` : ''}`}>
      <div className={`relative flex h-[30px] w-[30px] items-center justify-center rounded-full text-[12px] font-bold text-ink-950 shadow-md ring-2 ring-black/30 ${TONE[side].bg} ${p.subbedOut ? 'opacity-60' : ''}`}>
        {p.jersey}
        {f.goals > 0 && <span className="absolute -right-2 -top-2 flex items-center rounded-full bg-ink-900 p-0.5"><EventIcon kind="goal" size={13} />{f.goals > 1 && <span className="px-0.5 text-[9px] font-bold text-white">{f.goals}</span>}</span>}
        {f.yellow && !f.red && <span className="absolute -left-2 -top-2"><EventIcon kind="yellow" size={13} /></span>}
        {f.red && <span className="absolute -left-2 -top-2"><EventIcon kind="red" size={13} /></span>}
        {p.subbedOut && <span className="absolute -bottom-1.5 -right-2 rounded-full bg-ink-900 p-0.5 text-[9px] font-bold leading-none text-live">↓</span>}
      </div>
      <span className="mt-1 max-w-full truncate text-[11px] font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">{surname(p.name)}</span>
    </div>
  );
}

function Bench({ d, side }) {
  const bench = d.lineups[side]?.bench || [];
  if (!bench.length) return null;
  return (
    <div className="min-w-0">
      <div className="label mb-1.5 flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${TONE[side].dot}`} />{d[side].name} bench</div>
      <div className="flex flex-wrap gap-1.5">
        {bench.map((p) => (
          <span key={p.id} className={`inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[11px] ${p.subbedIn ? 'text-gray-100' : 'text-muted'}`}>
            <span className="tabular text-muted">{p.jersey}</span>{surname(p.name)}
            {p.subbedIn && <span className="font-semibold text-mint">↑{p.inMin ? ` ${p.inMin > 90 ? '90+' : p.inMin}'` : ''}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function PitchMap({ d }) {
  if (!d.lineups) return <Empty>Lineups haven’t been announced yet.</Empty>;
  const home = layoutTeam(d.lineups.home, 'home');
  const away = layoutTeam(d.lineups.away, 'away');
  if (!home.length && !away.length) return <Empty>Formation isn’t available for this match.</Empty>;
  return (
    <div className="space-y-3">
      <div className="relative w-full overflow-hidden rounded-xl border border-line" style={{ aspectRatio: '105 / 68', background: 'repeating-linear-gradient(90deg,#10302a 0 9.52%,#0e2a25 9.52% 19.05%)' }}>
        <PitchLines />
        <span className={`absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${TONE.home.soft} ${TONE.home.text}`}>{d.home.name} · {d.lineups.home?.formation}</span>
        <span className={`absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${TONE.away.soft} ${TONE.away.text}`}>{d.away.name} · {d.lineups.away?.formation}</span>
        {home.map((it) => <Marker key={`h${it.p.id}`} d={d} side="home" item={it} />)}
        {away.map((it) => <Marker key={`a${it.p.id}`} d={d} side="away" item={it} />)}
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Bench d={d} side="home" />
        <Bench d={d} side="away" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Stats: possession as one big split bar, everything else as mirrored bars
function Possession({ stat }) {
  const [h, a] = [numOf(stat.home) ?? 0, numOf(stat.away) ?? 0];
  const hp = h + a > 0 ? (h / (h + a)) * 100 : 50;
  return (
    <div>
      <div className="flex items-end justify-between">
        <span className={`font-display text-4xl font-semibold leading-none tabular ${TONE.home.text}`}>{Math.round(h)}<span className="text-lg">%</span></span>
        <span className="pb-1 text-xs text-muted">Possession</span>
        <span className={`font-display text-4xl font-semibold leading-none tabular ${TONE.away.text}`}>{Math.round(a)}<span className="text-lg">%</span></span>
      </div>
      <div className="mt-2.5 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        <span className={`rounded-l-full ${TONE.home.bg}`} style={{ width: `${hp}%` }} />
        <span className={`flex-1 rounded-r-full ${TONE.away.bg}`} />
      </div>
    </div>
  );
}

function MirrorRow({ label, home, away }) {
  const [hv, av] = [numOf(home) ?? 0, numOf(away) ?? 0];
  const max = Math.max(hv, av);
  const w = (v) => (max > 0 && v > 0 ? Math.max(4, (v / max) * 100) : 0);
  const lead = hv === av ? null : hv > av ? 'home' : 'away';
  const num = (side, v) => <span className={`tabular text-sm font-semibold ${lead === side || !lead ? 'text-white' : 'text-muted'}`}>{v ?? '–'}</span>;
  return (
    <div className="py-1.5">
      <div className="grid grid-cols-[3rem_1fr_3rem] items-baseline gap-2">
        <span className="text-right">{num('home', home)}</span>
        <span className="text-center text-xs text-muted">{label}</span>
        <span>{num('away', away)}</span>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1">
        <div className="flex h-1.5 justify-end overflow-hidden rounded-full bg-ink-700"><span className={`h-full rounded-full ${TONE.home.bg} ${lead === 'away' ? 'opacity-50' : ''}`} style={{ width: `${w(hv)}%` }} /></div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-ink-700"><span className={`h-full rounded-full ${TONE.away.bg} ${lead === 'home' ? 'opacity-50' : ''}`} style={{ width: `${w(av)}%` }} /></div>
      </div>
    </div>
  );
}

function TeamStats({ d, limit }) {
  const [open, setOpen] = useState(false);
  if (!d.stats.length) return <Empty>Team stats appear once the match starts.</Empty>;
  const poss = d.stats.find((s) => s.name === 'possessionPct');
  const rest = d.stats.filter((s) => s !== poss);
  const shown = limit && !open ? rest.slice(0, limit) : rest;
  return (
    <div>
      {poss && <div className="mb-3"><Possession stat={poss} /></div>}
      <div className="divide-y divide-line/50">{shown.map((s) => <MirrorRow key={s.name} label={s.label} home={s.home} away={s.away} />)}</div>
      {limit && rest.length > limit && (
        <button type="button" onClick={() => setOpen(!open)} className="mt-2 text-xs font-semibold text-accent hover:underline">{open ? 'Show fewer' : `Show all ${rest.length}`}</button>
      )}
    </div>
  );
}

// top performers: the leader of each team side by side
function PerformerCell({ side, name, value }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${side === 'home' ? 'flex-row-reverse text-right' : ''}`}>
      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-bold tabular ${TONE[side].soft} ${TONE[side].text}`}>{value}</span>
      <span className="truncate text-xs text-gray-200">{surname(name)}</span>
    </div>
  );
}

function Performers({ d }) {
  if (!d.leaders.length) return <Empty>Top performers appear once the match starts.</Empty>;
  return (
    <ul className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 gap-y-2.5">
      {d.leaders.map((c) => (
        <li key={c.label} className="contents">
          <PerformerCell side="home" name={c.home[0]} value={c.home[1]} />
          <span className="text-center text-[10px] uppercase tracking-wide text-muted">{c.label}</span>
          <PerformerCell side="away" name={c.away[0]} value={c.away[1]} />
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------------------------
// Key moments: goals, cards and misses first; substitutions are one click away
function Moments({ d }) {
  const [all, setAll] = useState(false);
  const items = [...d.timeline].reverse().filter((e) => all || kindOf(e) !== 'sub');
  return (
    <div>
      {items.length === 0 ? <Empty>Nothing has happened yet.</Empty> : (
        <ol className="space-y-1.5">
          {items.map((e) => {
            const kind = kindOf(e);
            const big = kind === 'goal';
            return (
              <li key={e.id} className={`grid grid-cols-[3.5rem_1.25rem_1fr] items-center gap-2.5 rounded-lg px-3 py-2 ${big ? TONE[e.side].soft : 'bg-ink-850/60'}`}>
                <span className={`font-mono text-xs font-semibold tabular ${TONE[e.side].text}`}>{e.clock}</span>
                <EventIcon kind={kind} size={16} />
                <span className="min-w-0 text-sm">
                  <span className={big ? 'font-semibold text-white' : 'text-gray-200'}>{e.player}</span>
                  <span className="text-muted"> · {e.label}{big ? '' : ` · ${e.team}`}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {d.timeline.some((e) => kindOf(e) === 'sub') && (
        <button type="button" onClick={() => setAll(!all)} className="mt-2 text-xs font-semibold text-accent hover:underline">{all ? 'Hide substitutions' : 'Show substitutions'}</button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
function Shell({ d, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink-900">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-100">Match centre</h2>
          <span className="chip">ESPN</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span className="hidden sm:inline">Updated {d.updatedLabel}</span>
          <button type="button" className="btn">Refresh</button>
        </div>
      </div>
      <Hero d={d} />
      {children}
    </div>
  );
}

const grid = (min) => ({ display: 'grid', gap: 16, gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` });

// A. One scroll: no tabs. Everything is a card; the cards wrap to the width they're given.
function OneScroll({ d }) {
  return (
    <Shell d={d}>
      <div className="space-y-4 border-t border-line p-4">
        <InfoStrip d={d} />
        <Section title="Match flow" aside={<TeamKey d={d} />}><MatchFlow d={d} /></Section>
        <Section title="Lineups" aside={<TeamKey d={d} />}><PitchMap d={d} /></Section>
        <div style={grid(320)}>
          <Section title="Team stats"><TeamStats d={d} limit={5} /></Section>
          <div className="min-w-0 space-y-4">
            <Section title="Top performers"><Performers d={d} /></Section>
            <Section title="Key moments"><Moments d={d} /></Section>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// B. Visual tabs: the same tab bar as today (easy to port), but each tab is a picture first.
const TABS = ['Overview', 'Lineups', 'Stats', 'Moments'];
function VisualTabs({ d }) {
  const [tab, setTab] = useState('Overview');
  return (
    <Shell d={d}>
      <div role="tablist" aria-label="Match details" className="flex gap-1 overflow-x-auto border-y border-line px-2">
        {TABS.map((name) => (
          <button key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => setTab(name)}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold transition ${tab === name ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-gray-200'}`}>
            {name}
          </button>
        ))}
      </div>
      <div className="space-y-4 p-4" role="tabpanel">
        {tab === 'Overview' && (
          <>
            <InfoStrip d={d} />
            <Section title="Match flow" aside={<TeamKey d={d} />}><MatchFlow d={d} /></Section>
            <div style={grid(320)}>
              <Section title="At a glance"><TeamStats d={d} limit={3} /></Section>
              <Section title="Key moments"><Moments d={d} /></Section>
            </div>
          </>
        )}
        {tab === 'Lineups' && <PitchMap d={d} />}
        {tab === 'Stats' && (
          <div style={grid(320)}>
            <Section title="Team stats"><TeamStats d={d} /></Section>
            <Section title="Top performers"><Performers d={d} /></Section>
          </div>
        )}
        {tab === 'Moments' && <Moments d={d} />}
      </div>
    </Shell>
  );
}

export default {
  id: 'match-centre',
  title: 'Match centre',
  blurb: 'The ESPN panel under the video: score, lineups, incidents and stats.',
  defaultWidth: 'centre',
  scenarios: [
    { label: 'Finished (Al Nassr 1–0 Neom SC)', props: { d: FINISHED } },
    { label: 'Live, 62nd minute', props: { d: LIVE } },
    { label: 'Before kick-off (lineups only)', props: { d: PRE } },
  ],
  variants: [
    { id: 'A', name: 'One scroll', note: 'No tabs. Score with scorers, a minute-by-minute flow strip, the pitch map, mirrored stats and key moments, all as cards that wrap to the width.', Component: OneScroll },
    { id: 'B', name: 'Visual tabs', note: 'Keeps today’s tab bar so it’s a small step to port, but each tab leads with a picture: flow strip, pitch map, stat bars.', Component: VisualTabs },
    { id: 'C', name: 'Matchday programme', note: 'Editorial: a printed programme. Warm paper, black and vermilion two-ink printing, a written headline, a running-order spine, one tactics sheet per team and isotype strips for the stats.', Component: Programme },
    { id: 'D', name: 'Matchday poster', note: 'Neo-brutalist: electric blue, flat team-colour blocks, thick outlines and hard shadows. A minute grid, one portrait pitch with square tiles, and versus cards. Colours come from each team.', Component: Poster },
    { id: 'E', name: 'Ceefax', note: 'A teletext page: 40 columns, the real eight colours, mosaic-block bars, a pitch drawn in characters. The coloured fastext buttons at the bottom are the tabs.', Component: Ceefax },
    { id: 'F', name: 'Plain', note: 'The sensible football app. Light, system type, one green accent, no boxes. Teams are a small shirt-colour square; the stat bars highlight whoever leads instead.', Component: Plain },
    { id: 'G', name: 'Kit room', note: 'Told with shirts. The score is printed on the back of each club’s shirt, the XI are shirts on the pitch, subs are shirts on the bench, and the stats are a tug of war in club colours.', Component: KitRoom },
    { id: 'H', name: 'Territory', note: 'The stats are drawn on a pitch: possession is who owns the grass, shots are balls piled in the goal they were aimed at (hollow = off target), corners are flags, cards sit underneath.', Component: Territory },
  ],
};
