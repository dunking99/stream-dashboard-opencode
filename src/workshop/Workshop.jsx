import { useEffect, useState } from 'react';
import { GROUPS } from './registry';

// Design lab: where new component designs are tried and refined before they go into the real
// dashboard. Open it at /workshop.html. Nothing here touches the live app.
// Add a component in registry.js; the sidebar, width switcher, compare/focus views and shortlist
// all work on whatever the registry lists.

const WIDTHS = [
  { id: 'phone', label: 'Narrow', px: 300 },
  { id: 'panel', label: 'Panel', px: 380 },
  { id: 'wide', label: 'Wide', px: 560 },
  { id: 'centre', label: 'Centre', px: 900 },
  { id: 'fill', label: 'Fill', px: null },
];

// remembered between visits; the lab still works with storage blocked
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ }
};

const Segmented = ({ options, value, onChange, label }) => (
  <div role="group" aria-label={label} className="inline-flex rounded-lg border border-line bg-ink-900 p-0.5">
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        onClick={() => onChange(o.id)}
        aria-pressed={value === o.id}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${value === o.id ? 'bg-accent text-ink-950' : 'text-muted hover:text-gray-100'}`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const Star = ({ on, onClick, name }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={on}
    aria-label={`${on ? 'Remove' : 'Add'} ${name} ${on ? 'from' : 'to'} shortlist`}
    className={`rounded-md p-1.5 transition ${on ? 'text-amber' : 'text-muted/60 hover:text-gray-200'}`}
  >
    <svg viewBox="0 0 20 20" width="18" height="18" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <path d="m10 2.8 2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 8.1l5-.7L10 2.8Z" />
    </svg>
  </button>
);

// one variant: header (id, name, note, star) + every scenario in a frame of the chosen width
function Variant({ group, variant, width, starred, onStar }) {
  const { Component } = variant;
  const px = WIDTHS.find((w) => w.id === width)?.px;
  return (
    <section className="min-w-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-bold text-ink-950">{variant.id}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-100">{variant.name}</h3>
          <p className="mt-0.5 text-sm text-muted">{variant.note}</p>
        </div>
        <Star on={starred} onClick={onStar} name={variant.name} />
      </div>
      <div className="mt-4 space-y-5" style={px ? { maxWidth: px } : undefined}>
        {group.scenarios.map((sc) => (
          <div key={sc.label}>
            <div className="label mb-1.5 normal-case tracking-normal">{sc.label}</div>
            <Component {...sc.props} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Workshop() {
  const [groupId, setGroupId] = useState(() => (window.location.hash.slice(1) || GROUPS[0].id));
  const [widths, setWidths] = useState(() => load('lab.widths', {})); // { groupId: widthId }
  const [view, setView] = useState(() => load('lab.view', 'compare'));
  const [starred, setStarred] = useState(() => load('lab.starred', {})); // { "event-row:E": true }
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [focusId, setFocusId] = useState(null);

  const group = GROUPS.find((g) => g.id === groupId) || GROUPS[0];
  const width = widths[group.id] || group.defaultWidth || 'panel';
  const setWidth = (w) => setWidths((all) => ({ ...all, [group.id]: w }));
  const key = (v) => `${group.id}:${v.id}`;

  useEffect(() => {
    const onHash = () => { setGroupId(window.location.hash.slice(1) || GROUPS[0].id); setFocusId(null); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => save('lab.widths', widths), [widths]);
  useEffect(() => save('lab.view', view), [view]);
  useEffect(() => save('lab.starred', starred), [starred]);

  const toggleStar = (v) => setStarred((s) => {
    const next = { ...s };
    if (next[key(v)]) delete next[key(v)]; else next[key(v)] = true;
    return next;
  });
  const starCount = (g) => g.variants.filter((v) => starred[`${g.id}:${v.id}`]).length;

  // a whole-page design takes the entire window; a small tab leads back to the lab
  if (group.fullPage) {
    const Page = group.Page;
    return (
      <>
        <Page />
        <a href={`#${GROUPS[0].id}`} className="fixed bottom-3 left-[150px] z-[100] rounded-md border border-white/20 bg-black/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black">← Design lab</a>
      </>
    );
  }

  let shown = onlyStarred ? group.variants.filter((v) => starred[key(v)]) : group.variants;
  if (view === 'focus') {
    const pick = shown.find((v) => v.id === focusId) || shown[0];
    shown = pick ? [pick] : [];
  }

  return (
    <div className="flex min-h-screen bg-ink-950 text-gray-100">
      <nav className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-ink-900 md:flex" aria-label="Components">
        <div className="border-b border-line px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Stream Dashboard</div>
          <h1 className="mt-0.5 text-lg font-semibold">Design lab</h1>
        </div>
        <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {GROUPS.map((g) => (
            <li key={g.id}>
              <a
                href={`#${g.id}`}
                aria-current={g.id === group.id ? 'page' : undefined}
                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition ${g.id === group.id ? 'bg-accent/15 font-semibold text-accent' : 'text-gray-300 hover:bg-ink-850'}`}
              >
                <span className="truncate">{g.title}</span>
                <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted">
                  {starCount(g) > 0 && <span className="text-amber">★ {starCount(g)}</span>}
                  {g.variants.length}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-muted">
          New components go in <code className="text-gray-300">registry.js</code>. Star the ones you like; stars are remembered in this browser.
        </p>
      </nav>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-line bg-ink-950/90 px-6 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="mr-auto min-w-0">
              <h2 className="text-lg font-semibold">{group.title}</h2>
              <p className="text-xs text-muted">{group.blurb} Fixed example data, so it looks the same every time.</p>
            </div>
            <select
              aria-label="Component"
              value={group.id}
              onChange={(e) => { window.location.hash = e.target.value; }}
              className="field w-auto md:hidden"
            >
              {GROUPS.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
            <Segmented label="Width" value={width} onChange={setWidth} options={WIDTHS} />
            <Segmented label="View" value={view} onChange={setView} options={[{ id: 'compare', label: 'Compare' }, { id: 'focus', label: 'Focus' }]} />
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={onlyStarred} onChange={(e) => setOnlyStarred(e.target.checked)} className="accent-[#4fa3ff]" />
              Shortlist only
            </label>
          </div>
          {view === 'focus' && group.variants.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Variants">
              {group.variants.map((v) => {
                const active = (focusId || shown[0]?.id) === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFocusId(v.id)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${active ? 'border-accent bg-accent/15 text-accent' : 'border-line text-muted hover:text-gray-100'}`}
                  >
                    {v.id} · {v.name}{starred[key(v)] ? ' ★' : ''}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        <div className="p-6">
          {shown.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-6 py-12 text-center text-sm text-muted">
              Nothing starred in {group.title} yet. Star a variant with the ★ button, or untick “Shortlist only”.
            </p>
          ) : (
            <div className={view === 'compare' ? 'grid gap-x-10 gap-y-12' : ''} style={view === 'compare' ? { gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${(WIDTHS.find((w) => w.id === width)?.px ?? 460) + 20}px), 1fr))` } : undefined}>
              {shown.map((v) => (
                <Variant key={v.id} group={group} variant={v} width={width} starred={Boolean(starred[key(v)])} onStar={() => toggleStar(v)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
