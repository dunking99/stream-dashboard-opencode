import { useState } from 'react';

// "English - TNT Sports 2 · admin 1 HD" -> language "English", channel "TNT Sports 2", stream "admin 1 HD".
// Streams whose names don't follow a pattern land in "Other".
function splitName(name = '') {
  const roxie = name.match(/^(Stream \d+) · (.+)$/);
  if (roxie) return { channel: roxie[2], label: roxie[1], lang: '' };
  const at = name.indexOf(' · ');
  if (at < 0) return { channel: 'Other', label: name || 'Stream', lang: '' };
  const left = name.slice(0, at);
  const m = left.match(/^([A-Za-z]+) - (.+)$/);
  return m ? { channel: m[2], label: name.slice(at + 3), lang: m[1] } : { channel: left, label: name.slice(at + 3), lang: '' };
}

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// one card per channel; the open channel's streams show underneath
export default function ChannelStrip({ streams, activeIndex, clocks = [], best = -1, scanned, onSwitch, switching }) {
  const [picked, setPicked] = useState(null);

  const channels = [];
  streams.forEach((st, i) => {
    const { channel, label, lang } = splitName(st.name);
    let c = channels.find((x) => x.name === channel);
    if (!c) channels.push((c = { name: channel, lang, streams: [] }));
    c.streams.push({ ...st, label, clock: clocks[i] });
  });
  if (!channels.length) return null;
  const activeChannel = channels.find((c) => c.streams.some((s) => s.id === activeIndex))?.name;
  const open = channels.find((c) => c.name === (picked ?? activeChannel)) ?? channels[0];

  return (
    <section aria-label="Channels" className="space-y-2">
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }} role="tablist">
        {channels.map((c, n) => {
          const isOpen = c === open;
          const onAir = c.name === activeChannel;
          const live = c.streams.filter((s) => s.stats).length;
          const clock = Math.max(-1, ...c.streams.map((s) => s.clock ?? -1));
          const behind = scanned && clock >= 0 && best >= 0 ? best - clock : null;
          return (
            <button
              key={c.name}
              type="button"
              role="tab"
              aria-selected={isOpen}
              onClick={() => setPicked(c.name)}
              className={`panel flex flex-col gap-2 p-3 text-left transition ${isOpen ? '!border-accent bg-accent/[0.06]' : 'hover:bg-ink-850/70'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-semibold ${onAir ? 'border-accent bg-accent text-ink-950' : 'border-line text-gray-300'}`}>
                  C{n + 1}{c.lang ? ` · ${c.lang.slice(0, 3).toUpperCase()}` : ''}
                </span>
                <span className={`flex items-center gap-1.5 font-mono text-[10.5px] font-semibold ${live ? 'text-mint' : 'text-muted'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-mint' : 'bg-line'}`} aria-hidden="true" />
                  {onAir ? 'ON AIR' : live ? 'LIVE' : 'NO SIGNAL'}
                </span>
              </div>
              <div className="truncate text-sm font-semibold text-gray-100" title={c.name}>{c.name}</div>
              <div className="font-mono text-[11px] text-muted">{c.streams.length} stream{c.streams.length === 1 ? '' : 's'} · {live} with signal</div>
              <div className="flex items-center justify-between border-t border-line pt-2">
                <span className="flex items-end gap-[3px]" aria-hidden="true">
                  {c.streams.slice(0, 10).map((s) => (
                    <span key={s.id} className={`w-1.5 rounded-sm ${s.stats ? 'bg-mint' : 'bg-line'}`} style={{ height: s.stats ? 14 : 6 }} />
                  ))}
                </span>
                <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10.5px] text-gray-300">
                  {behind === null ? 'clock —' : behind < 1.5 ? 'closest' : `−${behind.toFixed(0)}s`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="panel flex flex-wrap items-center gap-2 px-3 py-2.5">
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
              <span className="text-[11px] text-muted">{active ? 'Playing' : s.stats ? (s.clock != null && scanned ? mmss(s.clock) : 'Signal OK') : 'No signal'}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
