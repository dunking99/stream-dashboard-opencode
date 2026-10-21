import { useState } from 'react';
import { whenOf } from '../eventTime';

export function Crest({ src, name, size = 24, round = false }) {
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size };
  if (!src || failed) {
    return (
      <span
        style={{ ...box, fontSize: size * 0.45 }}
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-ink-700 font-semibold text-gray-300"
        aria-hidden="true"
      >
        {(name || '?').trim()[0]?.toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      style={box}
      onError={() => setFailed(true)}
      className={`shrink-0 object-contain ${round ? 'rounded-full' : ''}`}
    />
  );
}

export function Chevron({ open, className = '' }) {
  return (
    <svg
      viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''} ${className}`}
    >
      <path d="m5 8 5 5 5-5" />
    </svg>
  );
}

const clamp2 = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };

export default function EventCard({ ev, now, open, isPlaying = false, showLeague = false }) {
  const tbd = !ev.live && !ev.startMs;
  const w = ev.live || tbd ? null : whenOf(ev.startMs, now);
  const isLive = ev.live || w?.state === 'live';
  const parts = ev.title.split(/\s+(?:vs\.?|v)\s+/i);
  const sides = ev.teams
    ? ev.teams.map((t, i) => ({ name: parts.length === 2 ? parts[i] : t.name, logo: t.logo }))
    : [{ name: ev.title, logo: ev.leagueLogo }];

  const edge = isPlaying ? 'bg-accent' : isLive ? 'bg-live/70' : 'bg-transparent';

  return (
    <div className={`relative grid grid-cols-[76px_minmax(0,1fr)_18px] items-center gap-x-3.5 px-3 py-4 ${isPlaying ? 'bg-accent/[0.07]' : isLive ? 'bg-live/[0.035]' : ''}`}>
      <span className={`absolute inset-y-2 left-0 w-[3px] rounded-r ${edge}`} aria-hidden="true" />

      <div className="flex flex-col items-center justify-center gap-1 self-stretch border-r border-line/70 pr-3 text-center">
        {tbd ? (
          <>
            <div className="font-display text-[19px] font-semibold leading-none text-muted/60">TBD</div>
            <div className="text-[10.5px] uppercase tracking-wider text-muted/70">Kickoff</div>
          </>
        ) : isLive ? (
          <>
            <span className="inline-flex items-center gap-1 rounded-full bg-live/15 px-2 py-1 text-[10.5px] font-bold uppercase leading-none tracking-wider text-live">
              <span className="h-1.5 w-1.5 rounded-full bg-live motion-safe:animate-pulse" aria-hidden="true" />
              Live
            </span>
            <div className="text-[11px] tabular text-muted/80">{w ? w.time : '24/7'}</div>
          </>
        ) : (
          <>
            <div className={`whitespace-nowrap font-display text-[21px] font-semibold leading-none tabular ${w.state === 'ended' ? 'text-muted/50' : 'text-gray-50'}`}>
              {w.time.split(/\s+/)[0]}
              {w.time.split(/\s+/)[1] && <span className="ml-0.5 text-[10px] font-medium text-muted">{w.time.split(/\s+/)[1]}</span>}
            </div>
            <div className={`text-[10.5px] uppercase tracking-wider ${w.state === 'soon' ? 'font-bold text-amber' : 'text-muted/70'}`}>{w.label}</div>
          </>
        )}
        {isPlaying && <span className="mt-0.5 rounded bg-mint/15 px-1.5 py-[3px] text-[9px] font-bold uppercase leading-none tracking-wider text-mint">Playing</span>}
      </div>

      <div className="min-w-0">
        <div className="space-y-2.5">
          {sides.map((t, i) => (
            <div key={i} className="grid grid-cols-[30px_minmax(0,1fr)] items-center gap-3">
              <Crest src={t.logo} name={t.name} size={30} />
              <span className={`min-w-0 text-[15px] leading-snug ${isPlaying ? 'font-semibold text-white' : 'font-medium text-gray-100'}`} style={clamp2}>{t.name}</span>
            </div>
          ))}
        </div>

        {showLeague && ev.league && (
          <div className="mt-2 truncate pl-[42px] text-[10px] uppercase tracking-wide text-muted/70">{ev.league}</div>
        )}
      </div>

      <Chevron open={open} className="text-muted/50" />
    </div>
  );
}
