import { useState } from 'react';

// "English - TNT Sports 2 · admin 1 HD" -> channel "TNT Sports 2", stream "admin 1 HD".
// Streams whose names don't follow a pattern land in "Other".
function splitName(name = '') {
  const roxie = name.match(/^(Stream \d+) · (.+)$/);
  if (roxie) return { channel: roxie[2], label: roxie[1] };
  const at = name.indexOf(' · ');
  if (at < 0) return { channel: 'Other', label: name || 'Stream' };
  return { channel: name.slice(0, at).replace(/^[A-Za-z]+ - /, '') || 'Other', label: name.slice(at + 3) };
}

export default function ChannelStrip({ streams, activeIndex, onSwitch, switching }) {
  const [picked, setPicked] = useState(null);

  const channels = [];
  streams.forEach((st) => {
    const { channel, label } = splitName(st.name);
    let c = channels.find((x) => x.name === channel);
    if (!c) channels.push((c = { name: channel, streams: [] }));
    c.streams.push({ ...st, label });
  });
  const activeChannel = channels.find((c) => c.streams.some((s) => s.id === activeIndex))?.name;
  const open = channels.find((c) => c.name === (picked ?? activeChannel)) ?? channels[0];
  if (!channels.length) return null;

  return (
    <section className="panel overflow-hidden" aria-label="Channels">
      <div className="flex items-center gap-2 overflow-x-auto px-3 py-2.5" role="tablist" aria-label="Channels">
        <span className="mr-1 shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Channels</span>
        {channels.map((c) => {
          const isOpen = c === open;
          const playing = c.name === activeChannel;
          const live = c.streams.filter((s) => s.stats).length;
          return (
            <button
              key={c.name}
              type="button"
              role="tab"
              aria-selected={isOpen}
              onClick={() => setPicked(c.name)}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${isOpen ? 'border-accent bg-accent/15 text-accent' : 'border-line text-gray-300 hover:bg-ink-850'}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-mint' : 'bg-line'}`} aria-hidden="true" />
              {c.name}
              <span className="font-mono text-[11px] font-normal text-muted">{live}/{c.streams.length}</span>
              {playing && <span className="rounded bg-accent px-1 text-[10px] font-bold text-ink-950">ON</span>}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-ink-900/40 px-3 py-2.5">
        <span className="mr-1 text-[11px] text-muted">{open.name}</span>
        {open.streams.map((s) => {
          const active = s.id === activeIndex;
          return (
            <button
              key={s.id}
              type="button"
              disabled={active || switching}
              onClick={() => onSwitch(s.id)}
              aria-label={active ? `Playing ${s.label}` : `Watch ${s.label}`}
              className={`flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs transition ${active ? 'border-accent/60 bg-accent/10 font-semibold text-accent' : 'border-line text-gray-200 hover:bg-ink-850 disabled:opacity-60'}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${s.stats ? 'bg-mint' : active ? 'bg-amber' : 'bg-line'}`} aria-hidden="true" />
              {s.label}
              <span className="text-[11px] text-muted">{active ? 'Playing' : s.stats ? 'Signal OK' : 'No signal'}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
