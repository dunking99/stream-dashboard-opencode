import { useEffect, useState } from 'react';
import { Crest } from './EventCard';

// Live lineups: the eleven on the pitch right now, not the eleven who started. A substitute takes the
// place of whoever they replaced, and every player wears what they've done: goals, assists, own goals,
// cards, coming on. `detail` is the /api/event-detail shape; the panel re-renders as the feed updates.

const HOME = '#5aa0ff';
const AWAY = '#ff7a6b';

// -- names ---------------------------------------------------------------------------------------
const norm = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z\s-]/g, '').trim();
const same = (a, b) => {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  return x === y || x.split(/\s+/).pop() === y.split(/\s+/).pop() || x.includes(y) || y.includes(x);
};
const minuteOf = (e) => {
  const m = String(e.clock || '').match(/^(\d+)(?:'|\s|\+(\d+))?/);
  return m ? Number(m[1]) + Number(m[2] || 0) : e.min ?? 0;
};
const kindOf = (e) => {
  const l = `${e.label} ${e.type || ''}`;
  if (/own goal/i.test(l)) return 'own';
  if (/miss|saved/i.test(l)) return 'miss';
  if (e.scoring || /goal/i.test(l)) return 'goal';
  if (/red/i.test(l)) return 'red';
  if (/yellow/i.test(l)) return 'yellow';
  if (/sub/i.test(l)) return 'sub';
  return 'other';
};
const group = (pos = '') => (/^G/.test(pos) ? 'G' : /^(CD|LB|RB|D|SW)/.test(pos) ? 'D' : /^(F|CF|ST|LW|RW)/.test(pos) ? 'F' : 'M');

// -- who is on the pitch -------------------------------------------------------------------------
function currentXI(lineup, events, side) {
  if (!lineup) return null;
  let xi = lineup.starters.map((p) => ({ ...p }));
  const bench = lineup.bench.map((p) => ({ ...p }));
  const off = [];
  const used = new Set();
  const swap = (outIdx, inP, at) => {
    const out = xi[outIdx];
    off.push({ ...out, at });
    xi[outIdx] = { ...inP, place: out.place, position: inP.position && inP.position.length > 1 ? inP.position : out.position, cameOn: at };
    used.add(inP.name);
  };

  const subs = events.filter((e) => e.side === side && kindOf(e) === 'sub').sort((a, b) => minuteOf(a) - minuteOf(b));
  const pending = [];
  for (const e of subs) {
    const m = String(e.text || '').match(/\.\s*([^.]+?) replaces ([^.]+?)(?: because| due| \(|\.|$)/i);
    if (m) {
      const oi = xi.findIndex((p) => same(p.name, m[2]) && !p.cameOn);
      const ip = bench.find((p) => same(p.name, m[1]) && !used.has(p.name)) || { name: m[1], jersey: null, position: '' };
      if (oi >= 0) { swap(oi, ip, minuteOf(e)); continue; }
    }
    pending.push(e);
  }
  // no "X replaces Y" text (or no match): pair leftovers by position group, then by order
  const goneOut = xi.map((p, i) => ({ p, i })).filter(({ p }) => p.subbedOut && !p.cameOn);
  const cameOn = bench.filter((p) => p.subbedIn && !used.has(p.name));
  for (const inP of cameOn) {
    const k = goneOut.findIndex(({ p }) => group(p.position) === group(inP.position));
    const pick = k >= 0 ? k : 0;
    if (!goneOut.length) break;
    const [{ i }] = goneOut.splice(pick, 1);
    swap(i, inP, inP.inMin ?? null);
  }
  const unused = bench.filter((p) => !used.has(p.name));
  return { formation: lineup.formation, xi, off, on: bench.filter((p) => used.has(p.name)), unused };
}

// what each player has done
function deeds(events) {
  const out = new Map();
  const add = (name, key) => {
    if (!name) return;
    const k = [...out.keys()].find((x) => same(x, name)) || name;
    const cur = out.get(k) || { goals: 0, assists: 0, own: 0, yellow: 0, red: false };
    if (key === 'red') cur.red = true; else cur[key] += 1;
    out.set(k, cur);
  };
  for (const e of events) {
    const k = kindOf(e);
    const who = e.participants?.[0] || e.player;
    if (k === 'goal') { add(who, 'goals'); if (e.participants?.[1]) add(e.participants[1], 'assists'); }
    else if (k === 'own') add(who, 'own');
    else if (k === 'yellow') add(who, 'yellow');
    else if (k === 'red') add(who, 'red');
  }
  return (name) => [...out.entries()].find(([k]) => same(k, name))?.[1] || { goals: 0, assists: 0, own: 0, yellow: 0, red: false };
}

// -- pictures ------------------------------------------------------------------------------------
const onColor = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.45 ? '#0a0a0a' : '#fff';
};

function Shirt({ color, number, size = 34, dim = false, ring = false }) {
  const ink = onColor(color);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ opacity: dim ? 0.4 : 1, overflow: 'visible' }}>
      <path d="M31 6 8 20 0 46l19 6 4-10v50h54V42l4 10 19-6-8-26L69 6c-4 10-34 10-38 0Z" fill={color} stroke={ring ? '#54d9a4' : 'rgba(0,0,0,.4)'} strokeWidth={ring ? 5 : 2} strokeLinejoin="round" />
      <path d="M31 6c4 10 34 10 38 0" fill="none" stroke={ink} strokeOpacity=".7" strokeWidth="5" strokeLinecap="round" />
      <text x="50" y="66" textAnchor="middle" fontSize={String(number ?? '').length > 2 ? 28 : 40} fontWeight="800" fill={ink} fontFamily="system-ui, sans-serif">{number ?? ''}</text>
    </svg>
  );
}

