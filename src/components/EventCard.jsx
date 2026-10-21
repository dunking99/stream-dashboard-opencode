import { useState } from 'react';
import { PLAYABLE, SITE_NAME, SITE_SHORT, sortSites } from '../siteMeta';
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
  const parts = ev.title.split(/\s+(?:vs\.?|v)\s+/i);
  const sides = ev.teams
    ? ev.teams.map((t, i) => ({ name: parts.length === 2 ? parts[i] : t.name, logo: t.logo }))
    : [{ name: ev.title, logo: ev.leagueLogo }];

  return (
    <div className={`flex items-start gap-3 border-l-2 px-3 py-3 ${isPlaying ? 'border-accent bg-accent/[0.06]' : 'border-transparent'}`}>
      <div className="w-12 shrink-0 text-center">
        {tbd ? (
          <>
            <div className="font-display text-lg font-semibold leading-none text-muted/60">TBD</div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-muted/70">Kickoff</div>
          </>
        ) : !w ? (
          <>
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wide text-live">
              <span className="h-1.5 w-1.5 rounded-full bg-live motion-safe:animate-pulse" aria-hidden="true" />
              Live
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-muted/70">24/7</div>
          </>
        ) : w.state === 'live' ? (
          <>
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wide text-live">
              <span className="h-1.5 w-1.5 rounded-full bg-live motion-safe:animate-pulse" aria-hidden="true" />
              Live
            </div>
            <div className="mt-1 text-[10px] tabular text-muted/70">{w.time}</div>
          </>
        ) : (
          <>
            <div className={`font-display text-lg font-semibold leading-none tabular ${w.state === 'ended' ? 'text-muted/50' : 'text-gray-100'}`}>{w.time}</div>
            <div className={`mt-1 text-[10px] uppercase tracking-wide ${w.state === 'soon' ? 'font-semibold text-amber' : 'text-muted/70'}`}>{w.label}</div>
          </>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="space-y-1.5">
          {sides.map((t, i) => (
            <div key={i} className="flex min-w-0 items-center gap-2">
              <Crest src={t.logo} name={t.name} size={22} />
              <span className="min-w-0 text-[13px] font-medium leading-snug text-gray-100" style={clamp2}>{t.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1">
          {showLeague && ev.league && (
            <span className="mr-1 max-w-full truncate text-[10px] uppercase tracking-wide text-muted/70">{ev.league}</span>
          )}
          {sortSites(ev.sites).map((s) => (
            <span
              key={s.site}
              title={SITE_NAME[s.site] || s.site}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${PLAYABLE.has(s.site) ? 'border border-accent/20 bg-accent/10 text-accent' : 'border border-line bg-ink-800 text-muted'}`}
            >
              {SITE_SHORT[s.site] || s.site}
            </span>
          ))}
          {isPlaying && <span className="ml-0.5 rounded bg-mint/10 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-mint">Playing</span>}
        </div>
      </div>

      <Chevron open={open} className="mt-1 shrink-0 text-muted/60" />
    </div>
  );
}
