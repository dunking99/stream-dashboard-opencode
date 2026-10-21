import { spots, surname, onColor } from '../matchData.js';

// 5. Pixel pitch: an 8-bit, top-down kickabout in the spirit of the old Amiga football games.
// Sprites are drawn from character maps, the grass is mown in stripes, scorers do the arms-up
// celebration, and the players who came on wait in a pixel dugout.

const pixel = "'Silkscreen', 'Courier New', monospace";
const SKIN = ['#f5cfa0', '#d9a066', '#8d5524'];
const HAIR = ['#2b1d12', '#6b4a2b', '#d8b24a', '#111'];

// 9 x 13 sprites. h hair, s skin, k shirt, d shorts, w socks, b boots, . clear
const STAND = ['...hhh...', '..hhhhh..', '..sssss..', '...sss...', '.kkkkkkk.', 'skkkkkkks', 'skkkkkkks', '.kkkkkkk.', '..ddddd..', '..dd.dd..', '..ww.ww..', '..ww.ww..', '.bbb.bbb.'];
const CHEER = ['...hhh...', 's.hhhhh.s', 's.sssss.s', 'sk.sss.ks', '.kkkkkkk.', '..kkkkk..', '..kkkkk..', '.kkkkkkk.', '..ddddd..', '..dd.dd..', '..ww.ww..', '..ww.ww..', '.bbb.bbb.'];

function Sprite({ shirt, seed, cheer = false, size = 30 }) {
  const shorts = onColor(shirt) === '#fff' ? '#f4f4f4' : '#1d2a6b';
  const pal = { h: HAIR[seed % 4], s: SKIN[seed % 3], k: shirt, d: shorts, w: '#f4f4f4', b: '#111' };
  return (
    <svg viewBox="0 0 9 13" width={size} height={(size * 13) / 9} shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block' }}>
      {(cheer ? CHEER : STAND).flatMap((row, y) => [...row].map((ch, x) => (pal[ch] ? <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={pal[ch]} /> : null)))}
    </svg>
  );
}

function Grass() {
  const w = '#f4f4f4';
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 160 247" preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden="true">
      {Array.from({ length: 13 }, (_, i) => <rect key={i} x="0" y={i * 19} width="160" height="19" fill={i % 2 ? '#2f8a2a' : '#359a2f'} />)}
      <g fill="none" stroke={w} strokeWidth="2">
        <rect x="8" y="10" width="144" height="227" />
        <path d="M8 123.5H152" />
        <circle cx="80" cy="123.5" r="20" />
        <rect x="42" y="10" width="76" height="36" /><rect x="62" y="10" width="36" height="14" />
        <rect x="42" y="201" width="76" height="36" /><rect x="62" y="223" width="36" height="14" />
      </g>
      <g fill={w}><rect x="79" y="122.5" width="2" height="2" /><rect x="79" y="34" width="2" height="2" /><rect x="79" y="211" width="2" height="2" /></g>
      {[0, 1].map((k) => <rect key={k} x="66" y={k ? 237 : 4} width="28" height="6" fill="#d9d9d9" stroke="#777" strokeWidth="1" />)}
    </svg>
  );
}

const label = { fontFamily: pixel, fontSize: 10, color: '#fff', textShadow: '1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000', lineHeight: 1 };

export function PixelPitch({ d }) {
  const items = spots(d, 'portrait', 0.93);
  const colorOf = (side) => d[side].color || '#c33';
  const ons = ['home', 'away'].flatMap((side) => (d.lineups?.[side]?.bench || []).filter((b) => b.subbedIn).map((b) => ({ side, b })));
  const score = d.status.state === 'scheduled' ? d.status.detail : `${d.home.score} - ${d.away.score}`;
  return (
    <div className="mx-auto w-full max-w-[500px]" style={{ fontFamily: pixel }}>
      <style>{'@keyframes px-blink{50%{opacity:0}} .px-blink{animation:px-blink 1s steps(1) infinite} @keyframes px-hop{50%{transform:translateY(-4px)}} .px-hop{animation:px-hop .6s steps(1) infinite} @media (prefers-reduced-motion:reduce){.px-blink,.px-hop{animation:none}}'}</style>
      <div className="flex items-center justify-between gap-2 bg-black px-3 py-2 text-[12px] text-[#ffe14d]" style={{ borderBottom: '4px solid #444' }}>
        <span className="truncate">{d.home.name.toUpperCase()}</span>
        <span className="shrink-0 bg-[#1a1a1a] px-2 py-1 text-[#fff]">{score}</span>
        <span className="truncate text-right">{d.away.name.toUpperCase()}</span>
      </div>
      {d.status.state !== 'scheduled' && <div className="bg-black pb-1 text-center text-[10px] text-[#9be37f]">{d.status.state === 'live' ? <span className="px-blink">LIVE {d.status.detail}</span> : 'FULL TIME'}</div>}

      <div className="relative w-full" style={{ aspectRatio: '160 / 247', imageRendering: 'pixelated' }}>
        <Grass />
        {items.length === 0 && <p className="absolute inset-0 flex items-center justify-center text-center text-[11px] text-white">TEAMS NOT YET ON THE PITCH</p>}
        {items.map(({ side, p, left, top, f }) => (
          <div key={`${side}${p.id}`} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5" style={{ left: `${left}%`, top: `${top}%`, opacity: p.subbedOut ? 0.78 : 1 }}>
            {f.goals > 0 && <span className="px-blink absolute left-full top-1 ml-1 text-[10px]" style={{ ...label, color: '#ffe14d' }}>GOAL!</span>}
            {(f.yellow || f.red) && <span className="absolute -right-2 -top-1.5 h-[11px] w-[8px]" style={{ background: f.red ? '#e03a2c' : '#ffd800', border: '1px solid #000' }} />}
            <span className={f.goals > 0 ? 'px-hop' : ''}><Sprite shirt={colorOf(side)} seed={Number(p.jersey) || 0} cheer={f.goals > 0} /></span>
            <span style={{ ...label, color: p.subbedOut ? '#ff9c94' : '#fff' }}>{p.subbedOut ? '▼' : p.jersey} {surname(p.name).toUpperCase().slice(0, 9)}</span>
          </div>
        ))}
      </div>

      {ons.length > 0 && (
        <div className="bg-[#1b1b1b] px-3 pb-3 pt-2" style={{ borderTop: '4px solid #444' }}>
          <div className="mb-2 text-[10px] text-[#9be37f]">DUGOUT</div>
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {ons.map(({ side, b }) => (
              <div key={b.id} className="flex flex-col items-center gap-0.5">
                <Sprite shirt={colorOf(side)} seed={Number(b.jersey) || 0} size={22} />
                <span style={{ ...label, fontSize: 9 }}>{surname(b.name).toUpperCase().slice(0, 8)}</span>
                <span style={{ ...label, fontSize: 9, color: '#9be37f' }}>{b.inMin > 90 ? '90+' : b.inMin}'</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
