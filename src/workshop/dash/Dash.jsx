import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CSS } from './theme.js';
import { Icon, Switch, Tally, Kbd } from './bits.jsx';
import Rundown from './Rundown.jsx';
import Sources from './Sources.jsx';
import Desk from './Desk.jsx';
import { MatchHeader, Monitor, Timeline } from './Stage.jsx';
import { mmss } from './time.js';
import { MATCHES, FAVS0, SOURCES0, DATA_SEC0, DVR_SEC, GOAL_SEC, momentum } from './mock.js';
import { LIVE, FINISHED, PRE, at } from '../matchData.js';

// GALLERY: a whole-page design for the stream dashboard, as a broadcast control room.
// The live feed is "on air" (red tally); the other sources are preview monitors you cut to. The
// timeline works like a video editor's, and the gap between live and what you're watching is
// shown, and used, by the spoiler guard. Everything here is mock data and local state.

const META = { home: 'Al Nassr', away: 'Neom SC', ha: 'NSR', aa: 'NEO', hc: '#ffd400', ac: '#00c2a8', league: 'Saudi Pro League' };
const wall = (t) => { const s = 20 * 3600 + 3 * 60 + t; return [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, '0')).join(':'); };
const wallShort = (t) => wall(t).slice(0, 5);

function Toasts({ list, dismiss }) {
  return (
    <div className="pointer-events-none fixed right-3 top-[54px] z-40 flex w-[340px] flex-col gap-2" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="toast panel pointer-events-auto flex gap-3 p-3" style={{ borderLeft: `3px solid ${{ goal: 'var(--green)', cut: 'var(--red)', info: 'var(--amber)' }[t.kind] || 'var(--line2)'}`, boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold">{t.title}</div>
            {t.body && <div className="t-dim mt-0.5 text-[12px]">{t.body}</div>}
            {t.actions && <div className="mt-2 flex gap-2">{t.actions.map((a) => <button key={a.label} type="button" className="btn" onClick={() => { a.run(); dismiss(t.id); }}>{a.label}</button>)}</div>}
          </div>
          <button type="button" className="ghost t-dim self-start" onClick={() => dismiss(t.id)} aria-label="Dismiss"><Icon name="x" size={14} /></button>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 pt-24" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="panel" style={{ width: wide ? 560 : 480, boxShadow: '0 20px 60px rgba(0,0,0,.7)' }}>
        <div className="bar flex items-center justify-between px-4 py-2.5"><h2 className="text-[14px] font-semibold">{title}</h2><button type="button" className="ghost t-dim" onClick={onClose} aria-label="Close"><Icon name="x" size={16} /></button></div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

const SHORTCUTS = [['1 – 4', 'Cut to that source'], ['A', 'Switch between Watch and Analyse'], ['G', 'Spoiler guard on / off'], ['/', 'Search the rundown'], ['?', 'This list'], ['Esc', 'Close a panel']];

export default function Dash() {
  const [scenario, setScenario] = useState('live');
  const [t, setT] = useState(0); // seconds since the page opened; every clock is derived from it
  const [behind, setBehind] = useState(0); // how far behind the stream's own live edge you've seeked
  const [mode, setMode] = useState('watch');
  const [guard, setGuard] = useState(true);
  const [sources, setSources] = useState(SOURCES0);
  const [pgm, setPgm] = useState(1);
  const [auto, setAuto] = useState({ on: true, stall: 6, lag: 30 });
  const [log, setLog] = useState([{ at: '19:41', text: 'Auto-cut S2 → S1 · S2 stalled for 8s' }, { at: '19:12', text: 'You cut S3 → S2' }]);
  const [lastCut, setLastCut] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [matches, setMatches] = useState(MATCHES);
  const [favs, setFavs] = useState(new Set(FAVS0));
  const [favOnly, setFavOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [listTab, setListTab] = useState('live');
  const [flashId, setFlashId] = useState(null);
  const [tab, setTab] = useState('Catch-up');
  const [catchup, setCatchup] = useState(true);
  const [conn, setConn] = useState('ok');
  const [dialog, setDialog] = useState(null);
  const [demo, setDemo] = useState(false);
  const [toasts, setToasts] = useState([]);
  const searchRef = useRef(null);
  const timers = useRef([]);
  const sourcesRef = useRef(sources);
  useEffect(() => { sourcesRef.current = sources; }, [sources]);

  // ---- toasts
  const dismiss = useCallback((id) => setToasts((l) => l.filter((x) => x.id !== id)), []);
  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((l) => [{ id, ...toast }, ...l].slice(0, 4));
    timers.current.push(setTimeout(() => dismiss(id), toast.ms || 9000));
  }, [dismiss]);
  useEffect(() => { const ts = timers.current; return () => ts.forEach(clearTimeout); }, []);

  // ---- the clock
  useEffect(() => {
    if (scenario !== 'live' || conn !== 'ok') return undefined;
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [scenario, conn]);

  // ---- derived clocks: data feed (live), the stream's live edge, and where you're watching
  const live = scenario === 'live';
  const srcs = useMemo(() => sources.map((s) => (s.deadAt != null ? { ...s, downFor: t - s.deadAt } : s)), [sources, t]);
  const cur = srcs.find((s) => s.id === pgm);
  const lost = live && cur?.state === 'dead';
  const delay = cur?.delay ?? 110;
  const dataSec = live ? DATA_SEC0 + t : scenario === 'finished' ? 5760 : 0;
  const edgeSec = live ? dataSec - delay : dataSec;
  const headSec = live ? edgeSec - behind : dataSec;
  const nextGoal = live && guard && GOAL_SEC > headSec && GOAL_SEC <= dataSec ? GOAL_SEC : null;
  const held = nextGoal != null ? Math.ceil(nextGoal - headSec) : null;

  const base = scenario === 'live' ? LIVE : scenario === 'finished' ? FINISHED : PRE;
  const view = live && guard ? at(Math.min(62, Math.floor(headSec / 60)), 'live') : base;
  const mom = scenario === 'pre' ? [] : scenario === 'finished' ? momentum(96) : momentum(Math.min(62, Math.floor((guard ? headSec : dataSec) / 60)));
  const locked = guard && held != null;
  const shotLimit = scenario === 'finished' ? 96 : Math.min(62, Math.floor((guard ? headSec : dataSec) / 60));

  // ---- the rundown, with the selected match following the page's state
  const rundown = useMemo(() => matches.map((m) => {
    if (m.id === 'nassr') {
      if (scenario === 'pre') return { ...m, status: 'next', min: undefined, hs: undefined, as: undefined };
      if (scenario === 'finished') return { ...m, status: 'done', hs: 1, as: 0 };
      return { ...m, min: Math.floor(dataSec / 60), hs: view.home.score, as: view.away.score };
    }
    if (m.id === 'levante') return { ...m, min: m.min + Math.floor(t / 60) };
    return m;
  }), [matches, scenario, dataSec, view.home.score, view.away.score, t]);

  // ---- actions
  const cut = useCallback((id, how = 'manual') => {
    const to = sources.find((s) => s.id === id);
    if (!to || to.state === 'dead' || id === pgm) return;
    setLastCut({ from: pgm, to: id });
    setPgm(id); setBehind(0);
    const text = how === 'manual' ? `You cut S${pgm} → S${id}` : `Auto-cut S${pgm} → S${id} · ${how}`;
    setLog((l) => [{ at: wallShort(t), text }, ...l]);
    if (how === 'manual') push({ kind: 'cut', title: `Cut to ${to.name}`, body: `S${id} is now on air.`, ms: 3500 });
  }, [sources, pgm, t, push]);

  const killCurrent = () => {
    if (!live || cur?.state === 'dead') return;
    const alive = srcs.filter((s) => s.state !== 'dead' && s.id !== pgm);
    const best = alive.sort((a, b) => a.delay - b.delay)[0];
    setSources((l) => l.map((s) => (s.id === pgm ? { ...s, state: 'dead', deadAt: t, downFor: 0 } : s)));
    if (auto.on && best) {
      setLastCut({ from: pgm, to: best.id });
      setLog((l) => [{ at: wallShort(t), text: `Auto-cut S${pgm} → S${best.id} · S${pgm} stalled for ${auto.stall}s` }, ...l]);
      setPgm(best.id); setBehind(0);
      push({ kind: 'cut', title: `Auto-cut to ${best.name}`, body: `${cur.name} stalled for ${auto.stall} seconds.`, actions: [{ label: 'Undo', run: () => undo(pgm, best.id) }] });
    } else {
      setLog((l) => [{ at: wallShort(t), text: `S${pgm} lost signal. Auto-failover is off.` }, ...l]);
      push({ kind: 'info', title: `${cur.name} lost signal`, body: 'Auto-failover is off, so nothing was switched.' });
    }
  };
  const undo = (from, to) => {
    const f = sourcesRef.current.find((x) => x.id === from);
    if (!f || f.state === 'dead') { push({ kind: 'info', title: `S${from} is down`, body: 'Staying on the new source. Undo works once the old one is back.', ms: 5000 }); return; }
    setPgm(from); setBehind(0); setLastCut(null);
    setLog((l) => [{ at: wallShort(t), text: `Undid the cut to S${to}` }, ...l]);
  };
  const reviveAll = () => setSources(SOURCES0.map((s) => (s.id === 4 ? s : { ...s })));

  const seek = (sec) => {
    if (sec == null) { push({ kind: 'info', title: 'The stream has ended', body: 'There is nothing to seek in after full time.', ms: 3500 }); return; }
    if (!live) return;
    if (sec < edgeSec - DVR_SEC) { push({ kind: 'info', title: 'Outside the buffer', body: `The stream only keeps the last ${mmss(DVR_SEC)}.`, ms: 4500 }); return; }
    const b = Math.max(0, edgeSec - sec);
    setBehind(b);
    if (b > 0) push({ kind: 'info', title: `Jumped to ${mmss(sec)}`, body: guard ? 'The spoiler guard follows where you are.' : undefined, ms: 3000 });
  };
  const toggleFav = (id) => setFavs((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const select = (id) => { if (id !== 'nassr') push({ kind: 'info', title: 'Prototype', body: 'Only Al Nassr v Neom SC is wired up in this design.', ms: 3500 }); };
  const scan = () => { setScanning(true); timers.current.push(setTimeout(() => { setScanning(false); push({ kind: 'info', title: 'Clocks read', body: 'S1 60:20 · S2 59:50 · S3 61:28 · S4 no signal', ms: 5000 }); }, 2200)); };
  const goalElsewhere = () => {
    setMatches((l) => l.map((m) => (m.id === 'levante' ? { ...m, hs: 1 } : m)));
    setFlashId('levante');
    timers.current.push(setTimeout(() => setFlashId(null), 2600));
    push({ kind: 'goal', title: 'Goal · Levante 1–0 Athletic Club', body: '56′ Roger Brugué', actions: [{ label: 'Switch to it', run: () => select('levante') }] });
  };
  const changeScenario = (s) => {
    setScenario(s); setT(0); setBehind(0); setCatchup(true); setSources(SOURCES0); setPgm(1); setLastCut(null);
    setListTab(s === 'live' ? 'live' : s === 'finished' ? 'done' : 'next');
    setTab(s === 'live' ? 'Catch-up' : 'Lineups');
  };

  // ---- keyboard
  useEffect(() => {
    const on = (e) => {
      if (e.key === 'Escape') { setDialog(null); return; }
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      else if (/^[1-4]$/.test(e.key)) cut(Number(e.key));
      else if (e.key.toLowerCase() === 'a') setMode((m) => (m === 'watch' ? 'analyse' : 'watch'));
      else if (e.key.toLowerCase() === 'g') setGuard((g) => !g);
      else if (e.key === '?') setDialog('help');
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [cut]);

  const monitorProps = { scenario, meta: META, view, guard, held, src: cur, lost, bestSrc: srcs.filter((s) => s.state !== 'dead' && s.id !== pgm).sort((a, b) => a.delay - b.delay)[0], auto: auto.on, onCut: cut, mode, onMode: () => setMode(mode === 'watch' ? 'analyse' : 'watch'), delay, headSec, behind, countdown: 'Starts in 47:00.' };
  const offline = conn !== 'ok';

  return (
    <div className="gl flex h-screen min-w-[1180px] flex-col overflow-hidden">
      <style>{CSS}</style>

      <header className="bar flex shrink-0 items-center gap-5 px-4" style={{ height: 46 }}>
        <div className="flex items-center gap-2.5"><Tally kind="pgm" pulse size={10} /><span className="text-[16px] font-semibold tracking-tight">Gallery</span></div>
        <span className="flex items-center gap-2 text-[12px]"><Tally kind={offline ? 'warn' : 'pvw'} size={7} /><span className={offline ? 't-amber' : 't-dim'}>{offline ? 'Backend unreachable' : 'Connected · feeds checked every 10s'}</span></span>
        <span className="flex-1" />
        <label className="flex items-center gap-2 text-[12.5px]"><Icon name={guard ? 'eyeoff' : 'eye'} size={15} className={guard ? 't-amber' : 't-dim'} />Spoiler guard<Kbd>G</Kbd><Switch on={guard} onChange={setGuard} label="Spoiler guard" /></label>
        <span className="mono t-dim text-[12px]" title="Seconds your video is behind the live data">delay {mmss(live ? delay + behind : 0)}</span>
        <span className="mono t-dim text-[12px]">{wall(t)}</span>
        <button type="button" className="btn" onClick={() => setDialog('feed')}><span className="inline-flex items-center gap-1.5"><Icon name="plus" size={13} />Add feed</span></button>
        <button type="button" className="ghost t-dim" onClick={() => setDialog('help')} aria-label="Keyboard shortcuts"><Icon name="help" size={17} /></button>
      </header>

      {offline && (
        <div className="flex shrink-0 items-center gap-3 px-4 py-1.5 text-[12.5px]" style={{ background: 'rgba(255,176,32,.14)', borderBottom: '1px solid var(--amber)' }}>
          <Icon name="bolt" size={14} className="t-amber" /><span><b>Backend unreachable.</b> Showing the last known state. Cutting and scanning are paused.</span><span className="flex-1" /><button type="button" className="btn" onClick={() => setConn('ok')}>Retry now</button>
        </div>
      )}

      <div className="grid min-h-0 flex-1" style={{ gridTemplateColumns: '300px minmax(0,1fr) 340px', opacity: offline ? 0.8 : 1 }}>
        <Rundown matches={rundown} selectedId="nassr" onSelect={select} favs={favs} onFav={toggleFav} query={query} setQuery={setQuery} tab={listTab} setTab={setListTab} favOnly={favOnly} setFavOnly={setFavOnly} flashId={flashId} searchRef={searchRef} />

        <main className="relative flex min-h-0 min-w-0 flex-col" style={{ background: 'var(--bg)' }}>
          <MatchHeader meta={META} view={view} guard={guard} held={held} scenario={scenario} dataSec={dataSec} />
          {mode === 'watch' ? (
            <div className="shrink-0 px-4 py-3" style={{ background: '#0e0d0c', borderBottom: '1px solid var(--line)' }}><Monitor {...monitorProps} /></div>
          ) : <Monitor {...monitorProps} pip />}
          <Timeline scenario={scenario} meta={META} d={base} mom={mom} dataSec={dataSec} edgeSec={edgeSec} headSec={headSec} guard={guard} onSeek={seek} onLive={() => setBehind(0)} />
          <Desk d={view} meta={META} scenario={scenario} tab={tab} setTab={setTab} locked={locked} held={held} dataSec={dataSec} edgeSec={edgeSec} onSeek={seek} catchup={catchup} dismissCatchup={() => { setCatchup(false); setTab('Lineups'); }} shotLimit={shotLimit} clearPip={mode === 'analyse'} />
        </main>

        <Sources sources={srcs} pgm={pgm} scenario={scenario} onCut={cut} auto={auto} setAuto={setAuto} log={log} canUndo={!!lastCut && live && srcs.find((s) => s.id === lastCut.from)?.state !== 'dead'} onUndo={() => undo(lastCut.from, lastCut.to)} onScan={scan} scanning={scanning} conn={conn} />
      </div>

      <Toasts list={toasts} dismiss={dismiss} />

      {dialog === 'feed' && (
        <Modal title="Add a feed" onClose={() => setDialog(null)}>
          <p className="t-dim mb-3 text-[12.5px]">Paste a stream address you captured yourself. It joins this match as another source.</p>
          <div className="space-y-3">
            <label className="block"><span className="t-dim mb-1 block text-[12px]">Stream address (.m3u8)</span><input type="text" placeholder="https://…/index.m3u8" autoFocus /></label>
            <label className="block"><span className="t-dim mb-1 block text-[12px]">Referer (the page it plays on)</span><input type="text" placeholder="https://…" /></label>
            <label className="block"><span className="t-dim mb-1 block text-[12px]">Name</span><input type="text" placeholder="Sky Sports Main Event" /></label>
          </div>
          <div className="mt-4 flex justify-end gap-2"><button type="button" className="btn" onClick={() => setDialog(null)}>Cancel</button><button type="button" className="btn btn-cut" onClick={() => { setDialog(null); push({ kind: 'info', title: 'Prototype', body: 'In the real app this would add the feed as S5.', ms: 3500 }); }}>Add feed</button></div>
        </Modal>
      )}
      {dialog === 'help' && (
        <Modal title="Keyboard" onClose={() => setDialog(null)}>
          <ul className="space-y-2">{SHORTCUTS.map(([k, v]) => <li key={k} className="flex items-center justify-between text-[13px]"><span>{v}</span><span className="flex gap-1">{k.split(' ').map((x, i) => (x === '–' ? <span key={i} className="t-faint">–</span> : <Kbd key={i}>{x}</Kbd>))}</span></li>)}</ul>
        </Modal>
      )}

      <div className="fixed bottom-3 left-3 z-[60] text-[12px]" style={{ fontFamily: 'system-ui, sans-serif' }}>
        {demo && (
          <div className="mb-2 w-[260px] space-y-3 rounded-md bg-white p-3 text-[#16140f] shadow-2xl">
            <div><div className="mb-1 font-semibold">Show me</div><div className="flex gap-1">{[['live', 'Live'], ['finished', 'Finished'], ['pre', 'Pre-match']].map(([k, l]) => <button key={k} type="button" onClick={() => changeScenario(k)} className="flex-1 rounded border px-2 py-1" style={{ background: scenario === k ? '#16140f' : '#fff', color: scenario === k ? '#fff' : '#16140f', borderColor: '#bbb' }}>{l}</button>)}</div></div>
            <div className="space-y-1.5">
              <button type="button" className="w-full rounded border border-[#bbb] px-2 py-1.5 text-left disabled:opacity-40" onClick={killCurrent} disabled={!live || lost}>Kill the on-air source</button>
              <button type="button" className="w-full rounded border border-[#bbb] px-2 py-1.5 text-left disabled:opacity-40" onClick={reviveAll} disabled={!live}>Bring the sources back</button>
              <button type="button" className="w-full rounded border border-[#bbb] px-2 py-1.5 text-left" onClick={goalElsewhere}>Goal in another match</button>
              <button type="button" className="w-full rounded border border-[#bbb] px-2 py-1.5 text-left" onClick={() => setConn(offline ? 'ok' : 'off')}>Backend {offline ? 'back online' : 'goes offline'}</button>
              <button type="button" className="w-full rounded border border-[#bbb] px-2 py-1.5 text-left" onClick={() => { changeScenario('live'); setGuard(true); }}>Replay the spoiler guard</button>
            </div>
            <p className="text-[11px] text-[#6b665a]">Prototype controls. Not part of the design.</p>
          </div>
        )}
        <button type="button" onClick={() => setDemo(!demo)} className="rounded-full bg-white px-3 py-1.5 font-semibold shadow-lg" style={{ color: '#16140f' }} aria-expanded={demo}>{demo ? 'Hide' : 'Demo controls'}</button>
      </div>
    </div>
  );
}