const Ball = ({ size = 13 }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#fff" stroke="#0b1118" strokeWidth="1" /><path d="m8 4.6 2.4 1.7-.9 2.8H6.5l-.9-2.8L8 4.6Z" fill="#0b1118" /></svg>
);

function Badges({ f, cameOn }) {
  return (
    <>
      {(f.goals > 0 || f.own > 0) && (
        <span className="absolute -right-2 -top-1.5 flex items-center" title={f.own ? 'Own goal' : 'Goal'}>
          <Ball size={14} />
          {f.goals > 1 && <span className="ml-px rounded bg-black/80 px-0.5 text-[9px] font-bold leading-none text-white">{f.goals}</span>}
          {f.own > 0 && <span className="ml-0.5 rounded bg-red-500 px-0.5 text-[8.5px] font-bold leading-tight text-white">OG</span>}
        </span>
      )}
      {f.assists > 0 && <span className="absolute -right-2 bottom-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-sky-400 px-0.5 text-[8.5px] font-extrabold leading-none text-black" title="Assist">A{f.assists > 1 ? f.assists : ''}</span>}
      {(f.red || f.yellow > 0) && <span className="absolute -left-2 -top-1 h-3.5 w-2.5 rounded-[2px]" title={f.red ? 'Red card' : 'Yellow card'} style={{ background: f.red ? '#e5372b' : '#f2c200', boxShadow: '0 0 0 1px rgba(0,0,0,.5)' }} />}
      {cameOn != null && <span className="absolute -left-2 bottom-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-mint text-black" title="Came on"><svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" /></svg></span>}
    </>
  );
}

function PlayerDot({ p, f, color }) {
  return (
    <div className="absolute flex w-[66px] -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${p.left}%`, top: `${p.top}%` }} title={`${p.jersey ?? ''} ${p.name}${p.cameOn != null ? ` (on ${p.cameOn}')` : ''}`}>
      <div className="relative">
        <Shirt color={color} number={p.jersey} size={30} />
        <Badges f={f} cameOn={p.cameOn} />
      </div>
      <span className="mt-0.5 max-w-full truncate rounded bg-black/60 px-1 text-[9.5px] font-semibold leading-tight text-white">{(p.name || '').split(' ').slice(-1)[0]}</span>
    </div>
  );
}

// -- layout (same row logic as the lab: formation string gives the rows, position code the side) --
const sideScore = (pos = '') => (/(^|-)L$|^(LB|LM|LW)$/.test(pos) ? -1 : /(^|-)R$|^(RB|RM|RW)$/.test(pos) ? 1 : 0);
function placeXI(xi, formation, side) {
  const parts = (formation || '').split('-').map(Number).filter(Boolean);
  const sorted = [...xi].sort((a, b) => Number(a.place) - Number(b.place));
  if (!parts.length || sorted.length !== 1 + parts.reduce((a, b) => a + b, 0)) {
    // unknown formation: stack by position group
    const rows = ['G', 'D', 'M', 'F'].map((g) => sorted.filter((p) => group(p.position) === g)).filter((r) => r.length);
    return rowsToSpots(rows, side);
  }
  const rows = [[sorted[0]]];
  let k = 1;
  for (const n of parts) { rows.push(sorted.slice(k, k + n).sort((a, b) => sideScore(a.position) - sideScore(b.position) || Number(a.place) - Number(b.place))); k += n; }
  return rowsToSpots(rows, side);
}
function rowsToSpots(rows, side) {
  const R = rows.length;
  return rows.flatMap((row, r) => row.map((p, j) => {
    const along = 6 + (r * 40) / Math.max(1, R - 1); // 6 own goal line .. 46 halfway
    const squeezed = 6 + (along - 6) * 0.93;
    const across = r === 0 ? 50 : 10 + ((j + 1) / (row.length + 1)) * 80;
    // portrait: home at the bottom attacking up, away at the top attacking down
    return { ...p, left: side === 'home' ? across : 100 - across, top: side === 'home' ? 100 - squeezed : squeezed };
  }));
}

// -- the panel -----------------------------------------------------------------------------------
function Strip({ team, data, color }) {
  const bench = [...data.on, ...data.unused];
  return (
    <div className="min-w-0 rounded-lg bg-white/[0.03] px-2.5 py-2">
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider">
        <span className="truncate" style={{ color }}>{team.short || team.name} bench</span>
        {data.off.length > 0 && <span className="shrink-0 font-normal normal-case tracking-normal text-muted">{data.off.length} off</span>}
      </div>
      <div className="flex flex-wrap gap-x-1.5 gap-y-1">
        {bench.map((b) => (
          <div key={b.name} className="flex w-9 flex-col items-center" title={`${b.jersey ?? ''} ${b.name}${data.on.includes(b) ? ' (on)' : ''}`}>
            <Shirt color={color} number={b.jersey} size={24} dim={!data.on.includes(b)} ring={data.on.includes(b)} />
            <span className="max-w-full truncate text-[9px] text-muted">{(b.name || '').split(' ').slice(-1)[0]}</span>
          </div>
        ))}
        {!bench.length && <span className="text-[10px] text-muted">No bench listed</span>}
      </div>
      {data.off.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted">
          {data.off.map((o) => <span key={o.name} className="flex items-center gap-1"><svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="#ff5d6c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 2v8M2.5 6.5 6 10l3.5-3.5" /></svg>{(o.name || '').split(' ').slice(-1)[0]}{o.at != null ? ` ${o.at}'` : ''}</span>)}
        </div>
      )}
    </div>
  );
}

