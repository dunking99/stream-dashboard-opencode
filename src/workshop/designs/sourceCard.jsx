// Source card ideas for the right-hand Sources panel: one stream of the event, with its health and
// how far behind the best source it is. Failing over is the app's job, so status and the switch
// button should read at a glance.

// fixed examples so the page looks the same every time: `behind` is seconds behind the best source
const SOURCES = {
  playing: { name: 'Stream 1', file: 'fsp.m3u8', active: true, online: true, seq: 14211, time: '15:48:20', behind: 0 },
  lagging: { name: 'Stream 2', file: 'wnba.m3u8', active: false, online: true, seq: 14176, time: '15:45:50', behind: 38 },
  dead: { name: 'Stream 3', file: 'forest.m3u8', active: false, online: false, seq: 0, time: null, behind: null },
  unchecked: { name: 'Stream 4', file: 'espn.m3u8', active: false, online: true, seq: 9803, time: '10:54:11', behind: undefined },
};

// one word of status, one colour of dot
function health(s) {
  if (!s.online) return { label: 'Offline', dot: 'bg-live', text: 'text-live' };
  if (s.behind === undefined) return { label: 'Not checked', dot: 'bg-muted', text: 'text-muted' };
  if (s.behind < 1.5) return { label: 'Live', dot: 'bg-mint', text: 'text-mint' };
  return { label: `${Math.round(s.behind)}s behind`, dot: 'bg-amber', text: 'text-amber' };
}

const Dot = ({ className = '' }) => <span className={`h-2 w-2 shrink-0 rounded-full ${className}`} aria-hidden="true" />;

// ---------------------------------------------------------------------------------------------
// A. As it is now: a copy of the live StreamCard (static) for comparison.
function Current({ src }) {
  const s = SOURCES[src];
  const signal = s.online ? 'Signal OK' : 'No signal';
  return (
    <div className={`relative border border-line px-4 py-3 ${s.active ? 'bg-accent/[0.07]' : 'bg-ink-900'}`}>
      <span className={`absolute inset-y-0 left-0 w-0.5 ${s.active ? 'bg-accent' : 'bg-transparent'}`} aria-hidden="true" />
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${s.online ? 'bg-mint' : s.active ? 'bg-amber' : 'bg-line'}`} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-gray-100">{s.name}</div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-muted/80">{s.file}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="text-muted">{signal}</span>
            {s.seq ? <span className="text-muted/80">Seq <span className="tabular text-gray-300">{s.seq}</span></span> : null}
            {s.time ? <span className="text-muted/80">Stream <span className="tabular text-gray-300">{s.time}</span></span> : null}
          </div>
          <div className="mt-1.5 text-[11px] text-muted/70">{s.behind === undefined ? 'Clock not checked' : s.behind === null ? '' : s.behind < 1.5 ? 'Closest to live' : `−${s.behind}s behind`}</div>
        </div>
        <div className="shrink-0 pt-0.5">
          {s.active ? <span className="text-[11px] font-semibold text-accent">Playing</span> : <button type="button" className="btn">Watch</button>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// B. Status first: a big plain-language status, one clear button. Technical fields sit behind a
//    "details" toggle instead of crowding the card.
function StatusFirst({ src }) {
  const s = SOURCES[src];
  const h = health(s);
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${s.active ? 'border-accent/60 bg-accent/[0.07]' : 'border-line bg-ink-900'}`}>
      <div className="flex items-center gap-3">
        <Dot className={h.dot} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-gray-100">{s.name}</div>
          <div className={`text-sm font-medium ${h.text}`}>{h.label}</div>
        </div>
        {s.active ? (
          <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">Playing</span>
        ) : (
          <button type="button" className="btn-primary" disabled={!s.online}>Switch</button>
        )}
      </div>
      <details className="group mt-2">
        <summary className="cursor-pointer list-none text-[11px] text-muted hover:text-gray-300">
          <span className="group-open:hidden">Show details</span><span className="hidden group-open:inline">Hide details</span>
        </summary>
        <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
          <div><dt className="label">Seq</dt><dd className="tabular text-gray-200">{s.seq || '—'}</dd></div>
          <div><dt className="label">Stream</dt><dd className="tabular text-gray-200">{s.time || '—'}</dd></div>
          <div className="min-w-0"><dt className="label">File</dt><dd className="truncate font-mono text-gray-200">{s.file}</dd></div>
        </dl>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// C. Delta bar: how far behind the best source it is, drawn as a bar that fills toward "live".
//    The number that matters when picking a failover ("+38s") is the headline.
function DeltaBar({ src }) {
  const s = SOURCES[src];
  const h = health(s);
  const known = s.online && s.behind !== undefined && s.behind !== null;
  const fill = known ? Math.max(6, 100 - Math.min(s.behind, 60) / 60 * 100) : 0; // 60s or worse = nearly empty
  return (
    <div className={`rounded-xl border px-4 py-3 ${s.active ? 'border-accent/60 bg-accent/[0.07]' : 'border-line bg-ink-900'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Dot className={h.dot} />
          <span className="truncate text-sm font-semibold text-gray-100">{s.name}</span>
        </div>
        {s.active
          ? <span className="text-xs font-semibold text-accent">Playing</span>
          : <button type="button" className="btn" disabled={!s.online}>Watch</button>}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className={`font-display text-2xl font-semibold leading-none tabular ${h.text}`}>
          {!s.online ? 'Offline' : s.behind === undefined ? '—' : s.behind < 1.5 ? 'LIVE' : `−${Math.round(s.behind)}s`}
        </span>
        <span className="text-[11px] text-muted">{s.time ? `Stream ${s.time}` : 'No signal'}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700" role="progressbar" aria-valuenow={Math.round(fill)} aria-valuemin={0} aria-valuemax={100} aria-label="Closeness to live">
        <div className={`h-full rounded-full ${s.behind != null && s.behind < 1.5 ? 'bg-mint' : 'bg-amber'}`} style={{ width: `${fill}%` }} />
      </div>
    </div>
  );
}

export default {
  id: 'source-card',
  title: 'Source card',
  blurb: 'One stream in the Sources panel.',
  scenarios: [
    { label: 'Playing, live', props: { src: 'playing' } },
    { label: 'Standby, 38s behind', props: { src: 'lagging' } },
    { label: 'Offline', props: { src: 'dead' } },
    { label: 'Clock not checked', props: { src: 'unchecked' } },
  ],
  variants: [
    { id: 'A', name: 'Current', note: 'The card as it is in the live app, for comparison.', Component: Current },
    { id: 'B', name: 'Status first', note: 'Plain-language status and one clear button; technical fields tucked behind "Show details".', Component: StatusFirst },
    { id: 'C', name: 'Delta bar', note: 'The seconds-behind number is the headline, with a bar that fills toward live.', Component: DeltaBar },
  ],
};
