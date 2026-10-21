import { useState } from 'react';
import { Shield, Icon, EventGlyph, Tally } from './bits.jsx';
import { Magnets } from '../designs/chalkMarkers.jsx';
import { mmss } from './time.js';
import { SHOTS, PLAYERS, TABLE, TEAMS, H2H, CHATTER, DVR_SEC } from './mock.js';
import { kindOf, numOf, surname } from '../matchData.js';

// The desk: everything you read rather than watch. Tabs along the top; the video can shrink to a
// picture-in-picture while you're here.

const Quiet = ({ children }) => <p className="t-dim rounded-sm px-4 py-8 text-center text-[12.5px]" style={{ border: '1px dashed var(--line2)' }}>{children}</p>;
const Locked = ({ held }) => (
  <div className="flex flex-col items-center gap-2 rounded-sm px-4 py-10 text-center" style={{ border: '1px dashed var(--amber)', background: 'rgba(255,176,32,.06)' }}>
    <Icon name="eyeoff" size={22} className="t-amber" />
    <div className="text-[13.5px] font-semibold">Hidden by the spoiler guard</div>
    <div className="t-dim max-w-sm text-[12.5px]">The live feed is ahead of your video. This unlocks when your stream reaches the goal, in <span className="mono t-amber">{mmss(held ?? 0)}</span>.</div>
  </div>
);

// ---- catch-up: what you missed, written from what's visible so far
function CatchUp({ d, meta, dataSec, locked, onDismiss, onTab }) {
  const [h, a] = [d.home.score ?? 0, d.away.score ?? 0];
  const key = d.timeline.filter((e) => kindOf(e) !== 'sub').slice(-3).reverse();
  const subs = d.timeline.filter((e) => kindOf(e) === 'sub');
  const poss = d.stats.find((s) => s.name === 'possessionPct');
  const shots = d.stats.find((s) => s.name === 'totalShots');
  const line = h === a ? `It’s ${h}–${a}.` : `${h > a ? meta.home : meta.away} lead ${Math.max(h, a)}–${Math.min(h, a)}.`;
  return (
    <div className="panel p-4" style={{ borderColor: '#5a4a1c', background: 'linear-gradient(#211e17, #1c1b19)' }}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold">You joined at {mmss(dataSec)}. Here’s what you missed.</h3>
          <ul className="mt-2.5 space-y-1.5 text-[13px]">
            <li className="flex gap-2"><Tally kind="pgm" size={6} /><span>{line}</span></li>
            {key.map((e) => <li key={e.id} className="flex items-center gap-2"><EventGlyph e={e} size={13} /><span><span className="mono t-dim">{e.clock}</span> {e.player} · {e.label.toLowerCase()} <span className="t-dim">({e.team})</span></span></li>)}
            {subs.length > 0 && <li className="t-dim flex gap-2"><EventGlyph e="sub" size={13} /><span>{subs.length} substitutions so far.</span></li>}
            {!locked && poss && shots && <li className="t-dim flex gap-2"><Icon name="flag" size={13} /><span>{meta.home} have {Math.round(numOf(poss.home))}% of the ball and {shots.home} shots to {shots.away}.</span></li>}
          </ul>
        </div>
        <button type="button" className="ghost t-dim" onClick={onDismiss} aria-label="Dismiss catch-up"><Icon name="x" size={16} /></button>
      </div>
      <div className="mt-3 flex gap-2"><button type="button" className="btn" onClick={() => onTab('Events')}>Full events</button><button type="button" className="btn" onClick={() => onTab('Lineups')}>See lineups</button></div>
    </div>
  );
}