export function LiveLineupView({ detail, onDemo }) {
  const d = detail;
  const events = d?.timeline || [];
  const home = d?.lineups?.home && currentXI(d.lineups.home, events, 'home');
  const away = d?.lineups?.away && currentXI(d.lineups.away, events, 'away');
  const live = d?.status?.state === 'live';
  const f = deeds(events);
  const hc = d?.home?.color || HOME, ac = d?.away?.color || AWAY;

  return (
    <section className="panel flex h-full min-h-0 flex-col overflow-hidden" aria-label="Live lineups">
      <div className="shrink-0 border-b border-line px-3 py-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex min-w-0 items-center gap-1.5"><Crest src={d?.home?.logo} name={d?.home?.name || '?'} size={22} /><span className="truncate text-sm font-semibold" style={{ color: hc }}>{d?.home?.abbreviation || d?.home?.short || d?.home?.name}</span></div>
          <div className="text-center">
            <div className="font-mono text-lg font-bold leading-none text-white">{d?.home?.score ?? '–'} <span className="text-muted/60">:</span> {d?.away?.score ?? '–'}</div>
            <div className={`mt-1 flex items-center justify-center gap-1 font-mono text-[10.5px] font-bold ${live ? 'text-live' : 'text-muted'}`}>
              {live && <span className="h-1.5 w-1.5 rounded-full bg-live motion-safe:animate-pulse" aria-hidden="true" />}
              {d?.status?.detail || d?.status?.state || ''}
            </div>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-1.5"><span className="truncate text-sm font-semibold" style={{ color: ac }}>{d?.away?.abbreviation || d?.away?.short || d?.away?.name}</span><Crest src={d?.away?.logo} name={d?.away?.name || '?'} size={22} /></div>
        </div>
      </div>

      {!home && !away ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-medium text-gray-200">{d ? 'Lineups not announced yet' : 'No lineup data'}</p>
          <p className="text-xs leading-relaxed text-muted">{d ? 'They usually appear about an hour before kick-off, and this panel then follows the match: subs, cards, goals and assists.' : 'This event isn’t matched to an ESPN fixture.'}</p>
          {onDemo && <button type="button" className="btn" onClick={onDemo}>Preview with demo data</button>}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
          <div className="relative min-h-[500px] w-full flex-1 overflow-hidden rounded-lg" style={{ background: 'repeating-linear-gradient(0deg, #1d5a35 0 8.33%, #226a3d 8.33% 16.66%)' }}>
            <svg viewBox="0 0 100 139" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth=".5" aria-hidden="true">
              <rect x="1" y="1" width="98" height="137" /><path d="M1 69.5h98" /><circle cx="50" cy="69.5" r="10" />
              <rect x="22" y="1" width="56" height="18" /><rect x="22" y="120" width="56" height="18" /><rect x="38" y="1" width="24" height="7" /><rect x="38" y="131" width="24" height="7" />
            </svg>
            {away && <span className="absolute left-2 top-1.5 font-mono text-[10px] font-bold text-white/70">{away.formation}</span>}
            {home && <span className="absolute bottom-1.5 left-2 font-mono text-[10px] font-bold text-white/70">{home.formation}</span>}
            {away && placeXI(away.xi, away.formation, 'away').map((p) => <PlayerDot key={`a${p.name}`} p={p} f={f(p.name)} color={ac} />)}
            {home && placeXI(home.xi, home.formation, 'home').map((p) => <PlayerDot key={`h${p.name}`} p={p} f={f(p.name)} color={hc} />)}
          </div>
          {home && <Strip team={d.home} data={home} color={hc} />}
          {away && <Strip team={d.away} data={away} color={ac} />}
        </div>
      )}
    </section>
  );
}

// the real thing: polls the same endpoint (and server cache) as the Match centre
export default function LiveLineup({ espnId, espnPath }) {
  const [detail, setDetail] = useState(null);
  const [demo, setDemo] = useState(null);
  const ready = Boolean(espnId && espnPath);

  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/event-detail?id=${encodeURIComponent(espnId)}&path=${encodeURIComponent(espnPath)}`);
        if (res.ok && !cancelled) setDetail(await res.json());
      } catch { /* keep the last good data */ }
    };
    load();
    const t = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(t); };
  }, [ready, espnId, espnPath]);

  const showDemo = () => import('../workshop/matchData.js').then((m) => setDemo(m.LIVE));
  return <LiveLineupView detail={demo || detail} onDemo={demo ? null : showDemo} />;
}
