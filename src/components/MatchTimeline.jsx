// Match timeline, MOCK DATA for now. The vertical axis is real match time: 11px per minute, so a quiet
// stretch looks quiet and a burst of events looks like a burst. Home events hang off the left of the
// spine, away events off the right. The coloured part of the spine is time played; the dashed part is
// still to come.

import { useEffect, useRef } from 'react';

const PX = 11;
const END = 95; // minutes drawn (90 + a little stoppage)
const NOW = 62;

const HOME = { name: 'Como', short: 'COM', color: '#5aa0ff' };
const AWAY = { name: 'Manchester United', short: 'MAN', color: '#ff7a6b' };

const EVENTS = [
  { min: 6, side: 'a', kind: 'yellow', who: 'Casemiro', note: 'Late challenge' },
  { min: 12, side: 'h', kind: 'goal', who: 'Nico Paz', note: 'Assist: Fadera', score: '1–0' },
  { min: 27, side: 'h', kind: 'yellow', who: 'Perrone', note: 'Dissent' },
  { min: 38, side: 'a', kind: 'goal', who: 'Fernandes', note: 'Penalty', score: '1–1' },
  { min: 46, side: 'a', kind: 'yellow', who: 'Mainoo', note: '45+2′' },
  { min: 52, side: 'h', kind: 'sub', who: 'Douvikas', note: 'for Cutrone' },
  { min: 58, side: 'h', kind: 'goal', who: 'Douvikas', note: 'Assist: Paz', score: '2–1' },
  { min: 61, side: 'a', kind: 'sub', who: 'Zirkzee', note: 'for Mount' },
];

const y = (min) => min * PX;

function Marker({ kind, color }) {
  if (kind === 'goal') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-950" style={{ boxShadow: `0 0 0 2px ${color}` }}>
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="#fff" strokeWidth="1.5" aria-hidden="true">
          <circle cx="10" cy="10" r="7.5" /><path d="m10 6 3 2.2-1.1 3.5H8.1L7 8.2 10 6Z" fill="#fff" stroke="none" />
        </svg>
      </span>
    );
  }
  if (kind === 'yellow') return <span className="block h-[17px] w-3 rounded-[2px] bg-amber" style={{ boxShadow: '0 0 0 2px #0a1018' }} />;
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-950 text-mint" style={{ boxShadow: '0 0 0 2px #0a1018' }}>
      <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 15V5M4 8l3-3 3 3M13 5v10M10 12l3 3 3-3" /></svg>
    </span>
  );
}

function Item({ e }) {
  const home = e.side === 'h';
  const team = home ? HOME : AWAY;
  const goal = e.kind === 'goal';
  return (
    <div className="absolute inset-x-0" style={{ top: y(e.min) - 14 }}>
      <div className="absolute left-1/2 top-[14px] -translate-x-1/2 -translate-y-1/2">
        <Marker kind={e.kind} color={team.color} />
      </div>
      <div
        className={`absolute top-0 flex w-[calc(50%-24px)] flex-col ${home ? 'right-[calc(50%+14px)] items-end text-right' : 'left-[calc(50%+14px)] items-start text-left'}`}
        style={{ minHeight: 28 }}
      >
        <div className={`flex max-w-full items-baseline gap-1.5 ${home ? 'flex-row-reverse' : ''}`}>
          <span className={`truncate font-semibold leading-tight ${goal ? 'text-[15px] text-white' : 'text-[13px] text-gray-100'}`}>{e.who}</span>
          <span className="shrink-0 font-mono text-[10.5px] text-muted">{e.min}′</span>
        </div>
        <div className={`flex items-center gap-1.5 text-[11px] leading-tight text-muted ${home ? 'flex-row-reverse' : ''}`}>
          <span className="truncate">{e.note}</span>
          {e.score && <span className="shrink-0 rounded px-1 font-mono text-[11px] font-bold text-ink-950" style={{ background: team.color }}>{e.score}</span>}
        </div>
      </div>
    </div>
  );
}

export default function MatchTimeline() {
  const scroller = useRef(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = Math.max(0, y(NOW) - el.clientHeight * 0.65);
  }, []);
  const ticks = [];
  for (let m = 0; m <= END; m += 5) ticks.push(m);

  return (
    <section className="panel flex h-full min-h-0 flex-col overflow-hidden" aria-label="Match timeline (mock data)">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold text-gray-50">Timeline</h2>
          <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-muted">mock data</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-sm font-bold">
          <span style={{ color: HOME.color }}>{HOME.short}</span>
          <span className="text-white">2 – 1</span>
          <span style={{ color: AWAY.color }}>{AWAY.short}</span>
        </div>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-6">
        <div className="relative mx-auto" style={{ height: y(END) + 8 }}>
          {/* halves */}
          <div className="absolute inset-x-0 rounded-md bg-white/[0.02]" style={{ top: 0, height: y(48.5) - 6 }} aria-hidden="true" />
          <span className="absolute -top-3.5 left-0 font-mono text-[10px] uppercase tracking-widest text-muted/60">1st half</span>
          <div className="absolute inset-x-0 flex items-center gap-2" style={{ top: y(48.5) }} aria-hidden="true">
            <span className="h-px flex-1 bg-line" /><span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted">half time</span><span className="h-px flex-1 bg-line" />
          </div>

          {/* spine: played (solid) and to come (dashed) */}
          <div className="absolute left-1/2 top-0 w-[3px] -translate-x-1/2 rounded-full" style={{ height: y(NOW), background: `linear-gradient(${HOME.color}, ${AWAY.color})` }} aria-hidden="true" />
          <div className="absolute left-1/2 w-0 -translate-x-1/2 border-l-2 border-dashed border-line" style={{ top: y(NOW), height: y(END) - y(NOW) }} aria-hidden="true" />

          {[15, 30, 60, 75, 90].map((m) => (
            <span key={m} className="absolute left-0 -translate-y-1/2 font-mono text-[10px] text-muted/60" style={{ top: y(m) }} aria-hidden="true">{m}′</span>
          ))}
          {ticks.map((m) => (
            <span key={`t${m}`} className="absolute left-1/2 h-px w-2 -translate-x-1/2 bg-line" style={{ top: y(m) }} aria-hidden="true" />
          ))}

          {EVENTS.map((e) => <Item key={`${e.min}${e.who}`} e={e} />)}

          {/* now */}
          <div className="absolute inset-x-0 flex items-center" style={{ top: y(NOW) }}>
            <span className="h-px flex-1 bg-live/60" />
            <span className="mx-2 flex items-center gap-1.5 rounded-full bg-live px-2.5 py-1 font-mono text-[11px] font-bold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white motion-safe:animate-pulse" aria-hidden="true" />
              {NOW}′
            </span>
            <span className="h-px flex-1 bg-live/60" />
          </div>
        </div>
      </div>
    </section>
  );
}
