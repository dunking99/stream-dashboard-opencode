import { Crest, Chevron } from '../components/EventCard';

// Design workshop: a blank page for trying out ideas before they go into the real dashboard.
// Open it at /workshop.html. Nothing here touches the live app; each idea is one component below,
// shown on the same match in the three states a time has to cope with.

const MATCH = {
  home: { name: 'Nottingham Forest', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png' },
  away: { name: 'Arsenal', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png' },
  sites: [{ name: 'ppv', play: false }, { name: 'Roxie', play: true }, { name: 'streamed', play: true }, { name: 'timst', play: true }],
};

// two long names, to check a row still fits
const LONG = {
  ...MATCH,
  home: { name: 'Brighton & Hove Albion', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png' },
  away: { name: 'Wolverhampton Wanderers', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png' },
};

// names of one line each, and one line against two
const SHORT = {
  ...MATCH,
  home: { name: 'Arsenal', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png' },
  away: { name: 'Chelsea', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png' },
};

// fixed example times so the page looks the same every time you open it
const STATES = [
  { key: 'live', label: 'Live now', day: 'Today', time: '16:30', since: 'Started 16:30' },
  { key: 'soon', label: 'Starting soon', day: 'Today', time: '16:30', mins: 47 },
  { key: 'later', label: 'Later', day: 'Tomorrow', time: '20:00' },
];

const Pills = ({ className = '' }) => (
  <div className={`flex flex-wrap gap-1 ${className}`}>
    {MATCH.sites.map((s) => (
      <span key={s.name} className={`px-1.5 py-0.5 rounded text-[10px] leading-none ${s.play ? 'bg-blue-500/15 text-blue-300' : 'bg-gray-700/60 text-gray-400'}`}>{s.name}</span>
    ))}
  </div>
);

const LiveDot = () => <span className="h-2 w-2 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden="true" />;

// ---------------------------------------------------------------------------------------------
// A. Quiet column: no coloured block. Teams own the card; the time is a plain right-hand column,
//    big clock time over a small line of context. Colour appears only as a single word / dot.
function DesignA({ s }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3.5 hover:border-blue-500">
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {[MATCH.home, MATCH.away].map((t) => (
          <div key={t.name} className="flex items-center gap-3 min-w-0">
            <Crest src={t.logo} name={t.name} size={26} />
            <span className="truncate text-[15px] font-semibold text-gray-100">{t.name}</span>
          </div>
        ))}
        <Pills className="mt-0.5" />
      </div>
      <div className="shrink-0 text-right">
        {s.key === 'live' ? (
          <>
            <div className="flex items-center justify-end gap-1.5 text-sm font-semibold text-red-400"><LiveDot />Live</div>
            <div className="mt-1 text-xs text-gray-500">{s.since}</div>
          </>
        ) : (
          <>
            <div className="text-2xl font-semibold tabular-nums leading-none text-white">{s.time}</div>
            <div className={`mt-1.5 text-xs ${s.key === 'soon' ? 'text-amber-400 font-semibold' : 'text-gray-500'}`}>
              {s.key === 'soon' ? `in ${s.mins} min` : s.day}
            </div>
          </>
        )}
      </div>
      <Chevron className="text-gray-500 shrink-0" />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// B. Fixture centre: the football-app layout. The two sides face each other, the kickoff sits
//    between them like a scoreline, so you read "who - when - who" in one glance.
function DesignB({ s }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-4 hover:border-blue-500">
      <div className="grid items-center gap-3" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
        <div className="flex flex-col items-center gap-2 text-center min-w-0">
          <Crest src={MATCH.home.logo} name={MATCH.home.name} size={44} />
          <span className="text-sm font-semibold text-gray-100 leading-tight">{MATCH.home.name}</span>
        </div>
        <div className="flex flex-col items-center gap-1" style={{ minWidth: 84 }}>
          {s.key === 'live' ? (
            <>
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-400"><LiveDot />LIVE</span>
              <span className="text-xs text-gray-500">{s.since}</span>
            </>
          ) : (
            <>
              <span className="text-xs text-gray-400">{s.key === 'soon' ? 'Today' : s.day}</span>
              <span className="text-3xl font-semibold tabular-nums leading-none text-white">{s.time}</span>
              <span className={`text-xs ${s.key === 'soon' ? 'text-amber-400 font-semibold' : 'text-transparent select-none'}`}>
                {s.key === 'soon' ? `in ${s.mins} min` : '·'}
              </span>
            </>
          )}
        </div>
        <div className="flex flex-col items-center gap-2 text-center min-w-0">
          <Crest src={MATCH.away.logo} name={MATCH.away.name} size={44} />
          <span className="text-sm font-semibold text-gray-100 leading-tight">{MATCH.away.name}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Pills />
        <Chevron className="text-gray-500 shrink-0" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// C. Countdown rail: the time lives in a slim header line and a progress rail along the card's
//    top edge shows how close kickoff is (fills over the last 3 hours; full and green when live).
function DesignC({ s }) {
  const fill = s.key === 'live' ? 100 : s.key === 'soon' ? Math.round(((180 - s.mins) / 180) * 100) : 0;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800 hover:border-blue-500">
      <div className="h-1 bg-gray-700/60" role="progressbar" aria-valuenow={fill} aria-valuemin={0} aria-valuemax={100} aria-label="Time until kickoff">
        <div className={`h-full ${s.key === 'live' ? 'bg-red-500' : 'bg-amber-400'}`} style={{ width: `${fill}%` }} />
      </div>
      <div className="flex items-center justify-between gap-3 px-4 pt-2.5 text-xs">
        <span className="flex items-center gap-2 font-semibold tabular-nums text-gray-300">
          {s.key === 'live' && <LiveDot />}
          {s.day} <span className="text-gray-500">·</span> <span className="text-white text-sm">{s.time}</span>
        </span>
        <span className={s.key === 'live' ? 'font-bold text-red-400' : s.key === 'soon' ? 'font-semibold text-amber-400' : 'text-gray-500'}>
          {s.key === 'live' ? 'LIVE' : s.key === 'soon' ? `Kicks off in ${s.mins} min` : 'Upcoming'}
        </span>
      </div>
      <div className="flex items-center gap-3 px-4 pb-3.5 pt-2.5">
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {[MATCH.home, MATCH.away].map((t) => (
            <div key={t.name} className="flex items-center gap-3 min-w-0">
              <Crest src={t.logo} name={t.name} size={26} />
              <span className="truncate text-[15px] font-semibold text-gray-100">{t.name}</span>
            </div>
          ))}
          <Pills className="mt-0.5" />
        </div>
        <Chevron className="text-gray-500 shrink-0" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// D. Fixture line (your direction): one row, left to right: home crest + name, "vs", away name + crest.
//    The kickoff sits on its own line underneath, centred: day, big clock time, and the status.
function DesignD({ s, m = MATCH }) {
  const fill = s.key === 'live' ? 100 : s.key === 'soon' ? Math.round(((180 - s.mins) / 180) * 100) : 0;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800 hover:border-blue-500">
      <div className="h-1 bg-gray-700/60" role="progressbar" aria-valuenow={fill} aria-valuemin={0} aria-valuemax={100} aria-label="Time until kickoff">
        <div className={`h-full ${s.key === 'live' ? 'bg-red-500' : 'bg-amber-400'}`} style={{ width: `${fill}%` }} />
      </div>
      <div className="px-4 pt-4 pb-4">
        <div className="grid items-center gap-3" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <Crest src={m.home.logo} name={m.home.name} size={34} />
            <span className="text-sm font-semibold leading-tight text-gray-100 [text-wrap:balance]">{m.home.name}</span>
          </div>
          <span className="text-xs font-medium text-gray-500">vs</span>
          <div className="flex items-center justify-end gap-2.5 min-w-0 text-right">
            <span className="text-sm font-semibold leading-tight text-gray-100 [text-wrap:balance]">{m.away.name}</span>
            <Crest src={m.away.logo} name={m.away.name} size={34} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-center gap-2.5 border-t border-gray-700/70 pt-3 tabular-nums">
          {s.key === 'live' ? (
            <>
              <span className="flex items-center gap-1.5 self-center text-sm font-bold text-red-400"><LiveDot />LIVE</span>
              <span className="text-xs text-gray-500">{s.since}</span>
            </>
          ) : (
            <>
              <span className="text-xs text-gray-400">{s.day}</span>
              <span className="text-xl font-semibold leading-none text-white">{s.time}</span>
              {s.key === 'soon' && <span className="text-xs font-semibold text-amber-400">in {s.mins} min</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// E. Fixture centre + rail: B, copied. No sites row; the countdown rail runs along the top edge
//    (red when live, amber filling as kickoff nears, an empty track when it's later).
function DesignE({ s, m = MATCH }) {
  const fill = s.key === 'live' ? 100 : s.key === 'soon' ? Math.round(((180 - s.mins) / 180) * 100) : 0;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800 hover:border-blue-500">
      <div className="h-1 bg-gray-700/60" role="progressbar" aria-valuenow={fill} aria-valuemin={0} aria-valuemax={100} aria-label="Time until kickoff">
        <div className={`h-full ${s.key === 'live' ? 'bg-red-500' : 'bg-amber-400'}`} style={{ width: `${fill}%` }} />
      </div>
      <div className="px-4 py-4">
        {/* two rows: crest | kickoff | crest share one centre line; the names hang beneath their crests, each in a fixed two-line slot so a long name can't move anything */}
        <div className="grid gap-x-3 gap-y-2" style={{ gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
          <div className="flex justify-center"><Crest src={m.home.logo} name={m.home.name} size={44} /></div>
          <div className="flex flex-col items-center justify-center gap-1" style={{ minWidth: 84, height: 72 }}>
            {s.key === 'live' ? (
              <>
                <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-400"><LiveDot />LIVE</span>
                <span className="text-xs text-gray-500">{s.since}</span>
              </>
            ) : (
              <>
                <span className="text-xs text-gray-400">{s.day}</span>
                <span className="text-3xl font-semibold tabular-nums leading-none text-white">{s.time}</span>
                {s.key === 'soon' && <span className="text-xs font-semibold text-amber-400">in {s.mins} min</span>}
              </>
            )}
          </div>
          <div className="flex justify-center"><Crest src={m.away.logo} name={m.away.name} size={44} /></div>

          <span className="text-center text-sm font-semibold leading-tight text-gray-100" style={{ alignSelf: 'start', minHeight: '2.5em' }}>{m.home.name}</span>
          <span aria-hidden="true" />
          <span className="text-center text-sm font-semibold leading-tight text-gray-100" style={{ alignSelf: 'start', minHeight: '2.5em' }}>{m.away.name}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// F. Quiet column + rail: A, copied. No sites row; the countdown rail runs along the top edge;
//    bigger crests and names.
function DesignF({ s, m = MATCH }) {
  const fill = s.key === 'live' ? 100 : s.key === 'soon' ? Math.round(((180 - s.mins) / 180) * 100) : 0;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800 hover:border-blue-500">
      <div className="h-1 bg-gray-700/60" role="progressbar" aria-valuenow={fill} aria-valuemin={0} aria-valuemax={100} aria-label="Time until kickoff">
        <div className={`h-full ${s.key === 'live' ? 'bg-red-500' : 'bg-amber-400'}`} style={{ width: `${fill}%` }} />
      </div>
      <div className="flex items-center gap-4 px-4 py-4">
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {[m.home, m.away].map((t) => (
            <div key={t.name} className="flex items-center gap-3.5 min-w-0">
              <Crest src={t.logo} name={t.name} size={36} />
              <span className="text-lg font-semibold leading-tight text-gray-100" data-name style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.name}</span>
            </div>
          ))}
        </div>
        <div className="shrink-0 text-right" data-time>
          {s.key === 'live' ? (
            <>
              <div className="flex items-center justify-end gap-1.5 text-base font-semibold text-red-400"><LiveDot />Live</div>
              <div className="mt-1 text-xs text-gray-500">{s.since}</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-semibold tabular-nums leading-none text-white">{s.time}</div>
              <div className={`mt-1.5 text-xs ${s.key === 'soon' ? 'text-amber-400 font-semibold' : 'text-gray-500'}`}>
                {s.key === 'soon' ? `in ${s.mins} min` : s.day}
              </div>
            </>
          )}
        </div>
        <Chevron className="text-gray-500 shrink-0" />
      </div>
    </div>
  );
}

const DESIGNS = [
  { id: 'F', name: 'Quiet column + rail', note: 'A with the sites row removed, the countdown rail on top, and bigger crests and names.', Card: DesignF, stress: true },
  { id: 'E', name: 'Fixture centre + rail', note: 'B with the sites row removed and the countdown rail along the top edge. Crests and the kickoff share one centre line; names hang beneath the crests.', Card: DesignE, stress: true },
  { id: 'D', name: 'Fixture line', note: 'Your direction: Team 1 vs Team 2 on one row, kickoff on its own line underneath, countdown rail on top.', Card: DesignD, stress: true },
  { id: 'A', name: 'Quiet column', note: 'No coloured block. Teams lead; the time is a plain column on the right.', Card: DesignA },
  { id: 'B', name: 'Fixture centre', note: 'Sides face each other with the kickoff between them, like a football app.', Card: DesignB },
  { id: 'C', name: 'Countdown rail', note: 'Time in a slim header line, plus a rail that fills as kickoff gets closer.', Card: DesignC },
];

export default function Workshop() {
  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">
      <header className="mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-blue-500">Design workshop</h1>
        <p className="mt-1 text-sm text-gray-400">
          Event row ideas, same match (Nottingham Forest vs Arsenal) in three states. Times are fixed examples.
        </p>
      </header>

      <div className="grid gap-10 md:grid-cols-2 2xl:grid-cols-4">
        {DESIGNS.map(({ id, name, note, Card, stress }) => (
          <section key={id} className="min-w-0" style={{ maxWidth: 460 }}>
            <h2 className="text-lg font-semibold">
              <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-sm">{id}</span>
              {name}
            </h2>
            <p className="mb-4 mt-1 text-sm text-gray-400">{note}</p>
            <div className="space-y-5">
              {STATES.map((s) => (
                <div key={s.key}>
                  <div className="mb-1.5 text-xs text-gray-500">{s.label}</div>
                  <Card s={s} />
                </div>
              ))}
              {stress && [['Short names (1 line each)', SHORT], ['Long names (2 lines each)', LONG]].map(([label, m]) => (
                <div key={label}>
                  <div className="mb-1.5 text-xs text-gray-500">{label}</div>
                  <Card s={STATES[1]} m={m} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
