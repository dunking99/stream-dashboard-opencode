import { useCallback, useEffect, useState } from 'react';
import { Crest } from './EventCard';

const TABS = ['Summary', 'Lineups', 'Timeline', 'Stats', 'Commentary'];

const kickoffText = (ms) =>
  ms ? new Date(ms).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '';

const Empty = ({ children }) => <div className="py-6 text-center text-xs text-muted">{children}</div>;

function Scoreboard({ detail }) {
  const { home, away, status } = detail;
  const scheduled = status.state === 'scheduled';
  const live = status.state === 'in';
  return (
    <div className="border-b border-line px-4 py-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-2.5">
          <div className="min-w-0 text-right">
            <div className="truncate text-xs font-semibold text-gray-100 sm:text-sm">{home.name}</div>
            {home.abbreviation && <div className="hidden text-[10px] uppercase tracking-wide text-muted sm:block">{home.abbreviation}</div>}
          </div>
          <Crest src={home.logo} name={home.name} size={32} />
        </div>

        <div className="text-center">
          {scheduled ? (
            <>
              <div className="font-display text-xl font-semibold text-gray-300 sm:text-2xl">vs</div>
              <div className="mt-1 text-[10px] text-muted sm:text-[11px]">{kickoffText(detail.kickoffMs)}</div>
            </>
          ) : (
            <>
              <div className="font-display text-2xl font-bold leading-none text-white sm:text-3xl">
                <span className="tabular">{home.score ?? '–'}</span>
                <span className="mx-1 text-muted/50">:</span>
                <span className="tabular">{away.score ?? '–'}</span>
              </div>
              <div className={`mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-medium sm:text-[11px] ${live ? 'text-live' : 'text-muted'}`}>
                {live && <span className="h-1.5 w-1.5 rounded-full bg-live motion-safe:animate-pulse" aria-hidden="true" />}
                {status.detail || status.description || status.state}
              </div>
            </>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <Crest src={away.logo} name={away.name} size={32} />
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-gray-100 sm:text-sm">{away.name}</div>
            {away.abbreviation && <div className="hidden text-[10px] uppercase tracking-wide text-muted sm:block">{away.abbreviation}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Player({ player }) {
  return (
    <li className="flex items-center gap-2 py-1 text-xs">
      <span className="w-5 shrink-0 text-right font-mono text-[10px] text-muted">{player.jersey || ''}</span>
      <span className="min-w-0 flex-1 truncate text-gray-200">{player.name}</span>
      {player.position && <span className="text-[10px] text-muted">{player.position}</span>}
      {player.subbedOut && <span className="text-[10px] font-semibold text-live">out</span>}
      {player.subbedIn && <span className="text-[10px] font-semibold text-mint">in</span>}
    </li>
  );
}

function LineupSide({ team, lineup }) {
  if (!lineup) return <Empty>Not announced</Empty>;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Crest src={team.logo} name={team.name} size={22} />
        <span className="truncate text-xs font-semibold text-gray-100">{team.name}</span>
        {lineup.formation && <span className="ml-auto rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-muted">{lineup.formation}</span>}
      </div>
      <div className="label mb-1">Starters</div>
      <ul>{lineup.starters.map((p, i) => <Player key={`${p.id || 'p'}-${i}`} player={p} />)}</ul>
      {lineup.bench.length > 0 && (
        <>
          <div className="label mt-3 mb-1">Bench</div>
          <ul className="opacity-75">{lineup.bench.map((p, i) => <Player key={`${p.id || 'b'}-${i}`} player={p} />)}</ul>
        </>
      )}
    </div>
  );
}

function Timeline({ events }) {
  if (!events.length) return <Empty>No incidents yet.</Empty>;
  return (
    <ol className="relative space-y-2 border-l border-line pl-4">
      {[...events].reverse().map((e) => (
        <li key={e.id} className="relative">
          <span className={`absolute -left-[21px] top-3 h-2 w-2 rounded-full ${e.scoring ? 'bg-mint' : /card/i.test(e.type) ? 'bg-amber' : 'bg-muted/60'}`} aria-hidden="true" />
          <div className="rounded-lg border border-line bg-ink-850/60 px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
              <span className="font-mono font-medium text-gray-200">{e.clock}</span>
              <span className="text-muted">{e.label}</span>
              {e.team && <span className="truncate text-muted/70">· {e.team}</span>}
            </div>
            <p className={`mt-1 text-xs leading-relaxed ${e.scoring ? 'font-semibold text-white' : 'text-gray-300'}`}>{e.text || e.short || e.label}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Stats({ stats }) {
  if (!stats.length) return <Empty>No team stats yet.</Empty>;
  const num = (v) => {
    const n = parseFloat(String(v ?? '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : null;
  };
  return (
    <div>
      {stats.map((s) => {
        const h = num(s.home);
        const a = num(s.away);
        const total = h !== null && a !== null ? h + a : 0;
        const hp = total > 0 ? Math.max(2, Math.min(98, (h / total) * 100)) : 50;
        return (
          <div key={s.name} className="border-b border-line/60 py-2.5 last:border-b-0">
            <div className="grid grid-cols-[3rem_1fr_3rem] items-center gap-2 text-xs">
              <span className="text-right font-mono font-medium tabular text-gray-100">{s.home ?? '–'}</span>
              <span className="text-center text-[11px] text-muted">{s.label}</span>
              <span className="font-mono font-medium tabular text-gray-100">{s.away ?? '–'}</span>
            </div>
            {total > 0 && (
              <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-ink-700" aria-hidden="true">
                <span className="bg-accent" style={{ width: `${hp}%` }} />
                <span className="flex-1 bg-gray-500/45" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Commentary({ items }) {
  if (!items.length) return <Empty>No commentary yet.</Empty>;
  return (
    <ol>
      {[...items].reverse().map((c) => (
        <li key={c.id} className="flex gap-3 border-b border-line/60 py-2 text-xs last:border-b-0">
          <span className="w-10 shrink-0 pt-0.5 text-right font-mono text-[10px] text-muted">{c.clock}</span>
          <span className="leading-relaxed text-gray-300">{c.text}</span>
        </li>
      ))}
    </ol>
  );
}

function Summary({ detail }) {
  const rows = [
    detail.venue && ['Venue', detail.venue],
    detail.city && ['City', detail.city],
    detail.kickoffMs && ['Kickoff', kickoffText(detail.kickoffMs)],
    (detail.broadcasts || []).length > 0 && ['TV', detail.broadcasts.join(', ')],
    detail.attendance && ['Attendance', Number(detail.attendance).toLocaleString()],
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      {rows.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line bg-ink-850/50 px-3 py-2">
              <div className="label">{label}</div>
              <div className="mt-0.5 text-xs text-gray-200">{value}</div>
            </div>
          ))}
        </div>
      ) : <Empty>No match information yet.</Empty>}

      {(detail.leaders || []).length > 0 && (
        <div className="grid gap-2 md:grid-cols-2">
          {detail.leaders.map((team) => (
            <div key={team.team} className="rounded-lg border border-line bg-ink-850/50 px-3 py-2">
              <div className="text-xs font-semibold text-gray-200">{team.team}</div>
              {team.categories.map((cat) => (
                <div key={cat.name} className="mt-1.5">
                  <div className="text-[10px] uppercase tracking-wide text-muted">{cat.label}</div>
                  {cat.players.map((p) => (
                    <div key={`${cat.name}-${p.name}`} className="flex justify-between gap-2 text-xs">
                      <span className="truncate text-gray-300">{p.name}</span>
                      <span className="tabular text-muted">{p.value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MatchCentre({ espnId, espnPath }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('Summary');
  const [loading, setLoading] = useState(false);
  const ready = Boolean(espnId && espnPath);

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/event-detail?id=${encodeURIComponent(espnId)}&path=${encodeURIComponent(espnPath)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load match details');
      setDetail(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ready, espnId, espnPath]);

  useEffect(() => {
    if (!ready) return;
    const first = setTimeout(load, 0);
    const interval = setInterval(load, 30000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [ready, load]);

  if (!ready) {
    return (
      <div className="panel p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-100">Match centre</h2>
          <span className="chip">No ESPN data</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">This event isn’t matched to an ESPN fixture. The stream and match clock still work.</p>
      </div>
    );
  }

  const updated = detail?.updatedAt ? new Date(detail.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-100">Match centre</h2>
          <span className="chip">ESPN</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted">
          {updated && <span className="hidden sm:inline">Updated {updated}</span>}
          <button type="button" onClick={load} disabled={loading} className="btn">{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </div>

      {!detail ? (
        error ? (
          <div className="flex flex-col items-start gap-2 px-4 py-5">
            <p className="text-sm font-medium text-gray-200">Match details unavailable.</p>
            <p className="text-xs text-muted">{error}</p>
            <button type="button" onClick={load} className="btn mt-1">Try again</button>
          </div>
        ) : (
          <div className="motion-safe:animate-pulse space-y-3 px-4 py-5">
            <div className="mx-auto h-7 w-40 rounded bg-ink-800" />
            <div className="mx-auto h-3 w-56 rounded bg-ink-800/70" />
            <div className="h-24 rounded-lg bg-ink-800/50" />
          </div>
        )
      ) : (
        <>
          <Scoreboard detail={detail} />

          <div role="tablist" aria-label="Match details" className="flex gap-1 overflow-x-auto border-b border-line px-2">
            {TABS.map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                id={`tab-${name.toLowerCase()}`}
                aria-selected={tab === name}
                aria-controls={`panel-${name.toLowerCase()}`}
                onClick={() => setTab(name)}
                className={`whitespace-nowrap border-b-2 px-3 py-2 text-[11px] font-semibold transition ${tab === name ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-gray-200'}`}
              >
                {name}
              </button>
            ))}
          </div>

          <div role="tabpanel" id={`panel-${tab.toLowerCase()}`} aria-labelledby={`tab-${tab.toLowerCase()}`} className="p-3.5">
            {tab === 'Summary' && <Summary detail={detail} />}
            {tab === 'Lineups' && (
              detail.lineups ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <LineupSide team={detail.home} lineup={detail.lineups.home} />
                  <LineupSide team={detail.away} lineup={detail.lineups.away} />
                </div>
              ) : <Empty>Lineups not announced yet.</Empty>
            )}
            {tab === 'Timeline' && <Timeline events={detail.timeline || []} />}
            {tab === 'Stats' && <Stats stats={detail.stats || []} />}
            {tab === 'Commentary' && <Commentary items={detail.commentary || []} />}
          </div>
        </>
      )}
    </div>
  );
}
