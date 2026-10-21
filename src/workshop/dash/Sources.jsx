import { useState } from 'react';
import { Tally, Icon, Switch, Spark, Kbd, FakeVideo } from './bits.jsx';
import { mmss } from './time.js';

// Sources: every feed of this match as a preview monitor. One is on air (red tally); the rest can be
// cut to with one click or a number key. The mixer also knows which feed is closest to live.

function Tile({ s, pgm, best, scenario, expanded, onToggle, onCut, bestDelay }) {
  const live = scenario === 'live';
  const dead = s.state === 'dead' && live;
  const onAir = pgm && live && !dead;
  const lag = s.delay != null ? s.delay - bestDelay : null;
  const isBest = best && !dead && live;
  const kind = !live ? 'off' : dead ? 'off' : onAir ? 'pgm' : lag != null && lag >= 25 ? 'warn' : 'pvw';
  const status = scenario === 'pre' ? 'Waiting for kick-off' : scenario === 'finished' ? 'Ended' : dead ? `No signal · ${mmss(s.downFor)}` : onAir ? 'On air' : isBest ? 'Closest to live' : `${lag}s behind the best`;
  const statusColor = dead ? 't-faint' : onAir ? 't-red' : isBest ? 't-green' : lag >= 25 ? 't-amber' : 't-dim';

  return (
    <li className="panel" style={{ borderColor: onAir ? '#8a2a24' : undefined, boxShadow: onAir ? 'inset 3px 0 0 var(--red)' : undefined }}>
      <div className="flex gap-3 p-2.5">
        <div className="relative shrink-0 overflow-hidden bg-black" style={{ width: 104, height: 58, border: '1px solid var(--line2)' }}>
          {live ? <FakeVideo dead={dead} tint={s.id} /> : <div className="h-full w-full" style={{ background: '#0e0d0c' }} />}
          <span className="mono absolute left-1 top-1 rounded-sm bg-black/75 px-1 text-[10px]">S{s.id}</span>
          {dead && <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[10.5px] font-semibold">NO SIGNAL</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><Tally kind={kind} pulse={onAir} size={8} /><span className="truncate text-[13px] font-semibold" title={s.name}>{s.name}</span></div>
          <div className="t-dim mt-0.5 text-[11.5px]">{s.tag}{!dead && live ? ` · ${s.res} · ${s.mbps} Mb/s` : ''}</div>
          <div className={`mt-1 text-[12px] ${statusColor}`}>{status}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end justify-between">
          {onAir ? <span className="mono t-red text-[11px] font-semibold">PGM</span> : <button type="button" className="btn btn-cut" disabled={dead || !live} onClick={() => onCut(s.id)} aria-label={`Cut to ${s.name}`}>Cut <span className="mono t-faint ml-1">{s.id}</span></button>}
          <button type="button" className="ghost t-dim" onClick={onToggle} aria-expanded={expanded} aria-label={`${expanded ? 'Hide' : 'Show'} health of ${s.name}`} style={{ padding: 2 }}><Icon name="chev" size={15} className={expanded ? 'rotate-180' : ''} /></button>
        </div>
      </div>
      {expanded && (
        <div className="grid grid-cols-4 gap-2 px-2.5 pb-2.5 pt-1" style={{ borderTop: '1px solid var(--line)' }}>
          {[['Buffer', dead || !live ? '—' : `${s.buffer}s`], ['Dropped', dead || !live ? '—' : s.dropped], ['Delay', s.delay == null || !live ? '—' : mmss(s.delay)], ['Clock', dead || !live ? '—' : `${mmss(3730 - s.delay)}`]].map(([k, v]) => (
            <div key={k} className="pt-1.5"><div className="t-faint text-[10.5px]">{k}</div><div className="mono text-[12.5px]">{v}</div></div>
          ))}
          <div className="col-span-4">
            <div className="t-faint mb-0.5 flex justify-between text-[10.5px]"><span>Latency, last minute</span><span className="mono">{dead ? 'lost' : `${s.lat[s.lat.length - 1]}s`}</span></div>
            <Spark values={s.lat} width={300} height={28} color={dead ? 'var(--dead)' : lag >= 25 ? 'var(--amber)' : 'var(--green)'} fill />
          </div>
        </div>
      )}
    </li>
  );
}

function Stepper({ value, onChange, min, max, label }) {
  return (
    <span className="inline-flex items-center" aria-label={label}>
      <button type="button" className="btn" style={{ padding: '0 7px' }} onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Decrease ${label}`}>−</button>
      <span className="mono w-9 text-center text-[12.5px]">{value}s</span>
      <button type="button" className="btn" style={{ padding: '0 7px' }} onClick={() => onChange(Math.min(max, value + 1))} aria-label={`Increase ${label}`}>+</button>
    </span>
  );
}

export default function Sources({ sources, pgm, scenario, onCut, auto, setAuto, log, onUndo, canUndo, onScan, scanning, conn }) {
  const [open, setOpen] = useState(new Set([1]));
  const alive = sources.filter((s) => s.state !== 'dead');
  const bestDelay = alive.length ? Math.min(...alive.map((s) => s.delay)) : 0;
  const bestId = alive.find((s) => s.delay === bestDelay)?.id;
  const cur = sources.find((s) => s.id === pgm);
  const curLag = cur && cur.state !== 'dead' ? cur.delay - bestDelay : 0;

  return (
    <section className="panel flex min-h-0 flex-col" aria-label="Sources" style={{ borderTop: 0, borderBottom: 0, borderRight: 0 }}>
      <div className="bar flex items-center justify-between px-3 py-2">
        <h2 className="text-[13px] font-semibold">Sources <span className="t-dim mono ml-1 font-normal">{alive.length}/{sources.length}</span></h2>
        <button type="button" className="btn" onClick={onScan} disabled={conn !== 'ok'}>{scanning ? 'Reading clocks…' : 'Scan clocks'}</button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
        {scenario === 'live' && curLag >= 5 && cur?.state !== 'dead' && (
          <div className="flex items-center gap-2 rounded-sm px-2.5 py-2 text-[12px]" style={{ background: 'rgba(53,208,127,.09)', border: '1px solid #245c3f' }}>
            <Icon name="bolt" size={14} className="t-green" />
            <span className="flex-1"><b>{sources.find((s) => s.id === bestId)?.name}</b> is {curLag}s closer to live.</span>
            <button type="button" className="btn" onClick={() => onCut(bestId)}>Cut <Kbd>{bestId}</Kbd></button>
          </div>
        )}
        {scenario !== 'live' && <p className="t-dim px-1 text-[12px]">{scenario === 'pre' ? 'Feeds appear here once the streams open, usually 30 to 10 minutes before kick-off. These four were found.' : 'This match has finished, so the feeds have ended.'}</p>}
        <ul className="space-y-2">
          {sources.map((s) => (
            <Tile key={s.id} s={s} pgm={s.id === pgm} best={s.id === bestId} scenario={scenario} bestDelay={bestDelay} expanded={open.has(s.id)} onCut={onCut}
              onToggle={() => setOpen((o) => { const n = new Set(o); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); return n; })} />
          ))}
        </ul>
      </div>

      <div className="space-y-3 border-t p-3" style={{ borderColor: 'var(--line)', background: '#191816' }}>
        <div className="flex items-center gap-2">
          <Icon name="bolt" size={15} className={auto.on ? 't-green' : 't-faint'} />
          <div className="flex-1"><div className="text-[13px] font-semibold">Auto-failover</div><div className="t-dim text-[11.5px]">{auto.on ? 'Cuts to the best live feed for you' : 'Off: you cut by hand'}</div></div>
          <Switch on={auto.on} onChange={(on) => setAuto({ ...auto, on })} label="Auto-failover" />
        </div>
        <div className="space-y-1.5 text-[12px]" style={{ opacity: auto.on ? 1 : 0.5 }}>
          <div className="flex items-center justify-between gap-2"><span>Cut if a feed stalls for</span><Stepper value={auto.stall} min={2} max={30} label="stall seconds" onChange={(stall) => setAuto({ ...auto, stall })} /></div>
          <div className="flex items-center justify-between gap-2"><span>…or falls behind the best by</span><Stepper value={auto.lag} min={5} max={90} label="lag seconds" onChange={(lag) => setAuto({ ...auto, lag })} /></div>
        </div>
        <ul className="space-y-1 text-[11.5px]" aria-label="Failover log">
          {log.slice(0, 3).map((l, i) => (
            <li key={i} className="flex items-start gap-2"><span className="mono t-faint shrink-0">{l.at}</span><span className={i === 0 ? '' : 't-dim'}>{l.text}</span></li>
          ))}
          {canUndo && <li><button type="button" className="btn mt-1" onClick={onUndo}><span className="inline-flex items-center gap-1.5"><Icon name="undo" size={12} />Undo last cut</span></button></li>}
        </ul>
        <div className="flex items-center gap-2 border-t pt-2.5 text-[11.5px]" style={{ borderColor: 'var(--line)' }}>
          <Tally kind={scenario === 'live' ? 'pvw' : 'off'} size={7} />
          <span className="t-dim flex-1">Match clock read from the video, {scenario === 'live' ? '94% sure' : 'not running'}</span>
          <button type="button" className="ghost t-dim" style={{ textDecoration: 'underline' }}>Calibrate</button>
        </div>
      </div>
    </section>
  );
}
