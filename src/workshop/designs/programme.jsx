import { surname, numOf, kindOf, flagsOf, layoutTeam } from '../matchData.js';

// C. Matchday programme: the match centre as a printed programme / newspaper match report.
// Warm paper, two-ink printing (black for the home side, vermilion for the away side), a serif
// headline, mono small-caps for data. Lineups are tactics-sheet line drawings, one per team.

const PAPER = '#f2ede2';
const TINT = '#e8e0cf';
const INK = '#1a1713';
const MUTED = '#6a6256';
const RED = '#c8381f';
const serif = { fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, serif" };
const mono = { fontFamily: "'IBM Plex Mono', ui-monospace, Menlo, monospace" };
const inkOf = (side) => (side === 'home' ? INK : RED);

// a headline written from the data, the way a sub-editor would
function headline(d) {
  const nb = (t) => ({ ...t, name: t.name.replace(/ /g, '\u00a0') }); // keep a team name on one line
  const [home, away] = [nb(d.home), nb(d.away)];
  const { status } = d;
  const [hs, as] = [home.score ?? 0, away.score ?? 0];
  if (status.state === 'scheduled') return `${home.name} host ${away.name}`;
  if (hs === as) return status.state === 'live' ? `${home.name} and ${away.name} level at ${hs}–${as}` : `${home.name} and ${away.name} share the spoils, ${hs}–${as}`;
  const [win, lose, winSide] = hs > as ? [home, away, 'home'] : [away, home, 'away'];
  if (status.state === 'live') return `${win.name} lead ${lose.name} ${Math.max(hs, as)}–${Math.min(hs, as)}`;
  const last = d.timeline.filter((e) => e.scoring && e.side === winSide).at(-1);
  return last ? `${surname(last.player)} settles it as ${win.name} beat ${lose.name}` : `${win.name} beat ${lose.name}`;
}

function standfirst(d) {
  const bits = [];
  if (d.venue) bits.push(`${d.status.state === 'scheduled' ? 'To be played' : 'Played'} at ${d.venue}${d.city ? `, ${d.city}` : ''}${d.attendance ? `, before ${d.attendance.toLocaleString()}` : ''}.`);
  const poss = d.stats.find((s) => s.name === 'possessionPct');
  const shots = d.stats.find((s) => s.name === 'totalShots');
  if (poss) bits.push(`${d.home.name} had ${Math.round(numOf(poss.home))}% of the ball`);
  if (poss && shots) bits[bits.length - 1] += ` and led ${shots.home}–${shots.away} on shots.`;
  else if (poss) bits[bits.length - 1] += '.';
  return bits.join(' ');
}

const Rule = ({ children, n }) => (
  <div className="mb-4 mt-9 border-t-[3px] pt-2" style={{ borderColor: INK }}>
    <h3 className="text-[11px] font-medium uppercase tracking-[0.22em]" style={mono}>{n} · {children}</h3>
  </div>
);

const Quiet = ({ children }) => <p className="py-4 text-[15px] italic leading-relaxed" style={{ ...serif, color: MUTED }}>{children}</p>;

// incident symbols, drawn in ink
function Glyph({ kind, size = 16 }) {
  const s = { width: size, height: size, flexShrink: 0 };
  const stroke = { fill: 'none', stroke: INK, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (kind) {
    case 'goal': return <svg viewBox="0 0 16 16" style={s} aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill={INK} /><circle cx="8" cy="8" r="2.4" fill={PAPER} /></svg>;
    case 'yellow': return <svg viewBox="0 0 16 16" style={s} aria-hidden="true"><rect x="4" y="1.8" width="8" height="12.4" rx="1" fill="#e7b800" stroke={INK} strokeWidth="1.2" /></svg>;
    case 'red': return <svg viewBox="0 0 16 16" style={s} aria-hidden="true"><rect x="4" y="1.8" width="8" height="12.4" rx="1" fill={RED} stroke={INK} strokeWidth="1.2" /></svg>;
    case 'miss': return <svg viewBox="0 0 16 16" style={s} aria-hidden="true"><circle cx="8" cy="8" r="6.4" {...stroke} /><path d="m5.5 5.5 5 5m0-5-5 5" {...stroke} /></svg>;
    default: return <svg viewBox="0 0 16 16" style={s} aria-hidden="true"><path d="M3 5.5h9m0 0L9.5 3M12 5.5 9.5 8M13 10.5H4m0 0L6.5 8M4 10.5 6.5 13" {...stroke} /></svg>;
  }
}

const KIND_NAME = { goal: 'Goal', yellow: 'Yellow card', red: 'Red card', miss: 'Penalty missed', sub: 'Substitution', other: 'Incident' };

// ---------------------------------------------------------------------------------------------
function Masthead({ d }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b-[3px] border-double pb-2 text-[11px] uppercase tracking-[0.2em]" style={{ ...mono, borderColor: INK }}>
      <span className="font-semibold">The Match Centre</span>
      <span className="hidden sm:inline" style={{ color: MUTED }}>{d.venue}{d.city ? ` · ${d.city}` : ''} · {d.kickoffLabel}</span>
      <span style={{ color: MUTED }}>ESPN · {d.updatedLabel}</span>
    </div>
  );
}

function Scoreline({ d }) {
  const live = d.status.state === 'live';
  const scheduled = d.status.state === 'scheduled';
  return (
    <div className="mt-6 grid items-end gap-x-6 gap-y-3" style={{ gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)' }}>
      <TeamBlock d={d} side="home" />
      <div className="text-center">
        {scheduled ? (
          <div className="text-5xl italic" style={{ ...serif, fontWeight: 400 }}>v</div>
        ) : (
          <div className="flex items-baseline justify-center gap-3 leading-none tabular-nums" style={{ ...serif, fontWeight: 800, fontSize: 'clamp(56px, 9vw, 104px)' }}>
            <span>{d.home.score}</span><span style={{ color: MUTED, fontWeight: 400 }}>–</span><span style={{ color: RED }}>{d.away.score}</span>
          </div>
        )}
        <div className="mt-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]" style={mono}>
          {live && <span className="h-2 w-2 rounded-full motion-safe:animate-pulse" style={{ background: RED }} aria-hidden="true" />}
          {scheduled ? `Kick-off ${d.status.detail}` : live ? `Live · ${d.status.detail}` : 'Full time'}
        </div>
      </div>
      <TeamBlock d={d} side="away" />
    </div>
  );
}

function TeamBlock({ d, side }) {
  const right = side === 'home';
  const scorers = d.timeline.filter((e) => e.side === side && e.scoring);
  return (
    <div className={right ? 'text-right' : 'text-left'}>
      <div className="text-2xl leading-tight" style={{ ...serif, fontWeight: 600, color: inkOf(side) }}>{d[side].name}</div>
      <ul className="mt-1 min-h-[1.5rem] text-[15px] italic" style={{ ...serif, color: MUTED }}>
        {scorers.map((e) => <li key={e.id}>{surname(e.player)} {e.clock}</li>)}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Running order: a centre spine of minutes; home to the left, away to the right
function RunningOrder({ d }) {
  const rows = d.timeline.filter((e) => kindOf(e) !== 'sub');
  const subs = (side) => d.timeline.filter((e) => e.side === side && kindOf(e) === 'sub').length;
  const live = d.status.state === 'live';
  if (!rows.length && !live) return <Quiet>The running order starts when the whistle goes.</Quiet>;
  return (
    <div>
      <ol className="relative" style={{ background: `linear-gradient(${INK},${INK}) center / 1px 100% no-repeat` }}>
        {rows.map((e) => {
          const kind = kindOf(e);
          const cell = (
            <div className={`py-2.5 ${e.side === 'home' ? 'text-right' : 'text-left'}`}>
              <div className={`flex items-center gap-2 ${e.side === 'home' ? 'flex-row-reverse' : ''}`}>
                <Glyph kind={kind} />
                <span className={`text-[17px] leading-tight ${kind === 'goal' ? 'font-extrabold' : ''}`} style={{ ...serif, fontWeight: kind === 'goal' ? 800 : 400, color: inkOf(e.side) }}>{e.player}</span>
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em]" style={{ ...mono, color: MUTED }}>{KIND_NAME[kind]}</div>
            </div>
          );
          return (
            <li key={e.id} className="grid items-center" style={{ gridTemplateColumns: '1fr 4.5rem 1fr' }}>
              {e.side === 'home' ? cell : <span />}
              <span className="mx-auto px-1.5 py-0.5 text-xs font-semibold tabular-nums" style={{ ...mono, background: PAPER, border: `1px solid ${INK}` }}>{e.clock.replace(/'/g, '')}</span>
              {e.side === 'away' ? cell : <span />}
            </li>
          );
        })}
        {live && (
          <li className="grid items-center py-2" style={{ gridTemplateColumns: '1fr 4.5rem 1fr' }}>
            <span />
            <span className="mx-auto px-1.5 py-0.5 text-xs font-bold tabular-nums text-white" style={{ ...mono, background: RED }}>{d.status.detail.replace(/'/g, '')}</span>
            <span className="pl-3 text-[11px] uppercase tracking-[0.2em]" style={{ ...mono, color: RED }}>Now</span>
          </li>
        )}
      </ol>
      {(subs('home') > 0 || subs('away') > 0) && (
        <p className="mt-3 text-center text-[13px] italic" style={{ ...serif, color: MUTED }}>
          Substitutions: {d.home.name} {subs('home')}, {d.away.name} {subs('away')}.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Team sheets: one tactics drawing per side, own goal at the bottom, attacking up
function SheetPitch() {
  const l = { fill: 'none', stroke: INK, strokeOpacity: 0.55, strokeWidth: 1, vectorEffect: 'non-scaling-stroke' };
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 68 84" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="67" height="83" {...l} />
      <path d="M0.5 31.5h67" {...l} />
      <path d="M24.85 31.5a9.15 9.15 0 0 0 18.3 0" {...l} />
      <rect x="13.85" y="67" width="40.3" height="16.5" {...l} />
      <rect x="24.85" y="78" width="18.3" height="5.5" {...l} />
      <path d="M26.7 67a9.15 9.15 0 0 1 14.6 0" {...l} />
      <circle cx="34" cy="72.5" r="0.5" fill={INK} fillOpacity="0.55" />
    </svg>
  );
}

function Sheet({ d, side }) {
  const lu = d.lineups?.[side];
  const items = layoutTeam(lu, side).map(({ p, x, y }) => {
    const depth = side === 'home' ? (x - 6) / 40 : (100 - x - 6) / 40; // 0 = goalkeeper, 1 = furthest forward
    return { p, px: side === 'home' ? y : 100 - y, py: 91 - depth * 64 };
  });
  const ink = inkOf(side);
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 border-b pb-1" style={{ borderColor: INK }}>
        <span className="text-xl" style={{ ...serif, fontWeight: 600, color: ink }}>{d[side].name}</span>
        <span className="text-sm tracking-[0.18em]" style={mono}>{lu?.formation?.replace(/-/g, '–')}</span>
      </div>
      {items.length === 0 ? <Quiet>No formation yet.</Quiet> : (
        <div className="relative mx-auto mt-3 w-full max-w-[420px]" style={{ aspectRatio: '68 / 84', background: TINT }}>
          <SheetPitch />
          {items.map(({ p, px, py }) => {
            const f = flagsOf(d, p.name);
            return (
              <div key={p.id} className="absolute flex w-[84px] -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${px}%`, top: `${py}%` }}>
                <span
                  className="relative flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-semibold tabular-nums"
                  style={{ ...mono, background: p.subbedOut ? PAPER : ink, color: p.subbedOut ? ink : PAPER, border: `1.5px solid ${ink}`, boxShadow: f.goals ? `0 0 0 2px ${TINT}, 0 0 0 3.5px ${INK}` : 'none' }}
                >
                  {p.jersey}
                  {f.yellow && <span className="absolute -left-2 -top-1.5"><Glyph kind="yellow" size={11} /></span>}
                  {f.red && <span className="absolute -left-2 -top-1.5"><Glyph kind="red" size={11} /></span>}
                </span>
                <span className={`mt-1 max-w-full truncate text-[12px] italic leading-none ${p.subbedOut ? 'line-through decoration-1' : ''}`} style={{ ...serif, color: p.subbedOut ? MUTED : INK }}>
                  {surname(p.name)}{f.goals ? ' ●' : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {lu?.bench?.some((b) => b.subbedIn) && (
        <p className="mt-3 text-[13px] leading-relaxed" style={serif}>
          <span className="mr-1.5 text-[10px] uppercase tracking-[0.18em]" style={{ ...mono, color: MUTED }}>Came on</span>
          {lu.bench.filter((b) => b.subbedIn).map((b, i) => (
            <span key={b.id}>{i > 0 && ', '}<span className="italic">{surname(b.name)}</span> <span className="tabular-nums" style={{ color: MUTED }}>{b.inMin > 90 ? '90+' : b.inMin}'</span></span>
          ))}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// By the numbers: big serif figures, and a row of 20 squares per stat (an isotype strip)
function Isotype({ home, away }) {
  const [h, a] = [numOf(home) ?? 0, numOf(away) ?? 0];
  const filled = h + a > 0 ? Math.round((h / (h + a)) * 20) : 0;
  const empty = h + a === 0;
  return (
    <div className="flex justify-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: 20 }, (_, i) => (
        <span key={i} className="h-2.5 w-2.5" style={empty ? { border: `1px solid ${MUTED}` } : { background: i < filled ? INK : RED }} />
      ))}
    </div>
  );
}

function Figures({ d }) {
  if (!d.stats.length) return <Quiet>The figures arrive with the first whistle.</Quiet>;
  const poss = d.stats.find((s) => s.name === 'possessionPct');
  const rest = d.stats.filter((s) => s !== poss);
  return (
    <div>
      {poss && (
        <div className="mb-5 text-center">
          <div className="flex items-baseline justify-center gap-4 leading-none tabular-nums" style={{ ...serif, fontWeight: 800, fontSize: 52 }}>
            <span>{Math.round(numOf(poss.home))}</span><span className="text-base font-normal italic" style={{ color: MUTED }}>per cent possession</span><span style={{ color: RED }}>{Math.round(numOf(poss.away))}</span>
          </div>
          <div className="mt-3 flex h-[6px]"><span style={{ background: INK, width: `${numOf(poss.home)}%` }} /><span className="flex-1" style={{ background: RED }} /></div>
        </div>
      )}
      <ul className="divide-y" style={{ borderColor: `${INK}33` }}>
        {rest.map((s) => {
          const lead = numOf(s.home) === numOf(s.away) ? null : numOf(s.home) > numOf(s.away) ? 'home' : 'away';
          return (
            <li key={s.name} className="grid items-center gap-3 py-2.5" style={{ gridTemplateColumns: '2.5rem 1fr 2.5rem', borderColor: `${INK}33` }}>
              <span className="text-right text-2xl tabular-nums" style={{ ...serif, fontWeight: lead === 'home' ? 800 : 400, color: lead === 'away' ? MUTED : INK }}>{s.home}</span>
              <div>
                <div className="mb-1.5 text-center text-[10px] uppercase tracking-[0.2em]" style={{ ...mono, color: MUTED }}>{s.label}</div>
                <Isotype home={s.home} away={s.away} />
              </div>
              <span className="text-2xl tabular-nums" style={{ ...serif, fontWeight: lead === 'away' ? 800 : 400, color: lead === 'home' ? MUTED : RED }}>{s.away}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Leaders({ d }) {
  if (!d.leaders.length) return <Quiet>No standout performers yet.</Quiet>;
  return (
    <ul className="space-y-3">
      {d.leaders.map((c) => (
        <li key={c.label} className="border-b border-dotted pb-2" style={{ borderColor: `${INK}55` }}>
          <div className="mb-0.5 text-center text-[10px] uppercase tracking-[0.2em]" style={{ ...mono, color: MUTED }}>{c.label}</div>
          <div className="flex items-baseline justify-between gap-4 text-[17px] italic" style={serif}>
            <span className="whitespace-nowrap">{surname(c.home[0])} <b className="not-italic tabular-nums">{c.home[1]}</b></span>
            <span className="whitespace-nowrap" style={{ color: RED }}>{surname(c.away[0])} <b className="not-italic tabular-nums">{c.away[1]}</b></span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Details({ d }) {
  const rows = [['Venue', d.venue], ['City', d.city], ['Attendance', d.attendance?.toLocaleString()], ['Kick-off', d.kickoffLabel], ['Broadcast', d.broadcasts?.join(', ')]].filter((r) => r[1]);
  return (
    <dl className="grid gap-x-8 gap-y-2 text-sm" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 border-b border-dotted pb-1" style={{ borderColor: INK }}>
          <dt className="text-[10px] uppercase tracking-[0.2em]" style={{ ...mono, color: MUTED }}>{k}</dt>
          <dd style={serif}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Programme({ d }) {
  return (
    <article className="px-6 py-5 sm:px-9 sm:py-7" style={{ background: PAPER, color: INK, border: `1px solid ${INK}`, ...serif }}>
      <Masthead d={d} />
      <h2 className="mt-7 text-balance text-[clamp(30px,5vw,50px)] leading-[1.05] tracking-tight" style={{ ...serif, fontWeight: 600 }}>{headline(d)}</h2>
      {standfirst(d) && <p className="mt-3 max-w-[60ch] text-[17px] italic leading-snug" style={{ color: MUTED }}>{standfirst(d)}</p>}
      <Scoreline d={d} />

      <Rule n="I">Running order</Rule>
      <RunningOrder d={d} />

      <Rule n="II">Team sheets</Rule>
      {d.lineups ? (
        <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <Sheet d={d} side="home" />
          <Sheet d={d} side="away" />
        </div>
      ) : <Quiet>Team sheets are published about an hour before kick-off.</Quiet>}

      <Rule n="III">By the numbers</Rule>
      <div className="grid gap-x-10 gap-y-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <Figures d={d} />
        <div>
          <h4 className="mb-3 text-[10px] uppercase tracking-[0.2em]" style={{ ...mono, color: MUTED }}>Leading performers</h4>
          <Leaders d={d} />
        </div>
      </div>

      <Rule n="IV">Match details</Rule>
      <Details d={d} />
    </article>
  );
}
