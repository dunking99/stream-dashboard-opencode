import { useState } from 'react';
import { surname, numOf, kindOf, flagsOf, layoutTeam, onColor } from '../matchData.js';

// F. Plain: the match centre the way a good, boring football app does it. Light, system type,
// one green accent used for "live" and "the leader", no boxes around things. Hierarchy comes
// from size, weight and whitespace; teams are told apart by their shirt colour, small.

const system = { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' };
const INK = '#161614';
const SUB = '#6b6b64';
const LINE = '#e4e4de';
const GREEN = '#0b7a3e';
const colorOf = (d, side) => d[side].color || '#888';

const Swatch = ({ color }) => <span className="inline-block h-3 w-3 shrink-0 rounded-[3px]" style={{ background: color }} aria-hidden="true" />;

function Mark({ kind }) {
  const s = { width: 14, height: 14, flexShrink: 0 };
  switch (kind) {
    case 'goal': return <svg viewBox="0 0 16 16" style={s} aria-label="Goal"><circle cx="8" cy="8" r="6.6" fill="#fff" stroke={INK} strokeWidth="1.4" /><path d="m8 4.7 2.3 1.7-.9 2.7H6.6l-.9-2.7L8 4.7Z" fill={INK} /></svg>;
    case 'yellow': return <svg viewBox="0 0 16 16" style={s} aria-label="Yellow card"><rect x="4" y="2" width="8" height="12" rx="1.2" fill="#f2c200" /></svg>;
    case 'red': return <svg viewBox="0 0 16 16" style={s} aria-label="Red card"><rect x="4" y="2" width="8" height="12" rx="1.2" fill="#d62d20" /></svg>;
    case 'miss': return <svg viewBox="0 0 16 16" style={s} aria-label="Missed penalty"><path d="m4 4 8 8m0-8-8 8" stroke="#d62d20" strokeWidth="1.8" strokeLinecap="round" /></svg>;
    default: return <svg viewBox="0 0 16 16" style={s} aria-label="Substitution" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13V3m0 0L2.8 5.2M5 3l2.2 2.2" stroke={GREEN} /><path d="M11 3v10m0 0 2.2-2.2M11 13l-2.2-2.2" stroke="#d62d20" /></svg>;
  }
}

const baseMin = (e) => Number(String(e.clock).match(/^\d+/)?.[0] ?? e.min);

// ---------------------------------------------------------------------------------------------
function Scoreboard({ d }) {
  const live = d.status.state === 'live';
  const scheduled = d.status.state === 'scheduled';
  const scorers = (side) => d.timeline.filter((e) => e.side === side && e.scoring);
  return (
    <header className="px-5 pb-4 pt-6">
      <div className="grid items-center gap-4" style={{ gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)' }}>
        <div className="flex min-w-0 items-center justify-end gap-2.5">
          <span className="truncate text-[17px] font-semibold">{d.home.name}</span><Swatch color={colorOf(d, 'home')} />
        </div>
        <div className="text-center">
          {scheduled ? <div className="text-[28px] font-semibold leading-none">{d.status.detail}</div> : (
            <div className="text-[40px] font-semibold leading-none tabular-nums">{d.home.score}<span className="px-2" style={{ color: SUB }}>–</span>{d.away.score}</div>
          )}
          <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[13px]" style={{ color: live ? GREEN : SUB }}>
            {live && <span className="h-1.5 w-1.5 rounded-full motion-safe:animate-pulse" style={{ background: GREEN }} />}
            {scheduled ? 'Kick-off' : live ? d.status.detail : 'Full time'}
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2.5">
          <Swatch color={colorOf(d, 'away')} /><span className="truncate text-[17px] font-semibold">{d.away.name}</span>
        </div>
      </div>
      {(scorers('home').length > 0 || scorers('away').length > 0) && (
        <div className="mt-3 grid gap-4 text-[13px]" style={{ gridTemplateColumns: '1fr 1fr', color: SUB }}>
          <ul className="text-right">{scorers('home').map((e) => <li key={e.id}>{surname(e.player)} {e.clock}</li>)}</ul>
          <ul>{scorers('away').map((e) => <li key={e.id}>{surname(e.player)} {e.clock}</li>)}</ul>
        </div>
      )}
    </header>
  );
}

function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="flex gap-6 border-b px-5" style={{ borderColor: LINE }}>
      {tabs.map((t) => (
        <button key={t} type="button" role="tab" aria-selected={value === t} onClick={() => onChange(t)}
          className="-mb-px border-b-2 py-2.5 text-[15px] font-medium" style={{ borderColor: value === t ? GREEN : 'transparent', color: value === t ? INK : SUB }}>
          {t}
        </button>
      ))}
    </div>
  );
}

const Quiet = ({ children }) => <p className="py-8 text-center text-[15px]" style={{ color: SUB }}>{children}</p>;

