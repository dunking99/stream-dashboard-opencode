import { rowsOf, surname, flagsOf, kindOf, onColor } from '../matchData.js';

// 2. Sticker album: an open football sticker album, one page per team. The XI are stickers stuck
// down in formation, attack at the top. Scorers get the shiny foil; a substituted-off player's
// sticker is half peeled away.

const PAPER = '#efe6d0';
const colorOf = (d, side) => d[side].color || '#888';
const display = "'Anton', 'Arial Narrow', Impact, sans-serif";
const shade = (hex, t) => {
  const n = parseInt(hex.slice(1), 16);
  const m = (v) => Math.round(v * (1 - t));
  return `rgb(${m(n >> 16)}, ${m((n >> 8) & 255)}, ${m(n & 255)})`;
};

function Sticker({ d, side, p, scale = 1 }) {
  const c = colorOf(d, side);
  const f = flagsOf(d, p.name);
  const w = 78 * scale, h = 104 * scale;
  const tilt = ((Number(p.jersey) || 0) % 5) - 2;
  const minute = d.timeline.find((e) => e.player === p.name && kindOf(e) === 'goal')?.clock;
  return (
    <div className="relative shrink-0" style={{ width: w, height: h, transform: `rotate(${tilt * 0.8}deg)`, filter: p.subbedOut ? 'saturate(.55)' : undefined }} title={`${p.jersey} ${p.name}`}>
      <div className="absolute inset-0 rounded-[3px] bg-white p-[3px]" style={{ boxShadow: '0 1px 0 rgba(0,0,0,.18), 0 8px 10px -6px rgba(0,0,0,.5)' }}>
        <div className="relative h-full overflow-hidden rounded-[2px]" style={{ background: `linear-gradient(160deg, ${c}, ${shade(c, 0.45)})` }}>
          <svg viewBox="0 0 60 70" className="absolute inset-x-0 top-1" style={{ opacity: 0.32 }} aria-hidden="true">
            <circle cx="30" cy="22" r="11" fill="#fff" /><path d="M8 70c0-17 9-27 22-27s22 10 22 27Z" fill="#fff" />
          </svg>
          <span className="absolute left-1 top-0.5 leading-none" style={{ fontFamily: display, fontSize: 22 * scale, color: onColor(c), WebkitTextStroke: onColor(c) === '#fff' ? '0' : '0' }}>{p.jersey}</span>
          {f.goals > 0 && (
            <>
              <span className="absolute inset-0" style={{ background: 'conic-gradient(from 30deg, #ff8fd0, #ffe66d, #6df0c2, #7aa7ff, #ff8fd0)', mixBlendMode: 'soft-light', opacity: 0.85 }} />
              <span className="absolute right-1 top-1 rounded-sm bg-black/75 px-1 text-[9px] font-bold leading-tight text-white" style={{ fontSize: 9 * scale }}>⚽ {minute}</span>
            </>
          )}
          {(f.yellow || f.red) && <span className="absolute right-1.5 top-6 h-3 w-2 rounded-[1px]" style={{ background: f.red ? '#e03a2c' : '#f2c200', boxShadow: '0 0 0 1px #fff' }} />}
          <div className="absolute inset-x-0 bottom-0 bg-white px-1 pb-0.5 pt-px text-center leading-none">
            <div className="truncate uppercase text-black" style={{ fontFamily: display, fontSize: 13 * scale, letterSpacing: '0.02em' }}>{surname(p.name)}</div>
            <div className="text-[8px] font-bold tracking-wide text-black/50" style={{ fontSize: 8 * scale }}>{p.position}</div>
          </div>
        </div>
      </div>
      {p.subbedOut && (
        <span className="absolute bottom-0 right-0" aria-label="Substituted off" style={{ width: 30 * scale, height: 30 * scale, background: `linear-gradient(135deg, transparent 50%, #d9cdb0 50%, #f6efdc)`, borderTopLeftRadius: 6, boxShadow: '-3px -3px 5px -2px rgba(0,0,0,.35)' }} />
      )}
    </div>
  );
}

function Page({ d, side }) {
  const lu = d.lineups?.[side];
  const rows = rowsOf(lu);
  const c = colorOf(d, side);
  const ons = lu?.bench.filter((b) => b.subbedIn) || [];
  return (
    <section className="relative min-w-0 flex-1 basis-[330px] px-4 pb-5 pt-4" style={{ background: PAPER, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.08), inset 0 0 40px rgba(120,90,40,.18)' }}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <filter id="paperGrain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="3" /><feColorMatrix values="0 0 0 0 .4  0 0 0 0 .3  0 0 0 0 .15  0 0 0 .09 0" /></filter>
        <rect width="100%" height="100%" filter="url(#paperGrain)" />
      </svg>
      <header className="relative flex items-end justify-between border-b-[3px] pb-1.5" style={{ borderColor: c }}>
        <h3 className="uppercase leading-none text-[#1d1a14]" style={{ fontFamily: display, fontSize: 30, letterSpacing: '0.02em' }}>{d[side].name}</h3>
        <span className="pb-0.5 text-[13px] font-bold tabular-nums text-[#6f6550]">{lu?.formation}</span>
      </header>
      {rows.length === 0 ? <p className="relative py-10 text-center text-sm italic text-[#6f6550]">Stickers not issued yet.</p> : (
        <div className="relative mt-4 flex flex-col gap-3.5">
          {[...rows].reverse().map((row, i) => (
            <div key={i} className="flex flex-wrap justify-center gap-x-3 gap-y-3">
              {row.map((p) => <Sticker key={p.id} d={d} side={side} p={p} />)}
            </div>
          ))}
        </div>
      )}
      {ons.length > 0 && (
        <div className="relative mt-5 border-t border-dashed pt-3" style={{ borderColor: 'rgba(0,0,0,.25)' }}>
          <div className="mb-2 text-[11px] font-bold text-[#6f6550]">Swapped in</div>
          <div className="flex flex-wrap gap-2.5">
            {ons.map((b) => (
              <div key={b.id} className="relative">
                <Sticker d={d} side={side} p={b} scale={0.72} />
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1d1a14] px-1.5 text-[10px] font-bold text-white">↑ {b.inMin > 90 ? '90+' : b.inMin}'</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function StickerAlbum({ d }) {
  return (
    <div className="mx-auto flex w-full max-w-[980px] flex-wrap overflow-hidden rounded-md" style={{ background: '#2a2018', padding: 10, gap: 10, boxShadow: '0 16px 30px -14px rgba(0,0,0,.7)' }}>
      <Page d={d} side="home" />
      <Page d={d} side="away" />
    </div>
  );
}
