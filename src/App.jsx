import { useState, useEffect, useRef, useCallback } from 'react';
import useScoreboard from './useScoreboard';
import StreamProbe from './components/StreamProbe';
import MatchedEvents from './components/MatchedEvents';
import MatchClock from './components/MatchClock';
import VideoPlayer from './components/VideoPlayer';
import MatchCentre from './components/MatchCentre';
import SourcePanel from './components/SourcePanel';
import SitesDrawer from './components/SitesDrawer';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [backendError, setBackendError] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [sitesOpen, setSitesOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [panel, setPanel] = useState('events');
  const [recheck, setRecheck] = useState(0);
  const [scanned, setScanned] = useState(false);
  const videoRef = useRef(null);
  const playerKey = data ? `${data.eventPath}-${data.activeIndex}` : 'initial';
  const auto = useScoreboard(videoRef, 30 * 1000, playerKey);
  const [probes, setProbes] = useState({});
  const onProbe = useCallback((event, i, live, liveAt) => {
    setProbes((p) => (p[`${event}:${i}`]?.liveAt === liveAt ? p : { ...p, [`${event}:${i}`]: { live, liveAt } }));
  }, []);

  const streams = data?.streams ?? [];
  const activeStream = streams[data?.activeIndex];
  const teams = (data?.eventName || '').split(/\s+(?:vs\.?|v)\s+/i);
  const [home, away] = teams.length === 2 ? teams.map((t) => t.slice(0, 3).toUpperCase()) : ['', ''];

  const now = data?.at ?? 0;
  const clockOf = (i) => {
    const probed = probes[`${data?.eventPath}:${i}`];
    const c = i === data?.activeIndex && auto.live != null ? auto : probed;
    return c?.live != null ? c.live + (now - c.liveAt) / 1000 : null;
  };
  const clocks = streams.map((st) => clockOf(st.id));
  const best = Math.max(...clocks.filter((c) => c !== null), -1);

  const fetchStreams = useCallback(async () => {
    try {
      const response = await fetch('/api/streams', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const json = await response.json();
      setData({ ...json, at: Date.now() });
      setBackendError(false);
    } catch (err) {
      console.error('Backend error:', err);
      setBackendError(true);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(fetchStreams, 0);
    const interval = setInterval(fetchStreams, 3000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [fetchStreams]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSwitchStream = async (index) => {
    setSwitching(true);
    try {
      const res = await fetch(`/api/switch-stream?index=${index}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not switch source');
      window.setTimeout(fetchStreams, 400);
      window.setTimeout(() => setSwitching(false), 1000);
    } catch (err) {
      console.error(err);
      setToast(err.message || 'Could not switch source');
      setSwitching(false);
    }
  };

  const handleSitePlay = async (site, id, title, index, sport, startMs) => {
    setSwitching(true);
    try {
      const res = await fetch(`/api/select-site-event?site=${site}&id=${encodeURIComponent(id)}&title=${encodeURIComponent(title || '')}&index=${index ?? 0}&sport=${encodeURIComponent(sport || '')}&startMs=${startMs || 0}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not load that stream');
      setProbes({});
      setScanned(false);
      window.setTimeout(fetchStreams, 400);
      window.setTimeout(() => setSwitching(false), 1000);
    } catch (err) {
      console.error(err);
      setToast(err.message || 'Could not load that stream');
      setSwitching(false);
    }
  };

  const handleRecheck = () => {
    setScanned(true);
    setRecheck((n) => n + 1);
  };

  const status = backendError ? 'Backend offline' : data ? 'Connected' : 'Connecting';
  const dot = backendError ? 'bg-live' : data ? 'bg-mint' : 'bg-amber';

  return (
    <div className="flex min-h-screen flex-col xl:h-screen xl:overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-ink-950/80 px-4 backdrop-blur lg:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-ink-950" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor"><path d="M6.5 4.6c0-.7.8-1.1 1.4-.7l7.4 5.4c.5.4.5 1.1 0 1.5l-7.4 5.4c-.6.4-1.4 0-1.4-.7V4.6Z" /></svg>
          </span>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight text-gray-100">Stream Dashboard</h1>
            <div className="hidden text-[11px] uppercase tracking-[0.14em] text-muted sm:block">Failover console</div>
          </div>
        </div>

        <div className="ml-2 hidden items-center gap-2 border-l border-line pl-4 text-xs text-muted md:flex" aria-live="polite">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
          {status}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-muted sm:inline-flex">
            Manual failover
          </span>
          <button type="button" onClick={() => setSitesOpen(true)} className="btn">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M3 6h14M3 10h14M3 14h14" /><circle cx="7" cy="6" r="1.4" fill="currentColor" stroke="none" /><circle cx="13" cy="10" r="1.4" fill="currentColor" stroke="none" /><circle cx="8" cy="14" r="1.4" fill="currentColor" stroke="none" />
            </svg>
            Sites
          </button>
        </div>
      </header>

      {backendError && (
        <div className="flex shrink-0 items-center gap-3 border-b border-live/20 bg-live/10 px-4 py-2 text-xs text-live lg:px-5">
          <span className="font-semibold">Backend unreachable.</span>
          <span className="hidden text-live/80 sm:inline">Showing the last known state. Controls may not work until it returns.</span>
          <button type="button" onClick={fetchStreams} className="ml-auto rounded border border-live/30 px-2 py-0.5 font-semibold hover:bg-live/10">
            Retry now
          </button>
        </div>
      )}

      <main className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] xl:grid-rows-[auto_minmax(0,1fr)]">
        <section className="order-1 min-h-0 space-y-4 p-4 lg:p-5 xl:order-none xl:col-start-1 xl:row-start-1">
          <div className="relative aspect-video w-full max-w-[calc(56vh*16/9)] overflow-hidden rounded-xl border border-line bg-black shadow-2xl shadow-black/30">
            {!data ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                <span className={`h-8 w-8 rounded-full border-2 border-line border-t-accent ${backendError ? '' : 'motion-safe:animate-spin'}`} aria-hidden="true" />
                <p className="text-sm font-medium text-gray-200">{backendError ? 'Backend unreachable' : 'Connecting to the stream'}</p>
                <p className="max-w-xs text-xs text-muted">{backendError ? 'Start server.js on port 3005, then retry.' : 'Waiting for the dashboard API to answer.'}</p>
                {backendError && <button type="button" onClick={fetchStreams} className="btn">Retry</button>}
              </div>
            ) : data.error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-live" aria-hidden="true">
                  <path d="M12 8v5M12 16.5v.5" strokeLinecap="round" /><circle cx="12" cy="12" r="9" />
                </svg>
                <p className="text-sm font-semibold text-gray-100">Stream offline</p>
                <p className="max-w-sm text-xs text-muted">{data.error}</p>
                <p className="text-[11px] text-muted/80">Pick another source, or try a different event.</p>
              </div>
            ) : (
              <VideoPlayer key={playerKey} videoRef={videoRef} src={`/proxy/${data.activeIndex}/manifest.m3u8`} />
            )}

            {switching && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75">
                <div className="flex items-center gap-3 rounded-full border border-line bg-ink-900/90 px-4 py-2 text-sm text-gray-200">
                  <span className="h-4 w-4 motion-safe:animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden="true" />
                  Switching source
                </div>
              </div>
            )}

            {data && !data.error && (
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 bg-gradient-to-b from-black/75 via-black/25 to-transparent p-3 lg:p-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white drop-shadow">{data.eventName}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/60">
                    <span>Source {data.activeIndex + 1} of {streams.length}</span>
                    {activeStream?.stats?.sequence ? <><span aria-hidden="true">·</span><span>Seq {activeStream.stats.sequence}</span></> : null}
                  </div>
                </div>
                <span className="hidden max-w-[45%] shrink-0 truncate rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur sm:inline-block">
                  {activeStream?.name || 'No source'}
                </span>
              </div>
            )}
          </div>

          {data && !data.error && (
            <MatchClock key={playerKey} videoRef={videoRef} auto={auto} home={home} away={away} />
          )}
        </section>

        <aside className="order-2 flex min-h-0 flex-col border-t border-line xl:order-none xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:border-l xl:border-t-0">
          <div className={panel === 'events' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
            <MatchedEvents
              onPlay={handleSitePlay}
              onRecheck={handleRecheck}
              onShowSources={() => setPanel('sources')}
              playing={data ? { eventPath: data.eventPath, clocks, best } : null}
            />
          </div>
          {panel === 'sources' && (
            <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-5">
              <button type="button" onClick={() => setPanel('events')} className="btn mb-3">
                <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l-5 5 5 5" /></svg>
                Events
              </button>
              <SourcePanel
                data={data}
                clocks={clocks}
                best={best}
                scanned={scanned}
                onScan={handleRecheck}
                onSwitch={handleSwitchStream}
                switching={switching}
              />
            </div>
          )}
        </aside>

        {data && !data.error && (
          <section className="order-4 min-h-0 border-t border-line p-4 lg:p-5 xl:order-none xl:col-start-1 xl:row-start-2 xl:overflow-y-auto xl:border-t-0 xl:pt-0">
            <MatchCentre key={`${data.espnId}:${data.espnPath}`} espnId={data.espnId} espnPath={data.espnPath} />
          </section>
        )}
      </main>

      <SitesDrawer open={sitesOpen} onClose={() => setSitesOpen(false)} />

      {toast && (
        <div role="status" className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border border-live/40 bg-ink-850 px-4 py-3 text-sm text-gray-100 shadow-2xl">
          {toast}
        </div>
      )}

      {scanned && data && !data.error && streams.filter((st) => st.id !== data.activeIndex).map((st) => (
        <StreamProbe key={`${data.eventPath}:${st.id}`} index={st.id} event={data.eventPath} recheck={recheck} onClock={onProbe} />
      ))}
    </div>
  );
}

export default App;