// ---------------------------------------------------------------------------------------------
function Summary({ d }) {
  const items = [];
  let half = false;
  for (const e of d.timeline) {
    if (!half && baseMin(e) > 45) { items.push({ sep: 'Half-time' }); half = true; }
    items.push(e);
  }
  if (!half && d.status.state !== 'scheduled' && (d.status.state === 'finished' || d.status.clockSeconds > 2700)) items.push({ sep: 'Half-time' });
  if (d.status.state === 'finished') items.push({ sep: 'Full time' });

  const info = [['Stadium', d.venue && `${d.venue}${d.city ? `, ${d.city}` : ''}`], ['Attendance', d.attendance?.toLocaleString()], ['Kick-off', d.kickoffLabel], ['TV', d.broadcasts?.join(', ')]].filter((r) => r[1]);
  return (
    <div className="px-5 pb-6">
      {items.length === 0 ? <Quiet>{d.status.state === 'scheduled' ? `Kick-off ${d.kickoffLabel}. Events appear here as they happen.` : 'Nothing has happened yet.'}</Quiet> : (
        <ol>
          {items.map((e, i) => e.sep ? (
            <li key={`s${i}`} className="py-2 text-center text-[12px] font-medium" style={{ color: SUB, borderBottom: `1px solid ${LINE}`, background: '#f3f3ee' }}>{e.sep}</li>
          ) : (() => {
            const kind = kindOf(e);
            const minor = kind === 'sub';
            return (
              <li key={e.id} className="grid items-center gap-3 border-b py-2.5 pl-3" style={{ gridTemplateColumns: '3rem 1rem 1fr', borderColor: LINE, borderLeft: `3px solid ${colorOf(d, e.side)}` }}>
                <span className="text-right text-[14px] tabular-nums" style={{ color: SUB }}>{e.clock}</span>
                <Mark kind={kind} />
                <span className="text-[15px]" style={{ color: minor ? SUB : INK }}>
                  <span className={kind === 'goal' ? 'font-semibold' : ''} style={{ color: minor ? SUB : INK }}>{e.player}</span>
                  <span style={{ color: SUB }}>{kind === 'goal' ? '' : ` · ${e.label}`}</span>
                </span>
              </li>
            );
          })())}
        </ol>
      )}
      {info.length > 0 && (
        <dl className="mt-6">
          {info.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b py-2.5 text-[15px]" style={{ borderColor: LINE }}>
              <dt style={{ color: SUB }}>{k}</dt><dd className="text-right">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
function PitchSvg() {
  const l = { fill: 'none', stroke: 'rgba(255,255,255,.75)', strokeWidth: 1.5, vectorEffect: 'non-scaling-stroke' };
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 68 118" preserveAspectRatio="none" aria-hidden="true">
      <rect x="1" y="1" width="66" height="116" {...l} />
      <path d="M1 59h66" {...l} />
      <ellipse cx="34" cy="59" rx="9.15" ry="10.3" {...l} />
      <rect x="13.85" y="1" width="40.3" height="18" {...l} />
      <rect x="13.85" y="99" width="40.3" height="18" {...l} />
      <rect x="24.85" y="1" width="18.3" height="6" {...l} />
      <rect x="24.85" y="111" width="18.3" height="6" {...l} />
    </svg>
  );
}

function Player({ d, side, item }) {
  const { p, x, y } = item;
  const c = colorOf(d, side);
  const f = flagsOf(d, p.name);
  const top = side === 'home' ? 100 - (6 + (x - 6) * 0.93) : 6 + ((100 - x) - 6) * 0.93;
  return (
    <div className="absolute flex w-[80px] -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${y}%`, top: `${top}%` }}>
      <span className="relative flex h-[30px] w-[30px] items-center justify-center rounded-full text-[13px] font-semibold tabular-nums" style={{ background: c, color: onColor(c), opacity: p.subbedOut ? 0.75 : 1, boxShadow: '0 0 0 2px rgba(255,255,255,.9)' }}>
        {p.jersey}
        {f.goals > 0 && <span className="absolute -right-2 -top-2"><Mark kind="goal" /></span>}
        {(f.yellow || f.red) && <span className="absolute -left-2.5 -top-2"><Mark kind={f.red ? 'red' : 'yellow'} /></span>}
        {p.subbedOut && <span className="absolute -bottom-1.5 -right-2 text-[11px] font-bold leading-none" style={{ color: '#ffd5d0' }}>↓</span>}
      </span>
      <span className="mt-1 max-w-full truncate text-[12px] font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,.55)]">{surname(p.name)}</span>
    </div>
  );
}

function Lineups({ d }) {
  if (!d.lineups) return <Quiet>Lineups aren’t out yet. They usually appear about an hour before kick-off.</Quiet>;
  const home = layoutTeam(d.lineups.home, 'home');
  const away = layoutTeam(d.lineups.away, 'away');
  if (!home.length && !away.length) return <Quiet>No formation data for this match.</Quiet>;
  const line = (side) => (
    <div className="flex items-center justify-between py-2 text-[15px]">
      <span className="flex items-center gap-2 font-semibold"><Swatch color={colorOf(d, side)} />{d[side].name}</span>
      <span className="tabular-nums" style={{ color: SUB }}>{d.lineups[side].formation}</span>
    </div>
  );
  return (
    <div className="px-5 pb-6">
      {line('away')}
      <div className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-md" style={{ aspectRatio: '68 / 118', background: '#4a9a5b' }}>
        <PitchSvg />
        {away.map((it) => <Player key={`a${it.p.id}`} d={d} side="away" item={it} />)}
        {home.map((it) => <Player key={`h${it.p.id}`} d={d} side="home" item={it} />)}
      </div>
      {line('home')}
      <div className="mt-5 grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {['home', 'away'].map((side) => (
          <div key={side}>
            <h4 className="mb-1 text-[13px] font-medium" style={{ color: SUB }}>{d[side].name} substitutes</h4>
            <ul>
              {d.lineups[side].bench.map((b) => (
                <li key={b.id} className="flex items-center gap-3 border-b py-2 text-[15px]" style={{ borderColor: LINE }}>
                  <span className="w-6 text-right tabular-nums" style={{ color: SUB }}>{b.jersey}</span>
                  <span className="flex-1">{b.name}</span>
                  {b.subbedIn && <span className="text-[13px] tabular-nums" style={{ color: GREEN }}>↑ {b.inMin > 90 ? '90+' : b.inMin}'</span>}
                </li>
              ))}
              {d.lineups[side].bench.length === 0 && <li className="py-2 text-[15px]" style={{ color: SUB }}>None used yet</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// the leader's bar is green, the other is grey: no team colours needed to read who's ahead
function StatRow({ s }) {
  const [h, a] = [numOf(s.home) ?? 0, numOf(s.away) ?? 0];
  const lead = h === a ? null : h > a ? 'home' : 'away';
  const max = Math.max(h, a);
  const w = (v) => (max > 0 ? (v / max) * 100 : 0);
  const bar = (side, v) => (
    <div className={`flex h-1 overflow-hidden rounded-full ${side === 'home' ? 'justify-end' : ''}`} style={{ background: '#ecece6' }}>
      <span className="h-full rounded-full" style={{ width: `${w(v)}%`, background: lead === side || !lead ? GREEN : '#c4c4bb' }} />
    </div>
  );
  return (
    <li className="py-3">
      <div className="grid items-baseline gap-3" style={{ gridTemplateColumns: '3.5rem 1fr 3.5rem' }}>
        <span className={`text-right text-[17px] tabular-nums ${lead === 'home' ? 'font-semibold' : ''}`}>{s.home}</span>
        <span className="text-center text-[14px]" style={{ color: SUB }}>{s.label}</span>
        <span className={`text-[17px] tabular-nums ${lead === 'away' ? 'font-semibold' : ''}`}>{s.away}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">{bar('home', h)}{bar('away', a)}</div>
    </li>
  );
}

function Stats({ d }) {
  if (!d.stats.length) return <Quiet>Stats appear once the match is under way.</Quiet>;
  return (
    <div className="px-5 pb-6">
      <div className="flex justify-between py-2 text-[15px] font-semibold"><span>{d.home.name}</span><span>{d.away.name}</span></div>
      <ul className="divide-y" style={{ borderColor: LINE }}>{d.stats.map((s) => <StatRow key={s.name} s={s} />)}</ul>
      {d.leaders.length > 0 && (
        <>
          <h3 className="mb-1 mt-7 text-[15px] font-semibold">Top performers</h3>
          <ul>
            {d.leaders.map((c) => (
              <li key={c.label} className="border-b py-2.5" style={{ borderColor: LINE }}>
                <div className="text-[13px]" style={{ color: SUB }}>{c.label}</div>
                <div className="mt-0.5 flex justify-between gap-4 text-[15px]">
                  <span>{c.home[0]} <b className="tabular-nums">{c.home[1]}</b></span>
                  <span className="text-right">{c.away[0]} <b className="tabular-nums">{c.away[1]}</b></span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Commentary({ d }) {
  if (!d.timeline.length) return <Quiet>Commentary starts at kick-off.</Quiet>;
  return (
    <ol className="px-5 pb-6">
      {[...d.timeline].reverse().map((e) => (
        <li key={e.id} className="grid gap-3 border-b py-2.5 text-[15px]" style={{ gridTemplateColumns: '3rem 1fr', borderColor: LINE }}>
          <span className="text-right tabular-nums" style={{ color: SUB }}>{e.clock}</span>
          <span>{e.text}</span>
        </li>
      ))}
    </ol>
  );
}

const TABS = ['Summary', 'Lineups', 'Stats', 'Commentary'];
export function Plain({ d }) {
  const [tab, setTab] = useState('Summary');
  return (
    <div className="overflow-hidden rounded-lg border" style={{ ...system, background: '#fbfbf9', color: INK, borderColor: LINE }}>
      <Scoreboard d={d} />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <div role="tabpanel" className="pt-1">
        {tab === 'Summary' && <Summary d={d} />}
        {tab === 'Lineups' && <Lineups d={d} />}
        {tab === 'Stats' && <Stats d={d} />}
        {tab === 'Commentary' && <Commentary d={d} />}
      </div>
    </div>
  );
}
