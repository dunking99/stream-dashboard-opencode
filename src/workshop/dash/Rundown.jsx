import { Shield, Icon, Kbd, Tally } from './bits.jsx';

// The rundown: every match, as a running order. Live first, then what's next, then what's done.
// Favourites float to the top; a small bar of squares says how many feeds each match has.

const LABEL = { live: 'Live', next: 'Next', done: 'Done' };

function Feeds({ n }) {
  return (
    <span className="flex items-end gap-[2px]" title={`${n} feed${n === 1 ? '' : 's'}`} aria-label={`${n} feeds`}>
      {Array.from({ length: 5 }, (_, i) => <span key={i} style={{ width: 4, height: 4 + i * 2, background: i < n ? 'var(--green)' : '#3a3833' }} />)}
    </span>
  );
}

function Row({ m, selected, fav, flash, onSelect, onFav }) {
  const live = m.status === 'live';
  const when = live ? `${m.min}'` : m.status === 'done' ? 'FT' : m.time;
  const score = (v) => (m.status === 'next' ? '' : v);
  return (
    <div
      role="button" tabIndex={0} className={`row ${flash ? 'flash' : ''}`} aria-current={selected} aria-label={`${m.home} v ${m.away}`}
      onClick={() => onSelect(m.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(m.id); } }}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="flex w-10 shrink-0 flex-col items-end gap-0.5">
          <span className={`mono text-[12.5px] ${live ? 't-red' : 't-dim'}`}>{when}</span>
          {live && <Tally kind="pgm" pulse size={6} />}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          {[['home', m.home, m.hc, m.hs], ['away', m.away, m.ac, m.as]].map(([k, name, c, sc]) => (
            <div key={k} className="flex items-center gap-2">
              <Shield color={c} label={name} size={15} />
              <span className="min-w-0 flex-1 truncate text-[13px]">{name}</span>
              <span className={`mono w-4 text-right text-[13px] ${live ? 'font-semibold' : 't-dim'}`}>{score(sc)}</span>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2">
          <button type="button" className="ghost" aria-pressed={fav} aria-label={`${fav ? 'Remove' : 'Add'} ${m.home} v ${m.away} ${fav ? 'from' : 'to'} favourites`} onClick={(e) => { e.stopPropagation(); onFav(m.id); }} style={{ color: fav ? 'var(--amber)' : 'var(--faint)', padding: 2 }}>
            <Icon name="star" size={14} className={fav ? '' : ''} />
          </button>
          <Feeds n={m.streams} />
        </div>
      </div>
    </div>
  );
}

export default function Rundown({ matches, selectedId, onSelect, favs, onFav, query, setQuery, tab, setTab, favOnly, setFavOnly, flashId, searchRef }) {
  const q = query.trim().toLowerCase();
  const visible = matches.filter((m) => (!q || `${m.home} ${m.away} ${m.league}`.toLowerCase().includes(q)) && (!favOnly || favs.has(m.id)));
  const inTab = visible.filter((m) => m.status === tab);
  const counts = Object.fromEntries(['live', 'next', 'done'].map((s) => [s, visible.filter((m) => m.status === s).length]));
  const favRows = inTab.filter((m) => favs.has(m.id));
  const rest = inTab.filter((m) => !favs.has(m.id));
  const byLeague = rest.reduce((acc, m) => ((acc[m.league] ||= []).push(m), acc), {});
  const renderRow = (m) => <Row key={m.id} m={m} selected={m.id === selectedId} fav={favs.has(m.id)} flash={flashId === m.id} onSelect={onSelect} onFav={onFav} />;

  return (
    <section className="panel flex min-h-0 flex-col" aria-label="Rundown" style={{ borderTop: 0, borderBottom: 0, borderLeft: 0 }}>
      <div className="bar flex items-center justify-between px-3 py-2">
        <h2 className="text-[13px] font-semibold">Rundown</h2>
        <span className="t-dim mono text-[11.5px]">{matches.length} matches</span>
      </div>
      <div className="space-y-2 border-b px-3 py-2.5" style={{ borderColor: 'var(--line)' }}>
        <div className="relative">
          <input ref={searchRef} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a team or league" aria-label="Search matches" style={{ paddingLeft: 28, paddingRight: 30 }} />
          <Icon name="search" size={14} className="t-faint absolute left-2 top-1/2 -translate-y-1/2" />
          <span className="absolute right-2 top-1/2 -translate-y-1/2"><Kbd>/</Kbd></span>
        </div>
        <div className="flex items-center gap-2">
          <select aria-label="Sport" defaultValue="football" style={{ width: 'auto', flex: 1 }}><option value="football">Football</option><option>Basketball</option><option>Tennis</option></select>
          <select aria-label="League" defaultValue="all" style={{ width: 'auto', flex: 1 }}><option value="all">All leagues</option><option>Champions League</option><option>La Liga</option><option>Saudi Pro League</option></select>
          <button type="button" className="btn" aria-pressed={favOnly} onClick={() => setFavOnly(!favOnly)} title="Favourites only" style={{ padding: '4px 7px', color: favOnly ? 'var(--amber)' : 'var(--dim)', borderColor: favOnly ? 'var(--amber)' : undefined }}><Icon name="star" size={14} /></button>
        </div>
        <div className="seg w-full" role="group" aria-label="Show">
          {['live', 'next', 'done'].map((s) => (
            <button key={s} type="button" aria-pressed={tab === s} onClick={() => setTab(s)} style={{ flex: 1 }}>{LABEL[s]} <span className="mono t-faint">{counts[s]}</span></button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" role="list">
        {inTab.length === 0 && <p className="t-dim px-4 py-8 text-center text-[12.5px]">{favOnly ? 'No favourites here yet. Star a match to pin it.' : q ? `Nothing matches “${query}”.` : 'Nothing here right now.'}</p>}
        {favRows.length > 0 && (
          <>
            <h3 className="t-amber flex items-center gap-1.5 px-3 pb-1 pt-3 text-[11.5px] font-semibold"><Icon name="star" size={11} />Favourites</h3>
            {favRows.map(renderRow)}
          </>
        )}
        {Object.entries(byLeague).map(([league, list]) => (
          <div key={league}>
            <h3 className="t-dim px-3 pb-1 pt-3 text-[11.5px] font-semibold">{league}</h3>
            {list.map(renderRow)}
          </div>
        ))}
      </div>
    </section>
  );
}
