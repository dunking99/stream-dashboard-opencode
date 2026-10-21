import StreamCard from './StreamCard';

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function SourcePanel({ data, clocks, best, scanned, onScan, onSwitch, switching }) {
  const streams = data?.streams ?? [];
  const reporting = streams.filter((st) => st.stats).length;

  return (
    <div className="space-y-4">
      <div className="panel overflow-hidden">
        <div className="panel-header">
          <div>
            <h2 className="text-sm font-semibold text-gray-100">Sources</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              {data ? `${streams.length} available` : 'No event loaded'}
            </p>
          </div>
          <button type="button" onClick={onScan} disabled={!data || Boolean(data.error)} className="btn">
            {scanned ? 'Rescan' : 'Scan clocks'}
          </button>
        </div>
        <p className="border-b border-line px-4 py-2 text-[11px] leading-relaxed text-muted">
          Clocks are read one source at a time, so the sites only see one extra viewer.
        </p>

        {!data ? (
          <p className="px-4 py-6 text-sm text-muted">Select an event to load its sources.</p>
        ) : data.error ? (
          <p className="px-4 py-6 text-sm text-muted">This event has no live sources right now.</p>
        ) : (
          <div className="divide-y divide-line">
            {streams.map((stream) => {
              const isActive = stream.id === data.activeIndex;
              const matchSeconds = clocks[stream.id];
              return (
                <StreamCard
                  key={stream.id}
                  stream={stream}
                  stats={isActive ? data.stats : stream.stats}
                  isActive={isActive}
                  matchSeconds={matchSeconds}
                  behind={matchSeconds === null || best < 0 ? null : best - matchSeconds}
                  scanned={scanned}
                  onSwitch={onSwitch}
                  switching={switching}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="panel p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-100">Scan status</h3>
          <span className={`chip ${scanned ? 'border-accent/30 text-accent' : ''}`}>{scanned ? 'Scanned' : 'Idle'}</span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
          <div>
            <dt className="label">Reporting</dt>
            <dd className="mt-0.5 font-display text-xl font-semibold text-gray-100">
              {reporting}<span className="text-xs font-normal text-muted">/{streams.length}</span>
            </dd>
          </div>
          <div>
            <dt className="label">Clocks read</dt>
            <dd className="mt-0.5 font-display text-xl font-semibold text-gray-100">
              {scanned ? `${clocks.filter((c) => c !== null).length}/${streams.length}` : '—'}
            </dd>
          </div>
          <div>
            <dt className="label">Closest</dt>
            <dd className="mt-0.5 font-display text-xl font-semibold tabular text-gray-100">{best >= 0 ? mmss(best) : '—'}</dd>
          </div>
          <div>
            <dt className="label">Active</dt>
            <dd className="mt-0.5 font-display text-xl font-semibold text-gray-100">{data?.activeIndex != null ? data.activeIndex + 1 : '—'}</dd>
          </div>
        </dl>
        {scanned && <p className="mt-3 text-[11px] leading-relaxed text-muted">Clocks update in the background, one source at a time.</p>}
      </div>

      <div className="rounded-xl border border-line bg-ink-900/60 p-3.5">
        <h3 className="text-xs font-semibold text-gray-200">Manual failover</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Pick a source to switch instantly. The dashboard does not switch automatically.
        </p>
      </div>
    </div>
  );
}
