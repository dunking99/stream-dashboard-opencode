import { useEffect, useState } from 'react';

const KEY = 'stream-dashboard:sites:v2';
const OLD_KEY = 'stream-dashboard:sites'; // v1 was a plain array of names

const blank = (name) => ({ name, homepage: '', eventsUrl: '', code: '', boxes: [] });

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) return saved;
    const old = JSON.parse(localStorage.getItem(OLD_KEY));
    if (Array.isArray(old)) return old.map(blank);
  } catch { /* storage blocked or corrupt: fall through */ }
  return [blank('Roxiestreams')];
}

const input = 'field';

function Box({ title, onRemove, children }) {
  return (
    <div className="rounded-lg border border-line bg-ink-850 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        {title}
        {onRemove && (
          <button type="button" onClick={onRemove} title="Remove box" aria-label="Remove box" className="text-muted hover:text-live">×</button>
        )}
      </div>
      {children}
    </div>
  );
}

const Label = ({ children }) => <div className="label">{children}</div>;

// Site chips above the Sources | Live Events tabs. The selected site opens a details panel:
// fixed boxes (homepage, events list URL, code) plus any boxes you add yourself.
// Everything is saved in this browser's localStorage and doesn't drive the backend yet.
export default function SitesBar({ onSelect }) {
  const [sites, setSites] = useState(load);
  const [selected, setSelected] = useState(() => load()[0]?.name ?? null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => { onSelect?.(selected); }, [selected, onSelect]);

  const save = (next) => {
    setSites(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* not persisted */ }
  };
  const site = sites.find((s) => s.name === selected);
  const patch = (changes) => save(sites.map((s) => (s === site ? { ...s, ...changes } : s)));
  const patchBox = (id, changes) =>
    patch({ boxes: site.boxes.map((b) => (b.id === id ? { ...b, ...changes } : b)) });

  const add = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (n && !sites.some((s) => s.name.toLowerCase() === n.toLowerCase())) {
      save([...sites, blank(n)]);
      setSelected(n);
    }
    setName('');
    setAdding(false);
  };

  const remove = (s) => {
    if (s.homepage || s.eventsUrl || s.code || s.boxes.length) {
      if (!window.confirm(`Remove ${s.name} and its saved details?`)) return;
    }
    const next = sites.filter((x) => x !== s);
    save(next);
    if (selected === s.name) setSelected(next[0]?.name ?? null);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="label mr-1">Sites</span>
        {sites.map((s) => (
          <span
            key={s.name}
            className={`flex items-center rounded-lg border text-sm ${s.name === selected ? 'border-accent/50 bg-accent/10 text-gray-100' : 'border-line bg-ink-850 text-gray-300 hover:border-accent/40'}`}
          >
            <button type="button" onClick={() => setSelected(s.name)} className="py-1 pl-2.5 pr-1.5">{s.name}</button>
            <button type="button" onClick={() => remove(s)} title={`Remove ${s.name}`} aria-label={`Remove ${s.name}`} className="py-1 pr-2 text-muted hover:text-live">×</button>
          </span>
        ))}

        {adding ? (
          <form onSubmit={add} className="flex items-center gap-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
              placeholder="Site name"
              aria-label="New site name"
              className="field w-36 py-1"
            />
            <button type="submit" className="btn-primary">Add</button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-lg border border-dashed border-line px-3 py-1 text-sm text-muted transition hover:border-accent/50 hover:text-gray-200"
          >
            + Add site
          </button>
        )}
      </div>

      {site && (
        <div className="space-y-2">
          <Box title={<Label>Homepage URL</Label>}>
            <input className={input} value={site.homepage} onChange={(e) => patch({ homepage: e.target.value })} placeholder="https://…" aria-label="Homepage URL" />
          </Box>
          <Box title={<Label>Events list URL</Label>}>
            <input className={input} value={site.eventsUrl} onChange={(e) => patch({ eventsUrl: e.target.value })} placeholder="https://…/soccer" aria-label="Events list URL" />
          </Box>
          <Box title={<Label>Code</Label>}>
            <textarea
              className={`${input} font-mono h-24`}
              value={site.code}
              onChange={(e) => patch({ code: e.target.value })}
              placeholder="Selectors, regexes, embed snippets…"
              aria-label="Site code"
              spellCheck={false}
            />
          </Box>

          {site.boxes.map((b) => (
            <Box
              key={b.id}
              onRemove={() => patch({ boxes: site.boxes.filter((x) => x.id !== b.id) })}
              title={
                <input
                  className="w-full bg-transparent text-xs uppercase tracking-wide text-muted outline-none placeholder:text-muted/60"
                  value={b.title}
                  onChange={(e) => patchBox(b.id, { title: e.target.value })}
                  placeholder="Box title"
                  aria-label="Box title"
                />
              }
            >
              <textarea className={`${input} h-20`} value={b.content} onChange={(e) => patchBox(b.id, { content: e.target.value })} placeholder="Content" aria-label="Box content" />
            </Box>
          ))}

          <button
            type="button"
            onClick={() => patch({ boxes: [...site.boxes, { id: crypto.randomUUID(), title: '', content: '' }] })}
            className="w-full rounded-lg border border-dashed border-line py-1.5 text-sm text-muted transition hover:border-accent/50 hover:text-gray-200"
          >
            + Add box
          </button>
        </div>
      )}
    </div>
  );
}