// ---- stats
function Stats({ d, meta }) {
  if (!d.stats.length) return <Quiet>Stats begin once the match does.</Quiet>;
  const poss = d.stats.find((s) => s.name === 'possessionPct');
  const rows = d.stats.filter((s) => s !== poss);
  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <div>
        {poss && (
          <div className="mb-4">
            <div className="mb-1 flex items-end justify-between"><span className="mono text-[26px] font-semibold" style={{ color: meta.hc }}>{Math.round(numOf(poss.home))}%</span><span className="t-dim pb-1 text-[12px]">Possession</span><span className="mono text-[26px] font-semibold" style={{ color: meta.ac }}>{Math.round(numOf(poss.away))}%</span></div>
            <div className="flex h-2"><span style={{ width: `${numOf(poss.home)}%`, background: meta.hc }} /><span className="flex-1" style={{ background: meta.ac }} /></div>
          </div>
        )}
        <ul>
          {rows.map((s) => {
            const [hv, av] = [numOf(s.home) ?? 0, numOf(s.away) ?? 0];
            const max = Math.max(hv, av) || 1;
            return (
              <li key={s.name} className="py-1.5">
                <div className="grid items-baseline" style={{ gridTemplateColumns: '2.5rem 1fr 2.5rem' }}><span className={`mono text-right ${hv >= av ? 'font-semibold' : 't-dim'}`}>{s.home}</span><span className="t-dim text-center text-[12px]">{s.label}</span><span className={`mono ${av >= hv ? 'font-semibold' : 't-dim'}`}>{s.away}</span></div>
                <div className="mt-1 grid grid-cols-2 gap-1"><div className="flex h-1 justify-end bg-[#2a2926]"><span style={{ width: `${(hv / max) * 100}%`, background: meta.hc, opacity: hv >= av ? 1 : 0.5 }} /></div><div className="h-1 bg-[#2a2926]"><span className="block h-full" style={{ width: `${(av / max) * 100}%`, background: meta.ac, opacity: av >= hv ? 1 : 0.5 }} /></div></div>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <h4 className="t-dim mb-2 text-[12px] font-semibold">Top performers</h4>
        <ul className="space-y-2">
          {d.leaders.map((c) => (
            <li key={c.label} className="grid items-center gap-2 text-[12.5px]" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
              <span className="text-right">{surname(c.home[0])} <b className="mono">{c.home[1]}</b></span><span className="t-faint text-[11px]">{c.label}</span><span>{surname(c.away[0])} <b className="mono">{c.away[1]}</b></span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---- events, and the commentary around them
function Events({ d, scenario, edgeSec, onSeek, locked }) {
  const [all, setAll] = useState(false);
  const base = [...d.timeline].filter((e) => all || kindOf(e) !== 'sub').map((e) => ({ min: e.min, e }));
  const chatter = all ? CHATTER.filter((c) => c.min <= (scenario === 'live' ? d.status.clockSeconds / 60 : 99)).map((c) => ({ min: c.min, text: c.text })) : [];
  const items = [...base, ...chatter].sort((x, y) => y.min - x.min);
  if (!items.length) return <Quiet>{scenario === 'pre' ? 'Nothing yet. Events land here as they happen.' : 'Nothing yet.'}</Quiet>;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between"><div className="seg" role="group" aria-label="Detail"><button type="button" aria-pressed={!all} onClick={() => setAll(false)}>Key moments</button><button type="button" aria-pressed={all} onClick={() => setAll(true)}>Everything</button></div>{locked && <span className="t-amber text-[12px]">Later events are held back</span>}</div>
      <ol>
        {items.map((it, i) => {
          if (!it.e) return <li key={`c${i}`} className="grid gap-3 py-2 text-[12.5px]" style={{ gridTemplateColumns: '3.2rem 1.2rem 1fr', borderBottom: '1px solid var(--line)' }}><span className="mono t-faint text-right">{it.min}'</span><span /><span className="t-dim">{it.text}</span></li>;
          const e = it.e, sec = e.min * 60, ok = scenario === 'live' && sec >= edgeSec - DVR_SEC && sec <= edgeSec;
          return (
            <li key={e.id} className="grid items-center gap-3 py-2 text-[13px]" style={{ gridTemplateColumns: '3.2rem 1.2rem 1fr auto', borderBottom: '1px solid var(--line)' }}>
              <span className="mono t-dim text-right">{e.clock}</span><EventGlyph e={e} size={15} />
              <span><b className={kindOf(e) === 'goal' ? '' : 'font-medium'}>{e.player}</b> <span className="t-dim">· {e.label} · {e.team}</span></span>
              <button type="button" className="btn" disabled={!ok} onClick={() => onSeek(sec)} title={ok ? 'Jump the video here' : scenario === 'live' ? `Older than the ${mmss(DVR_SEC)} buffer` : 'Not available after the match'} style={{ padding: '2px 8px' }}><span className="inline-flex items-center gap-1"><Icon name="play" size={10} />Jump</span></button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---- shots, expected goals, and the players behind them
function ShotsTab({ meta, scenario, limit }) {
  const [who, setWho] = useState(null);
  const shots = SHOTS.filter((s) => s.min <= limit);
  if (scenario === 'pre') return <Quiet>The shot map fills in during the match.</Quiet>;
  const xg = (side) => shots.filter((s) => s.side === side).reduce((t, s) => t + s.xg, 0);
  const col = (side) => (side === 'home' ? meta.hc : meta.ac);
  const steps = (side) => { let t = 0; return shots.filter((s) => s.side === side).map((s) => [s.min, (t += s.xg)]); };
  const max = Math.max(xg('home'), xg('away'), 1);
  const line = (side) => `M0 60 ${steps(side).flatMap(([m, v], i, arr) => [`L${(m / limit) * 300} ${60 - ((i ? arr[i - 1][1] : 0) / max) * 56}`, `L${(m / limit) * 300} ${60 - (v / max) * 56}`]).join(' ')} L300 ${60 - (xg(side) / max) * 56}`;
  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[12px]"><span className="t-dim">Shot map · circle size is expected goals (xG)</span><span className="mono"><span style={{ color: meta.hc }}>{xg('home').toFixed(2)}</span> – <span style={{ color: meta.ac }}>{xg('away').toFixed(2)}</span> xG</span></div>
        <svg viewBox="0 0 105 68" className="block w-full" style={{ background: '#16301f', border: '1px solid var(--line2)' }} role="img" aria-label="Shot map">
          <g fill="none" stroke="rgba(255,255,255,.35)" strokeWidth=".4"><rect x=".3" y=".3" width="104.4" height="67.4" /><path d="M52.5 0v68" /><circle cx="52.5" cy="34" r="9.15" /><rect x=".3" y="13.85" width="16.5" height="40.3" /><rect x="88.2" y="13.85" width="16.5" height="40.3" /></g>
          {shots.map((s, i) => {
            const on = !who || s.who === who;
            return (
              <g key={i} opacity={on ? 1 : 0.15}>
                {s.res === 'miss' ? <path d={`M${s.x - 1.6} ${s.y - 1.6}l3.2 3.2m0-3.2-3.2 3.2`} stroke="#ff6a5e" strokeWidth=".7" /> : <circle cx={s.x} cy={s.y} r={0.9 + s.xg * 4.5} fill={col(s.side)} fillOpacity={s.res === 'goal' ? 1 : 0.6} stroke={s.res === 'goal' ? '#fff' : 'rgba(0,0,0,.4)'} strokeWidth={s.res === 'goal' ? 0.7 : 0.25}><title>{`${s.min}' ${s.who} · ${s.res} · ${s.xg.toFixed(2)} xG`}</title></circle>}
              </g>
            );
          })}
        </svg>
        <div className="mt-3">
          <div className="t-dim mb-1 text-[12px]">xG race</div>
          <svg viewBox="0 0 300 64" className="block w-full" role="img" aria-label="Cumulative expected goals over time">
            <path d="M0 60H300" stroke="var(--line2)" /><path d={line('home')} fill="none" stroke={meta.hc} strokeWidth="2" /><path d={line('away')} fill="none" stroke={meta.ac} strokeWidth="2" />
          </svg>
        </div>
      </div>
      <div>
        <div className="t-dim mb-1.5 flex justify-between text-[12px]"><span>Players · click to filter the map</span>{who && <button type="button" className="ghost t-amber" onClick={() => setWho(null)}>Clear</button>}</div>
        <ul>
          {PLAYERS.map((p) => (
            <li key={p.name}>
              <button type="button" className="row" aria-pressed={who === p.name} onClick={() => setWho(who === p.name ? null : p.name)} style={{ background: who === p.name ? '#262420' : undefined }}>
                <span className="grid items-center gap-3 px-1 py-2" style={{ gridTemplateColumns: '2.2rem 1fr auto' }}>
                  <span className="mono rounded-sm py-0.5 text-center text-[12.5px] font-semibold text-black" style={{ background: p.rating >= 7.5 ? '#35d07f' : p.rating >= 7 ? '#a7d95a' : '#e0b84a' }}>{p.rating.toFixed(1)}</span>
                  <span><span className="block text-[13px]">{p.name}</span><span className="t-dim text-[11.5px]">{p.line}</span></span>
                  <span className="h-2 w-2 rounded-full" style={{ background: col(p.side) }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---- the table, with where they'd finish up if the score stays as it is
function TableTab({ d, meta }) {
  const lead = (d.home.score ?? 0) - (d.away.score ?? 0);
  const proj = TABLE.map((r) => ({ ...r, np: r.pts + (r.me === 'home' ? (lead > 0 ? 3 : lead === 0 ? 1 : 0) : r.me === 'away' ? (lead < 0 ? 3 : lead === 0 ? 1 : 0) : 0) })).sort((a, b) => b.np - a.np || a.pos - b.pos).map((r, i) => ({ ...r, now: i + 1 }));
  return (
    <div>
      <p className="t-dim mb-2 text-[12px]">Saudi Pro League. The right-hand columns show the table if the score stays as it is now.</p>
      <table className="w-full text-[12.5px]">
        <thead><tr className="t-faint text-left text-[11px]"><th className="w-8 pb-1 font-medium">#</th><th className="font-medium">Team</th><th className="text-right font-medium">P</th><th className="text-right font-medium">GD</th><th className="text-right font-medium">Pts</th><th className="text-right font-medium">If it holds</th></tr></thead>
        <tbody>
          {proj.map((r) => {
            const me = r.me; const delta = r.pos - r.now;
            return (
              <tr key={r.team} style={{ borderTop: '1px solid var(--line)', background: me ? 'rgba(255,255,255,.04)' : undefined }}>
                <td className="mono t-dim py-1.5">{r.pos}</td>
                <td><span className="flex items-center gap-2">{me && <Shield color={me === 'home' ? meta.hc : meta.ac} label={r.team} size={13} />}<span className={me ? 'font-semibold' : ''}>{r.team}</span></span></td>
                <td className="mono t-dim text-right">{r.p}</td><td className="mono t-dim text-right">{r.gd}</td><td className="mono text-right">{r.pts}</td>
                <td className="mono text-right">{r.np !== r.pts ? <span className="t-green">{r.np} <span className="t-dim">pts</span> {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${-delta}` : ''}</span> : <span className="t-faint">{r.now}</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---- teams: form, who's out, and how they've done against each other
function TeamsTab({ meta }) {
  const form = (f) => f.map((r, i) => <span key={i} className="mono inline-flex h-5 w-5 items-center justify-center rounded-sm text-[10.5px] font-semibold text-black" style={{ background: { W: '#35d07f', D: '#a29d91', L: '#ff6a5e' }[r] }}>{r}</span>);
  const side = (k, name, c, pos) => (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2"><Shield color={c} label={name} size={24} /><div><div className="text-[14px] font-semibold">{name}</div><div className="t-dim text-[12px]">{pos}</div></div></div>
      <div className="flex items-center gap-1.5"><span className="t-dim mr-1 text-[12px]">Form</span>{form(TEAMS[k].form)}</div>
      <div className="text-[12.5px]"><span className="t-dim">Manager </span>{TEAMS[k].manager}</div>
      <div className="text-[12.5px]"><span className="t-dim">Top scorer </span>{TEAMS[k].topScorer}</div>
      <div className="text-[12.5px]"><span className="t-dim">Out </span>{TEAMS[k].out.join(', ')}</div>
    </div>
  );
  const r = H2H.record, tot = r.home + r.draw + r.away;
  return (
    <div className="space-y-6">
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>{side('home', meta.home, meta.hc, '2nd · 25 pts')}{side('away', meta.away, meta.ac, '9th · 12 pts')}</div>
      <div>
        <h4 className="mb-2 text-[13px] font-semibold">Head to head <span className="t-dim font-normal">· last five meetings</span></h4>
        <div className="mb-3 flex h-6 text-[11.5px] font-semibold text-black"><span className="flex items-center justify-center" style={{ width: `${(r.home / tot) * 100}%`, background: meta.hc }}>{meta.home} {r.home}</span><span className="flex items-center justify-center" style={{ width: `${(r.draw / tot) * 100}%`, background: '#a29d91' }}>{r.draw}</span><span className="flex items-center justify-center" style={{ width: `${(r.away / tot) * 100}%`, background: meta.ac }}>{r.away}</span></div>
        <ul>{H2H.games.map((g, i) => <li key={i} className="grid items-center gap-3 py-1.5 text-[12.5px]" style={{ gridTemplateColumns: '5rem 1fr auto 1fr', borderTop: '1px solid var(--line)' }}><span className="t-dim">{g.date}</span><span className="text-right">{g.h}</span><span className="mono rounded-sm bg-[#121110] px-2 py-0.5 font-semibold">{g.hs}–{g.as}</span><span>{g.a}</span></li>)}</ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
export default function Desk({ d, meta, scenario, tab, setTab, locked, held, dataSec, edgeSec, onSeek, catchup, dismissCatchup, shotLimit, clearPip }) {
  const tabs = [...(scenario === 'live' && catchup ? ['Catch-up'] : []), 'Lineups', 'Stats', 'Events', 'Shots', 'Table', 'Teams'];
  const cur = tabs.includes(tab) ? tab : tabs[0];
  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="Analysis desk">
      <div role="tablist" aria-label="Analysis" className="bar flex shrink-0 overflow-x-auto px-2">
        {tabs.map((t) => <button key={t} type="button" role="tab" aria-selected={cur === t} className="tab" onClick={() => setTab(t)}>{t}{t === 'Catch-up' && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--amber)' }} />}</button>)}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4" role="tabpanel" style={{ paddingBottom: clearPip ? 270 : 16 }}>
        {cur === 'Catch-up' && <CatchUp d={d} meta={meta} dataSec={dataSec} locked={locked} onDismiss={dismissCatchup} onTab={setTab} />}
        {cur === 'Lineups' && (d.lineups ? <Magnets d={d} /> : <Quiet>Lineups aren’t out yet.</Quiet>)}
        {cur === 'Stats' && (locked ? <Locked held={held} /> : <Stats d={d} meta={meta} />)}
        {cur === 'Events' && <Events d={d} scenario={scenario} edgeSec={edgeSec} onSeek={onSeek} locked={locked} />}
        {cur === 'Shots' && (locked ? <Locked held={held} /> : <ShotsTab meta={meta} scenario={scenario} limit={shotLimit} />)}
        {cur === 'Table' && <TableTab d={d} meta={meta} />}
        {cur === 'Teams' && <TeamsTab meta={meta} />}
      </div>
    </section>
  );
}
