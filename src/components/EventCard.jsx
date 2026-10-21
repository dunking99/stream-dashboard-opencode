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

const RAIL_MS = 3 * 60 * 60 * 1000; // the rail fills over the last 3 hours before kickoff

export default function EventCard({ ev, now, open, isPlaying = false, showLeague = false, layout = 'list' }) {
  const tbd = !ev.live && !ev.startMs;
  const w = ev.live || tbd ? null : whenOf(ev.startMs, now);
  const isLive = ev.live || w?.state === 'live';
  const parts = ev.title.split(/\s+(?:vs\.?|v)\s+/i);
  const sides = ev.teams
    ? ev.teams.map((t, i) => ({ name: parts.length === 2 ? parts[i] : t.name, logo: t.logo }))
    : [{ name: ev.title, logo: ev.leagueLogo }];

  const fill = isLive ? 100 : w && w.state !== 'ended' ? Math.max(0, Math.min(100, Math.round((1 - (ev.startMs - now) / RAIL_MS) * 100))) : 0;
  const [clock, ampm] = w ? w.time.split(/\s+/) : [];

  const fixture = layout === 'fixture' && sides.length === 2;

  return (
    <div>
      <div className="h-1 bg-line/60" aria-hidden="true">
        <div className={`h-full ${isLive ? 'bg-live' : 'bg-amber'}`} style={{ width: `${fill}%` }} />
      </div>
      {fixture ? (
        <>
      <div className="relative px-4 py-4">
        <Chevron open={open} className="absolute right-3 top-3 text-muted/50" />
        {/* the kickoff spans both rows so it sits in the middle of the card; names hang under their crests in a fixed two-line slot */}
        <div className="grid items-center gap-x-3 gap-y-2.5" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <div className="flex justify-center" style={{ gridColumn: 1, gridRow: 1 }}><Crest src={sides[0].logo} name={sides[0].name} size={64} /></div>
          <div className="flex flex-col items-center justify-center gap-1 text-center" style={{ gridColumn: 2, gridRow: '1 / span 2', minWidth: 92 }}>
            {tbd ? (
              <>
                <div className="text-2xl font-semibold leading-none text-muted/60">TBD</div>
                <div className="text-xs text-muted">Kickoff</div>
              </>
            ) : isLive ? (
              <>
                <span className="flex items-center gap-1.5 rounded-full bg-live/15 px-2.5 py-1 text-xs font-bold text-live">
                  <span className="h-1.5 w-1.5 rounded-full bg-live motion-safe:animate-pulse" aria-hidden="true" />
                  LIVE
                </span>
                <span className="text-xs text-muted">{w ? `Started ${w.time}` : '24/7'}</span>
              </>
            ) : (
              <>
                <span className="text-xs text-muted">{w.state === 'soon' ? 'Today' : w.state === 'ended' ? 'Finished' : w.label}</span>
                <span className={`whitespace-nowrap text-3xl font-semibold leading-none tabular ${w.state === 'ended' ? 'text-muted/50' : 'text-white'}`}>
                  {clock}{ampm && <span className="ml-0.5 text-xs font-medium text-muted">{ampm}</span>}
                </span>
                {w.state === 'soon' && <span className="text-xs font-semibold text-amber">{w.label}</span>}
              </>
            )}
            {isPlaying && <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-mint">Playing</span>}
          </div>
          <div className="flex justify-center" style={{ gridColumn: 3, gridRow: 1 }}><Crest src={sides[1].logo} name={sides[1].name} size={64} /></div>

          <span className="self-start text-center text-base font-semibold leading-tight text-gray-50" style={{ gridColumn: 1, gridRow: 2, minHeight: '2.5em' }}>{sides[0].name}</span>
          <span className="self-start text-center text-base font-semibold leading-tight text-gray-50" style={{ gridColumn: 3, gridRow: 2, minHeight: '2.5em' }}>{sides[1].name}</span>
        </div>
        {showLeague && ev.league && <div className="mt-2 truncate text-center text-[10px] uppercase tracking-wide text-muted/70">{ev.league}</div>}
      </div>
        </>
      ) : (
        <>
      <div className="flex items-center gap-4 px-4 py-4">
        <div className="min-w-0 flex-1 space-y-3">
          {sides.map((t, i) => (
            <div key={i} className="flex min-w-0 items-center gap-3.5">
              <Crest src={t.logo} name={t.name} size={36} />
              <span className="min-w-0 text-[17px] font-semibold leading-tight text-gray-50" style={clamp2}>{t.name}</span>
            </div>
          ))}
          {showLeague && ev.league && <div className="truncate pl-[50px] text-[10px] uppercase tracking-wide text-muted/70">{ev.league}</div>}
        </div>

        <div className="shrink-0 text-right">
          {tbd ? (
            <>
              <div className="text-2xl font-semibold leading-none text-muted/60">TBD</div>
              <div className="mt-1.5 text-xs text-muted">Kickoff</div>
            </>
          ) : isLive ? (
            <>
              <div className="flex items-center justify-end gap-1.5 text-base font-semibold text-live">
                <span className="h-2 w-2 rounded-full bg-live motion-safe:animate-pulse" aria-hidden="true" />
                Live
              </div>
              <div className="mt-1 text-xs text-muted">{w ? `Started ${w.time}` : '24/7'}</div>
            </>
          ) : (
            <>
              <div className={`whitespace-nowrap text-2xl font-semibold leading-none tabular ${w.state === 'ended' ? 'text-muted/50' : 'text-white'}`}>
                {clock}{ampm && <span className="ml-0.5 text-[11px] font-medium text-muted">{ampm}</span>}
              </div>
              <div className={`mt-1.5 text-xs ${w.state === 'soon' ? 'font-semibold text-amber' : 'text-muted'}`}>
                {w.label}
              </div>
            </>
          )}
          {isPlaying && <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-mint">Playing</div>}
        </div>

        <Chevron open={open} className="shrink-0 text-muted/60" />
      </div>
        </>
      )}
    </div>
  );
}
