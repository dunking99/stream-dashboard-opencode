const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function StreamCard({ stream, isActive, stats, matchSeconds, behind, scanned, onSwitch, switching }) {
  const online = Boolean(stats);
  const signal = online ? 'Signal OK' : 'No signal';

  return (
    <div className={`relative px-4 py-3 transition ${isActive ? 'bg-accent/[0.07]' : 'hover:bg-ink-850/70'}`}>
      <span className={`absolute inset-y-0 left-0 w-0.5 ${isActive ? 'bg-accent' : 'bg-transparent'}`} aria-hidden="true" />

      <div className="flex items-start gap-3">
        <span
          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${online ? 'bg-mint' : isActive ? 'bg-amber' : 'bg-line'}`}
          title={signal}
          aria-label={signal}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-gray-100">{stream.name}</span>
          </div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-muted/80">{stream.filename}</div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="text-muted">{signal}</span>
            {stats?.sequence ? <span className="text-muted/80">Seq <span className="tabular text-gray-300">{stats.sequence}</span></span> : null}
            {stats?.time ? <span className="text-muted/80">Stream <span className="tabular text-gray-300">{stats.time}</span></span> : null}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
            {!scanned ? (
              <span className="text-muted/70">Clock not checked</span>
            ) : matchSeconds == null ? (
              <span className="text-muted/70">Reading clock…</span>
            ) : (
              <>
                <span className="tabular font-medium text-gray-200">{mmss(matchSeconds)}</span>
                {behind !== null && (behind < 1.5
                  ? <span className="font-medium text-mint">Closest to live</span>
                  : <span className="tabular text-amber">−{behind.toFixed(0)}s behind</span>)}
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 pt-0.5">
          {isActive ? (
            <span className="text-[11px] font-semibold text-accent">Playing</span>
          ) : (
            <button
              type="button"
              onClick={() => onSwitch(stream.id)}
              disabled={switching}
              className="btn"
              aria-label={`Watch ${stream.name}`}
            >
              Watch
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
