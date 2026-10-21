import { useRef, useState } from 'react';
import { Shield, Icon, Tally, EventGlyph, FakeVideo, Kbd } from './bits.jsx';
import { DVR_SEC } from './mock.js';
import { mmss } from './time.js';
import { kindOf, surname } from '../matchData.js';

// ---------------------------------------------------------------------------------------------
export function MatchHeader({ meta, view, guard, held, scenario, dataSec }) {
  const live = scenario === 'live';
  const status = scenario === 'pre' ? 'Kick-off 19:00' : scenario === 'finished' ? 'Full time' : `${mmss(dataSec)} · 2nd half`;
  const shown = held != null;
  return (
    <header className="flex items-center gap-5 px-4 py-2.5" style={{ borderBottom: '1px solid var(--line)' }}>
      <div className="flex shrink-0 items-center gap-3">
        <Shield color={meta.hc} label={meta.home} size={30} />
        <span className="whitespace-nowrap text-[18px] font-semibold">{meta.home}</span>
        <span key={`${view.home.score}-${view.away.score}`} className="mono flash whitespace-nowrap rounded-sm px-2.5 py-0.5 text-[24px] font-semibold leading-tight" aria-label={`Score ${view.home.score ?? 0} to ${view.away.score ?? 0}`} style={{ background: '#0f0e0d', border: '1px solid var(--line2)' }}>
          {scenario === 'pre' ? 'v' : `${view.home.score}–${view.away.score}`}
        </span>
        <span className="whitespace-nowrap text-[18px] font-semibold">{meta.away}</span>
        <Shield color={meta.ac} label={meta.away} size={30} />
      </div>
      <span className="flex-1" />
      <div className="flex min-w-0 flex-col items-end gap-1 text-[12px]">
        <span className="flex items-center gap-2"><Tally kind={live ? 'pgm' : 'off'} pulse={live} size={7} /><span className={`mono ${live ? 't-red' : 't-dim'}`}>{status}</span><span className="t-dim">· {meta.league}</span></span>
        {live && guard && (
          <span className="flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-0.5" style={{ background: shown ? 'rgba(255,176,32,.12)' : 'rgba(53,208,127,.1)', border: `1px solid ${shown ? 'var(--amber)' : '#245c3f'}` }}>
            <Icon name={shown ? 'eyeoff' : 'eye'} size={13} className={shown ? 't-amber' : 't-green'} />
            {shown ? <span>Score held back <span className="mono t-amber">· reveals in {mmss(held)}</span></span> : <span className="t-green">Spoiler guard · in sync</span>}
          </span>
        )}
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------------------------
function Scorebug({ meta, view, held, guard, small }) {
  return (
    <div className="absolute left-3 top-3 flex items-stretch overflow-hidden text-[13px]" style={{ transform: small ? 'scale(.7)' : undefined, transformOrigin: '0 0', boxShadow: '0 2px 10px rgba(0,0,0,.5)', borderRadius: 2 }} aria-hidden="true">
      <span style={{ width: 5, background: meta.hc }} />
      <span className="bg-black/85 px-2 py-1 font-semibold">{meta.ha}</span>
      <span className="mono bg-white px-2 py-1 font-semibold text-black">{view.home.score ?? 0}</span>
      <span className="mono bg-white px-2 py-1 font-semibold text-black" style={{ borderLeft: '1px solid #ccc' }}>{view.away.score ?? 0}</span>
      <span className="bg-black/85 px-2 py-1 font-semibold">{meta.aa}</span>
      <span style={{ width: 5, background: meta.ac }} />
      {guard && held != null && <span className="flex items-center bg-[#ffb020] px-1.5 text-[10px] font-bold text-black">HELD</span>}
    </div>
  );
}

function Bars({ text, sub }) {
  const c = ['#d8d8d8', '#d8d800', '#00d8d8', '#00d800', '#d800d8', '#d80000', '#0000d8'];
  return (
    <div className="absolute inset-0 flex flex-col" aria-hidden="true">
      <div className="flex flex-[3]">{c.map((x) => <span key={x} className="flex-1" style={{ background: x, opacity: 0.55 }} />)}</div>
      <div className="flex flex-1"><span className="flex-[1.2]" style={{ background: '#001a47' }} /><span className="flex-[1.2]" style={{ background: '#fff', opacity: 0.8 }} /><span className="flex-[1.2]" style={{ background: '#2b0050' }} /><span className="flex-[3]" style={{ background: '#111' }} /></div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-center">
        <span className="text-[22px] font-semibold">{text}</span>
        <span className="t-dim text-[13px]">{sub}</span>
      </div>
    </div>
  );
}

export function Monitor({ pip, scenario, meta, view, guard, held, src, lost, bestSrc, auto, onCut, onMode, mode, delay, headSec, behind, countdown }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [vol, setVol] = useState(70);
  const frame = pip
    ? { position: 'absolute', right: 16, bottom: 16, width: 400, zIndex: 20, boxShadow: '0 12px 34px rgba(0,0,0,.65)', border: '1px solid var(--line2)' }
    : { width: 'min(100%, calc(max(44vh, 100vh - 560px) * 1.7778))', margin: '0 auto', border: '1px solid var(--line2)' };
  const onAir = scenario === 'live' && !lost;
  const tcText = scenario === 'live' ? `${mmss(headSec)} / live ${behind > 0 ? `−${mmss(behind + delay)}` : delay ? `−${mmss(delay)}` : ''}` : scenario === 'finished' ? '96:00 / 96:00' : '--:--';
  return (
    <div style={{ ...frame, background: '#000' }} className="group">
      <div ref={ref} className="relative overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
        {scenario === 'pre' ? <Bars text="Waiting for kick-off" sub={`Streams open about ten minutes before. ${countdown}`} />
          : scenario === 'finished' ? <><FakeVideo tint={0} dim /><div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 text-center"><span className="text-[22px] font-semibold">Full time</span><span className="t-dim text-[13px]">The stream has ended</span></div></>
            : lost ? <><FakeVideo dead tint={1} /><div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-center"><span className="text-[22px] font-semibold">No signal</span><span className="t-dim text-[13px]">{src.name} stopped sending video</span>{!pip && (auto ? <span className="t-green text-[13px]">Auto-failover is looking for another source…</span> : bestSrc && <button type="button" className="btn btn-cut mt-1" onClick={() => onCut(bestSrc.id)}>Cut to {bestSrc.name}</button>)}</div></>
              : <FakeVideo tint={src.id} />}
        {scenario !== 'pre' && <Scorebug meta={meta} view={view} held={held} guard={guard} small={pip} />}
        {scenario === 'live' && src && (
          <div className="absolute right-3 top-3 flex items-center gap-2 rounded-sm bg-black/70 px-2 py-1 text-[12px]">
            <Tally kind={lost ? 'off' : 'pgm'} pulse={onAir} size={8} />
            <span className="mono">S{src.id}</span><span>{src.name}</span><span className="t-dim">{lost ? 'lost' : src.res}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-3 py-2" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,.85))' }}>
          <button type="button" className="ghost" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}><Icon name={playing ? 'pause' : 'play'} size={18} /></button>
          {!pip && <><Icon name="vol" size={16} className="t-dim" /><input type="range" min="0" max="100" value={vol} onChange={(e) => setVol(+e.target.value)} aria-label="Volume" style={{ width: 84, accentColor: '#ebe7dd' }} /></>}
          <span className="mono ml-1 text-[12px]" style={{ color: '#d8d4ca', textShadow: '0 1px 3px #000' }}>{tcText}</span>
          <span className="flex-1" />
          {!pip && <span className="mono t-dim rounded-sm border px-1.5 text-[11px]" style={{ borderColor: 'var(--line2)' }}>{src?.res || '—'}</span>}
          <button type="button" className="ghost" aria-label="Picture in picture" title="Picture in picture"><Icon name="pip" size={16} /></button>
          <button type="button" className="ghost" aria-label={mode === 'watch' ? 'Analyse mode' : 'Back to watching'} title={mode === 'watch' ? 'Analyse (A)' : 'Watch (A)'} aria-pressed={mode === 'analyse'} onClick={onMode}><Icon name="theatre" size={16} /></button>
          <button type="button" className="ghost" aria-label="Fullscreen" onClick={() => ref.current?.requestFullscreen?.()}><Icon name="full" size={16} /></button>
        </div>
      </div>
      {pip && <div className="bar flex items-center justify-between px-2 py-1 text-[11.5px]" style={{ borderTop: '1px solid var(--line)', borderBottom: 0 }}><span className="t-dim">On air · S{src?.id}</span><span className="t-dim">Back to watching <Kbd>A</Kbd></span></div>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The timeline: like a video editor's. Momentum is the waveform (the home side up, the away side
// down), incidents are flags, the red line is live, the white line is where you're watching, and
// the amber stripes are how far behind live that is. Click a flag to jump there, inside the buffer.
const AXIS = 96;

export function Timeline({ scenario, meta, d, mom, dataSec, edgeSec, headSec, guard, onSeek, onLive }) {
  const pct = (sec) => `${Math.max(0, Math.min(100, ((sec / 60) / AXIS) * 100))}%`;
  const px = (sec) => ((sec / 60) / AXIS) * 1000;
  const live = scenario === 'live';
  const pre = scenario === 'pre';
  const events = d.timeline.filter((e) => e.side).filter((e) => !(live && guard) || e.min * 60 <= headSec);
  const dvrFrom = edgeSec - DVR_SEC;
  const behindLive = live ? Math.max(0, dataSec - headSec) : 0;

  const wave = (sign) => {
    const pts = mom.map((v, i) => [px((i + 1) * 60), 40 - sign * Math.max(0, sign * v) * 36]);
    return `M0 40 ${pts.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')} L${pts.length ? pts[pts.length - 1][0].toFixed(1) : 0} 40Z`;
  };

  return (
    <section className="px-4 pb-2 pt-2.5" aria-label="Timeline" style={{ borderBottom: '1px solid var(--line)' }}>
      <div className="mb-1.5 flex items-center gap-3 whitespace-nowrap text-[12px]">
        <h3 className="font-semibold">Timeline</h3>
        {live && (
          <>
            <span className="mono t-dim">watching {mmss(headSec)}</span>
            <span className="mono t-red">live {mmss(dataSec)}</span>
            {behindLive > 1 && <span className="mono t-amber">{mmss(behindLive)} behind live</span>}
          </>
        )}
        <span className="flex-1" />
        {live && <span className="t-faint hidden 2xl:inline">You can seek back about {mmss(DVR_SEC)}</span>}
        <button type="button" className="btn" onClick={onLive} disabled={!live || behindLive < 1.5} style={{ padding: '2px 9px' }}>
          <span className="inline-flex items-center gap-1.5"><Tally kind="pgm" size={6} />Go live</span>
        </button>
      </div>

      <div className="relative" style={{ height: 104 }} onClick={(e) => {
        if (!live) return onSeek(null);
        const r = e.currentTarget.getBoundingClientRect();
        onSeek(Math.round(((e.clientX - r.left) / r.width) * AXIS * 60));
      }} role="group" aria-label="Match timeline">
        {pre ? (
          <div className="flex h-full items-center justify-center rounded-sm text-[12.5px] t-dim" style={{ border: '1px dashed var(--line2)' }}>The timeline starts at kick-off.</div>
        ) : (
          <>
            <svg viewBox="0 0 1000 80" preserveAspectRatio="none" className="absolute inset-x-0" style={{ top: 14, height: 72, width: '100%' }} aria-hidden="true">
              <defs>
                <pattern id="gl-stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="rgba(255,176,32,.08)" /><rect width="3" height="8" fill="rgba(255,176,32,.28)" /></pattern>
                <pattern id="gl-future" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#171614" /><rect width="1" height="6" fill="#262522" /></pattern>
              </defs>
              <rect width="1000" height="80" fill="#121110" />
              {live && <rect x={px(dataSec)} width={1000 - px(dataSec)} height="80" fill="url(#gl-future)" />}
              {live && <rect x={px(dvrFrom)} width={px(DVR_SEC)} height="80" fill="rgba(255,255,255,.045)" />}
              <path d={wave(1)} fill={meta.hc} opacity=".8" /><path d={wave(-1)} fill={meta.ac} opacity=".8" />
              <path d="M0 40H1000" stroke="#47443d" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              {[15, 30, 45, 60, 75].map((m) => <path key={m} d={`M${px(m * 60)} 0V80`} stroke="#2b2925" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
              <path d={`M${px(45 * 60)} 0V80`} stroke="#5a564d" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
              {live && behindLive > 1 && <rect x={px(headSec)} width={px(dataSec) - px(headSec)} height="80" fill="url(#gl-stripes)" />}
            </svg>

            {events.map((e) => {
              const sec = e.min * 60;
              const kind = kindOf(e);
              const outside = live && sec < dvrFrom;
              const home = e.side === 'home';
              const big = kind !== 'sub';
              return (
                <button
                  key={e.id} type="button" onClick={(ev) => { ev.stopPropagation(); onSeek(sec); }}
                  aria-label={`${e.clock} ${e.label}, ${surname(e.player)}${outside ? ' (outside the buffer)' : ''}`} title={`${e.clock} ${e.label} · ${e.player}${outside ? '\nOutside the buffer' : ''}`}
                  className="absolute flex -translate-x-1/2 items-center justify-center"
                  style={{ left: pct(sec), top: home ? (big ? 14 : 24) : undefined, bottom: home ? undefined : (big ? 18 : 28), background: 'none', border: 0, padding: 0, opacity: outside ? 0.45 : 1 }}
                >
                  <span style={{ background: '#151412', borderRadius: '50%', padding: 1.5, boxShadow: `0 0 0 1.5px ${home ? meta.hc : meta.ac}` }}><EventGlyph e={e} size={big ? 15 : 10} /></span>
                </button>
              );
            })}

            {live && <div className="pointer-events-none absolute" style={{ left: pct(dataSec), top: 6, bottom: 18, borderLeft: '2px solid var(--red)' }}><span className="mono absolute -top-0.5 left-1 bg-[var(--red)] px-1 text-[9.5px] font-bold text-black">LIVE</span></div>}
            {live && <div className="pointer-events-none absolute" style={{ left: pct(headSec), top: 6, bottom: 18, borderLeft: '2px solid #fff' }}><span className="absolute -left-[5px] -top-[5px]" style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '7px solid #fff' }} /></div>}
            {live && <div className="pointer-events-none absolute top-[14px]" style={{ left: pct(dvrFrom), width: pct(DVR_SEC), height: 80, border: '1px dashed rgba(255,255,255,.28)', borderTop: 0 }} aria-hidden="true" />}
            {scenario === 'finished' && <div className="pointer-events-none absolute" style={{ left: pct(5760), top: 14, height: 80, borderLeft: '2px solid #5a564d' }} />}
          </>
        )}
        <div className="mono t-faint absolute inset-x-0 bottom-0 h-[14px] text-[10.5px]" aria-hidden="true">
          {[0, 15, 30, 45, 60, 75, 90].map((m) => <span key={m} className="absolute -translate-x-1/2" style={{ left: pct(m * 60) }}>{m === 45 ? 'HT' : `${m}'`}</span>)}
        </div>
      </div>
    </section>
  );
}
