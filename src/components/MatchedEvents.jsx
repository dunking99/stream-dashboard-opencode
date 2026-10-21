import { useEffect, useState } from 'react';
import EventCard, { Crest, Chevron } from './EventCard';
import { whenOf } from '../eventTime';
import { PLAYABLE, SITE_NAME, SITE_URL, sortSites } from '../siteMeta';

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function StreamClock({ playing, eventPath, index }) {
  if (!playing || playing.eventPath !== eventPath) return null;
  const secs = playing.clocks[index];
  if (secs == null) return <span className="text-[11px] text-muted/70">Clock not read</span>;
  const behind = playing.best - secs;
  return (
    <span className="flex items-center gap-2 text-[11px]">
      <span className="tabular font-medium text-gray-200">{mmss(secs)}</span>
      {behind < 1.5
        ? <span className="font-medium text-mint">Closest to live</span>
        : <span className="tabular text-amber">−{behind.toFixed(0)}s behind</span>}
    </span>
  );
}

const pathOf = (site, id) => (site === 'roxie' ? id : `${site}:${id}`);
const ended = (ev, now) => !ev.live && ev.startMs > 0 && whenOf(ev.startMs, now).state === 'ended';

export default function MatchedEvents({ onPlay, onRecheck, onShowSources, playing }) {
  const [sports, setSports] = useState([]);
  const [sport, setSport] = useState('football');
  const [events, setEvents] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [grouped, setGrouped] = useState(true);
  const [league, setLeague] = useState('all');
  const [open, setOpen] = useState(null);
  const [openSite, setOpenSite] = useState(null);
  const [options, setOptions] = useState({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('/api/matched-sports').then((r) => r.json()).then((d) => setSports(d.sports || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/matched-events-espn?sport=${sport}`);
        if (!res.ok) throw new Error('Failed to fetch events');
        const data = await res.json();
        if (cancelled) return;
        setEvents(Array.isArray(data.events) ? data.events : []);
        setErrors(data.errors || {});
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [sport]);

  const failed = Object.keys(errors);
  const q = query.trim().toLowerCase();

  const filtered = events.filter((ev) => {
    if (!showAll && ended(ev, now)) return false;
    if (!q) return true;
    const hay = [
      ev.title,
      ev.league,
      ev.country,
      ...(ev.teams || []).map((t) => t.name),
      ...(ev.sites || []).map((s) => SITE_NAME[s.site] || s.site),
    ].join(' ').toLowerCase();
    return hay.includes(q);
  });

  const rank = (ev) => (ev.live ? 0 : ended(ev, now) ? 2 : 1);
  const sorted = [...filtered].sort((a, b) => rank(a) - rank(b) || (a.startMs || 0) - (b.startMs || 0));

  const groups = [];
  for (const ev of sorted) {
    const name = ev.league || 'Other';
    let g = groups.find((x) => x.name === name);
    if (!g) groups.push(g = { name, country: ev.country, logo: ev.leagueLogo, events: [] });
    g.events.push(ev);
  }
  groups.sort((a, b) => (a.name === 'Other') - (b.name === 'Other') || (a.events[0]?.startMs || 0) - (b.events[0]?.startMs || 0));

  const leagueNames = groups.map((g) => g.name);
  const activeLeague = league !== 'all' && leagueNames.includes(league) ? league : 'all';
  const shownGroups = groups.filter((g) => activeLeague === 'all' || g.name === activeLeague);
  const visibleCount = sorted.length;
  const liveCount = sorted.filter((ev) => ev.live || (!ended(ev, now) && ev.startMs > 0 && now >= ev.startMs)).length;

  const toggleSite = async (site, id, title) => {
    const key = `${site}:${id}`;
    if (openSite === key) return setOpenSite(null);
    setOpenSite(key);
    if (options[key]?.streams) return;
    setOptions((o) => ({ ...o, [key]: { loading: true } }));
    try {
      const res = await fetch(`/api/event-streams?site=${site}&id=${encodeURIComponent(id)}&title=${encodeURIComponent(title)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load streams');
      setOptions((o) => ({ ...o, [key]: { streams: json.streams || [] } }));
    } catch (err) {
      setOptions((o) => ({ ...o, [key]: { error: err.message } }));
    }
  };

  const clearFilters = () => {
    setQuery('');
    setLeague('all');
    setShowAll(false);
  };

  const renderEvent = (ev) => {
    const key = `${ev.startMs}|${ev.title}`;
    const isOpen = open === key;
    const isPlaying = Boolean(playing && (ev.sites || []).some((s) => pathOf(s.site, s.id) === playing.eventPath));
    return (
      <div key={key} className={`overflow-hidden border-b border-line last:border-b-0 ${isOpen ? 'bg-ink-850/60' : ''}`}>
        <button
          type="button"
          onClick={() => { setOpen(isOpen ? null : key); setOpenSite(null); }}
          aria-expanded={isOpen}
          className="w-full text-left transition hover:bg-ink-850/50"
        >
          <EventCard ev={ev} now={now} open={isOpen} isPlaying={isPlaying} showLeague={!grouped} />
        </button>

        {isOpen && (
          <div className="space-y-1 border-t border-line bg-ink-950/60 px-3 py-2">
            {sortSites(ev.sites || []).map((s) => {
              const siteKey = `${s.site}:${s.id}`;
              const expanded = openSite === siteKey;
              const opt = options[siteKey];
              const name = SITE_NAME[s.site] || s.site;
              const path = pathOf(s.site, s.id);

              if (!PLAYABLE.has(s.site)) {
                return (
                  <a
                    key={s.site}
                    href={SITE_URL[s.site]?.(s.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-xs text-muted transition hover:bg-ink-800 hover:text-gray-100"
                  >
                    <span className="font-semibold">{name}</span>
                    <span className="flex items-center gap-1 text-[11px]">Open site
                      <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M7 13 13 7M8 7h5v5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                  </a>
                );
              }

              return (
                <div key={s.site} className={`rounded-lg ${expanded ? 'bg-ink-850' : ''}`}>
                  <button
                    type="button"
                    onClick={() => toggleSite(s.site, s.id, ev.title)}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-xs transition hover:bg-ink-800"
                  >
                    <span className="flex items-center gap-2 font-semibold text-gray-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                      {name}
                    </span>
                    <Chevron open={expanded} className="text-muted" />
                  </button>

                  {expanded && (
                    <div className="space-y-1 px-2 pb-2">
                      {opt?.loading && <p className="px-2 py-1 text-[11px] text-muted">Loading streams…</p>}
                      {opt?.error && <p className="px-2 py-1 text-[11px] text-live">{opt.error}</p>}
                      {opt?.streams?.length === 0 && <p className="px-2 py-1 text-[11px] text-muted">No playable streams.</p>}
                      {opt?.streams?.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => onPlay(s.site, s.id, ev.title, st.id, sport, ev.startMs)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-ink-900 px-2.5 py-2 text-left transition hover:border-accent/50 hover:bg-ink-800"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <svg viewBox="0 0 20 20" width="11" height="11" fill="currentColor" className="shrink-0 text-accent" aria-hidden="true"><path d="M6.5 4.6c0-.7.8-1.1 1.4-.7l7.4 5.4c.5.4.5 1.1 0 1.5l-7.4 5.4c-.6.4-1.4 0-1.4-.7V4.6Z" /></svg>
                            <span className="truncate text-xs text-gray-200">{st.name}</span>
                          </span>
                          <StreamClock playing={playing} eventPath={path} index={st.id} />
                        </button>
                      ))}
                      {isPlaying && opt?.streams && (
                        <button type="button" onClick={onRecheck} className="px-2 py-1 text-[11px] font-medium text-accent hover:text-accent/80">
                          Re-check clocks
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col xl:h-full">
      <div className="shrink-0 border-b border-line bg-ink-900/40 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-base font-semibold tracking-tight text-gray-50">Events</h2>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-live/15 px-2 py-0.5 text-[11px] font-bold text-live">
                <span className="h-1.5 w-1.5 rounded-full bg-live motion-safe:animate-pulse" aria-hidden="true" />
                {liveCount} live
              </span>
            )}
            <span className="text-[11px] text-muted">{loading ? 'Loading…' : `${visibleCount} shown`}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={onRecheck} className="btn" aria-label="Re-check match clocks" title="Re-check match clocks">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 10a6 6 0 1 1-1.8-4.3M16 4v4h-4" />
              </svg>
              Clocks
            </button>
            <button type="button" onClick={onShowSources} className="btn" title="Show the sources column">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><rect x="3" y="4" width="14" height="4" rx="1" /><rect x="3" y="12" width="14" height="4" rx="1" /></svg>
              Sources
            </button>
          </div>
        </div>

        <div className="mt-3.5 space-y-2.5">
          <label className="relative block">
            <span className="sr-only">Search events</span>
            <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
              <circle cx="9" cy="9" r="5.5" /><path d="m13.5 13.5 3 3" strokeLinecap="round" />
            </svg>
            <input value={query} onChange={(e) => { setQuery(e.target.value); setLeague('all'); }} placeholder="Search teams or leagues" className="field pl-9" />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={sport}
              onChange={(e) => { setSport(e.target.value); setLeague('all'); setOpen(null); setOpenSite(null); setLoading(true); }}
              className="field py-1.5"
              aria-label="Sport"
            >
              {sports.length === 0 && <option value="football">Football</option>}
              {sports.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            {grouped && leagueNames.length > 1 ? (
              <select value={activeLeague} onChange={(e) => setLeague(e.target.value)} className="field py-1.5" aria-label="League">
                <option value="all">All leagues</option>
                {leagueNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            ) : <span aria-hidden="true" />}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-1 rounded-lg border border-line bg-ink-950 p-0.5" role="group" aria-label="Event window">
              {[[false, 'Live & upcoming'], [true, 'All']].map(([val, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setShowAll(val)}
                  aria-pressed={showAll === val}
                  className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${showAll === val ? 'bg-ink-700 text-gray-50 shadow-sm' : 'text-muted hover:text-gray-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setGrouped((v) => !v)}
              aria-pressed={grouped}
              title="Group by league"
              className={`btn shrink-0 ${grouped ? 'border-accent/40 bg-accent/10 text-accent' : ''}`}
            >
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3 5h14M3 10h9M3 15h5" /></svg>
              Group
            </button>
          </div>
        </div>

        {failed.length > 0 && (
          <p className="mt-2 text-[11px] text-amber">Couldn’t load: {failed.map((s) => SITE_NAME[s] || s).join(', ')}</p>
        )}
      </div>

      <div className="max-h-[70vh] min-h-0 flex-1 overflow-y-auto xl:max-h-none">
        {loading ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex motion-safe:animate-pulse items-center gap-3 rounded-lg border border-line/60 p-3">
                <span className="h-8 w-10 rounded bg-ink-800" />
                <span className="h-3 flex-1 rounded bg-ink-800" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-live">{error}</div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <p className="text-sm font-medium text-gray-200">No events match these filters.</p>
            <p className="text-xs text-muted">Try another sport, or include finished events.</p>
            <button type="button" onClick={clearFilters} className="btn mt-1">Clear filters</button>
          </div>
        ) : grouped ? (
          shownGroups.map((g) => (
            <section key={g.name}>
              <h3 className="sticky top-0 z-10 flex items-center gap-2.5 border-y border-line bg-ink-850/95 px-3 py-2 backdrop-blur">
                <Crest src={g.logo} name={g.name} size={18} />
                <span className="min-w-0 truncate text-[11px] font-bold uppercase tracking-wider text-gray-200">{g.name}</span>
                {g.country && <span className="truncate text-[10px] text-muted/70">{g.country}</span>}
                <span className="ml-auto rounded-full bg-ink-700 px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular text-muted">{g.events.length}</span>
              </h3>
              {g.events.map(renderEvent)}
            </section>
          ))
        ) : (
          sorted.map(renderEvent)
        )}
      </div>
    </div>
  );
}
