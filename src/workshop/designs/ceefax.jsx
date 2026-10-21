import { useState } from 'react';
import { surname, numOf, kindOf, flagsOf, layoutTeam } from '../matchData.js';

// E. Ceefax: the match centre as a teletext page. 40 columns, the eight teletext colours, mosaic
// blocks for bars, a pitch drawn in characters, and the red / green / yellow / cyan fastext
// buttons as the tabs. Everything is text on a character grid, so every line is fitted to 40.

const K = { k: '#000', r: '#ff2a2a', g: '#2dff4a', y: '#ffff00', b: '#2323ff', c: '#00ffff', w: '#fff' };
const COLS = 40;
const LH = 32; // line height in px; the font size is set to match
const font = { fontFamily: "'VT323', 'Courier New', monospace", fontSize: 30, lineHeight: `${LH}px` };
const sideColor = (side) => (side === 'home' ? K.y : K.c);

const fit = (s, n) => String(s).slice(0, n);
const mid = (s, n) => { const t = fit(s, n); const l = Math.floor((n - t.length) / 2); return ' '.repeat(l) + t + ' '.repeat(n - t.length - l); };
const clockOf = (e) => e.clock.replace(/'/g, '');
const SHORT = { goal: 'GOAL', yellow: 'YELLOW', red: 'RED', miss: 'PEN MISSED', sub: 'SUB', other: '' };

// one coloured run of text
const T = ({ c = K.w, bg, children }) => <span style={{ color: c, background: bg }}>{children}</span>;
const Row = ({ children, bg }) => <div className="whitespace-pre" style={{ height: LH, background: bg }}>{children}</div>;
const Blank = () => <Row>{' '}</Row>;
// teletext "double height": same width, twice the height
const Big = ({ children, bg }) => (
  <div style={{ height: LH * 2, background: bg, overflow: 'hidden' }}>
    <div className="whitespace-pre" style={{ transform: 'scaleY(2)', transformOrigin: '0 0', height: LH }}>{children}</div>
  </div>
);

function wrap(text, width) {
  const lines = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if ((cur + ' ' + w).trim().length > width) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

// a bar of mosaic blocks, home share in yellow, away share in cyan. Blocks are drawn at an exact
// number of character widths (glyphs would drift off the grid in fallback fonts).
const Block = ({ n, c }) => (n > 0 ? <span style={{ display: 'inline-block', width: `${n}ch`, height: LH - 12, background: c, verticalAlign: 'middle' }} /> : null);
function Bar({ home, away, width }) {
  const [h, a] = [numOf(home) ?? 0, numOf(away) ?? 0];
  if (h + a === 0) return <Block n={width} c={K.b} />;
  const n = Math.round((h / (h + a)) * width);
  return <><Block n={n} c={K.y} /><Block n={width - n} c={K.c} /></>;
}

// ---------------------------------------------------------------------------------------------
const PAGES = [
  { id: 'report', n: 302, label: 'REPORT', c: K.r },
  { id: 'lineups', n: 303, label: 'LINEUPS', c: K.g },
  { id: 'stats', n: 304, label: 'STATS', c: K.y },
  { id: 'events', n: 305, label: 'EVENTS', c: K.c },
];

function Header({ d, page }) {
  const right = `${d.kickoffLabel.toUpperCase()} ${d.updatedLabel}`;
  const left = `P${page.n} MATCH CENTRE ${page.n}`;
  return <Row><T c={K.w}>{left}</T><T c={K.y}>{' '.repeat(COLS - left.length - right.length)}{right}</T></Row>;
}

function Title({ d }) {
  const scheduled = d.status.state === 'scheduled';
  const score = scheduled ? 'v' : `${d.home.score}-${d.away.score}`;
  const line = fit(d.home.name.toUpperCase(), 16).padEnd(16) + mid(score, 8) + fit(d.away.name.toUpperCase(), 16).padStart(16);
  const live = d.status.state === 'live';
  const status = scheduled ? `KICK-OFF ${d.status.detail.toUpperCase()}` : live ? `LIVE ${d.status.detail.replace("'", '')} MINS` : 'FULL TIME';
  return (
    <>
      <Big bg={K.b}><T c={K.w}>{line}</T></Big>
      <Row bg={K.b}><T c={live ? K.y : K.c}><span className={live ? 'tt-flash' : undefined}>{mid(status, COLS)}</span></T></Row>
      <Blank />
      {['home', 'away'].map((side) => d.timeline.filter((e) => e.side === side && e.scoring).map((e) => {
        const txt = `${surname(e.player).toUpperCase()} ${clockOf(e)}`;
        return <Row key={e.id}><T c={sideColor(side)}>{side === 'home' ? ` ${txt}` : txt.padStart(COLS - 1) + ' '}</T></Row>;
      }))}
    </>
  );
}

function Heading({ children }) {
  return <Row bg={K.b}><T c={K.w}>{` ${children}`.padEnd(COLS)}</T></Row>;
}

function Fact({ k, v }) {
  return v ? <Row><T c={K.c}>{` ${k}`.padEnd(11)}</T><T c={K.w}>{fit(String(v).toUpperCase(), COLS - 12)}</T></Row> : null;
}

function StatLine({ s }) {
  const label = fit(s.label.toUpperCase(), 12).padEnd(12);
  return (
    <Row>
      <T c={K.w}>{` ${label}`}</T><T c={K.y}>{String(s.home).padStart(3)}</T><T> </T><Bar home={s.home} away={s.away} width={14} /><T> </T><T c={K.c}>{String(s.away).padEnd(3)}</T>
    </Row>
  );
}

function Report({ d }) {
  const keys = ['totalShots', 'shotsOnTarget', 'wonCorners'];
  const stats = keys.map((k) => d.stats.find((s) => s.name === k)).filter(Boolean);
  return (
    <>
      <Heading>MATCH FACTS</Heading>
      <Fact k="VENUE" v={d.venue} /><Fact k="CITY" v={d.city} /><Fact k="KICK-OFF" v={d.kickoffLabel} />
      <Fact k="CROWD" v={d.attendance?.toLocaleString()} /><Fact k="TV" v={d.broadcasts?.join(', ')} />
      <Blank />
      <Heading>KEY STATS</Heading>
      {stats.length ? stats.map((s) => <StatLine key={s.name} s={s} />) : <Row><T c={K.w}>{' NO STATS UNTIL KICK-OFF'}</T></Row>}
      <Blank />
      <Row><T c={K.g}>{' 303 LINEUPS  304 STATS  305 EVENTS'}</T></Row>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// The pitch, in characters: portrait, away team at the top, home at the bottom. Squad numbers sit
// in the grid cell nearest their position; a letter after the number is the player's story.
const PW = 38;
const PH = 23;

function Pitch({ d }) {
  const grid = Array.from({ length: PH }, () => Array.from({ length: PW }, () => ({ ch: ' ', c: K.g })));
  const put = (r, c, s, col) => [...s].forEach((ch, i) => { if (grid[r]?.[c + i]) grid[r][c + i] = { ch, c: col }; });
  for (let c = 0; c < PW; c++) { put(0, c, '-', K.g); put(PH - 1, c, '-', K.g); put(Math.floor(PH / 2), c, '-', K.g); }
  for (let r = 0; r < PH; r++) { put(r, 0, '|', K.g); put(r, PW - 1, '|', K.g); }
  for (const [r0, r1] of [[0, 3], [PH - 4, PH - 1]]) {
    for (let c = 9; c <= 28; c++) put(r0 === 0 ? r1 : r0, c, '-', K.g);
    for (let r = r0; r <= r1; r++) { put(r, 9, '|', K.g); put(r, 28, '|', K.g); }
  }
  put(Math.floor(PH / 2), 17, '(  )', K.g);

  for (const side of ['home', 'away']) {
    for (const { p, x, y } of layoutTeam(d.lineups?.[side], side)) {
      const f = flagsOf(d, p.name);
      const row = Math.round(((100 - x) / 100) * (PH - 1));
      const col = Math.round((y / 100) * (PW - 5)) + 1;
      const flag = f.goals ? 'G' : f.red ? 'R' : f.yellow ? 'Y' : p.subbedOut ? '*' : ' ';
      put(row, col, `${p.jersey.padStart(2)}${flag}`, p.subbedOut ? K.r : sideColor(side));
    }
  }

  return (
    <div className="whitespace-pre" style={{ lineHeight: `${LH - 6}px` }}>
      {grid.map((cells, r) => {
        const runs = [];
        for (const cell of cells) {
          const last = runs[runs.length - 1];
          if (last && last.c === cell.c) last.t += cell.ch; else runs.push({ c: cell.c, t: cell.ch });
        }
        return <div key={r} style={{ height: LH - 6 }}>{' '}{runs.map((run, i) => <T key={i} c={run.c}>{run.t}</T>)}</div>;
      })}
    </div>
  );
}

function Lineups({ d }) {
  if (!d.lineups) return <><Heading>LINEUPS</Heading><Row><T c={K.w}>{' NOT ANNOUNCED YET'}</T></Row></>;
  const xi = (side) => [...d.lineups[side].starters].sort((a, b) => Number(a.place) - Number(b.place));
  const ons = ['home', 'away'].flatMap((side) => d.lineups[side].bench.filter((b) => b.subbedIn).map((b) => ({ side, b })));
  return (
    <>
      <Row bg={K.b}><T c={K.c}>{` ${fit(d.away.name.toUpperCase(), 22)}`.padEnd(COLS - 8)}</T><T c={K.w}>{(d.lineups.away.formation || '').padStart(7) + ' '}</T></Row>
      <Pitch d={d} />
      <Row bg={K.b}><T c={K.y}>{` ${fit(d.home.name.toUpperCase(), 22)}`.padEnd(COLS - 8)}</T><T c={K.w}>{(d.lineups.home.formation || '').padStart(7) + ' '}</T></Row>
      <Row><T c={K.g}>{' G GOAL  Y YELLOW  R RED  '}</T><T c={K.r}>{'* OFF'}</T></Row>
      <Blank />
      {xi('home').map((p, i) => {
        const q = xi('away')[i];
        const cell = (pl) => (pl ? `${pl.jersey.padStart(2)} ${fit(surname(pl.name).toUpperCase(), 14)}`.padEnd(19) : ' '.repeat(19));
        return <Row key={p.id}><T c={p.subbedOut ? K.r : K.y}>{` ${cell(p)}`}</T><T c={q?.subbedOut ? K.r : K.c}>{cell(q)}</T></Row>;
      })}
      {ons.length > 0 && (
        <>
          <Blank />
          {wrap(ons.map(({ b }) => `${surname(b.name).toUpperCase()} ${b.inMin > 90 ? '90+' : b.inMin}`).join('  '), COLS - 8).map((line, i) => (
            <Row key={i}><T c={K.w}>{i === 0 ? ' ON: ' : '     '}</T><T c={K.g}>{line}</T></Row>
          ))}
        </>
      )}
    </>
  );
}

function Stats({ d }) {
  if (!d.stats.length) return <><Heading>MATCH STATS</Heading><Row><T c={K.w}>{' NONE UNTIL KICK-OFF'}</T></Row></>;
  const poss = d.stats.find((s) => s.name === 'possessionPct');
  return (
    <>
      <Heading>MATCH STATS</Heading>
      <Blank />
      {poss && (
        <>
          <Big><T c={K.y}>{` ${Math.round(numOf(poss.home))}%`.padEnd(8)}</T><T c={K.w}>{mid('POSSESSION', 24)}</T><T c={K.c}>{`${Math.round(numOf(poss.away))}% `.padStart(8)}</T></Big>
          <Row><T>{' '}</T><Bar home={poss.home} away={poss.away} width={COLS - 2} /></Row>
          <Blank />
        </>
      )}
      {d.stats.filter((s) => s !== poss).map((s) => <StatLine key={s.name} s={s} />)}
      <Blank />
      <Heading>TOP PERFORMERS</Heading>
      {d.leaders.map((c) => (
        <div key={c.label}>
          <Row><T c={K.w}>{mid(c.label.toUpperCase(), COLS)}</T></Row>
          <Row>
            <T c={K.y}>{` ${fit(surname(c.home[0]).toUpperCase(), 14)} ${c.home[1]}`.padEnd(COLS / 2)}</T>
            <T c={K.c}>{`${fit(surname(c.away[0]).toUpperCase(), 14)} ${c.away[1]} `.padStart(COLS / 2)}</T>
          </Row>
        </div>
      ))}
    </>
  );
}

function Events({ d }) {
  if (!d.timeline.length) return <><Heading>MATCH EVENTS</Heading><Row><T c={K.w}>{' NOTHING YET'}</T></Row></>;
  return (
    <>
      <Heading>MATCH EVENTS</Heading>
      <Blank />
      {d.timeline.map((e) => {
        const kind = kindOf(e);
        return (
          <Row key={e.id}>
            <T c={K.g}>{clockOf(e).padStart(6)}</T><T>{'  '}</T>
            <T c={sideColor(e.side)}>{fit(SHORT[kind], 10).padEnd(11)}{fit(surname(e.player).toUpperCase(), COLS - 20)}</T>
          </Row>
        );
      })}
    </>
  );
}

export function Ceefax({ d }) {
  const [id, setId] = useState('report');
  const page = PAGES.find((p) => p.id === id);
  const Body = { report: Report, lineups: Lineups, stats: Stats, events: Events }[id];
  return (
    <div className="mx-auto w-fit bg-black p-4">
      <style>{'@keyframes tt-flash{50%{visibility:hidden}} .tt-flash{animation:tt-flash 1.2s steps(1) infinite} @media (prefers-reduced-motion:reduce){.tt-flash{animation:none}}'}</style>
      <div style={{ ...font, width: '40ch', color: K.w, background: K.k }} role="tabpanel" aria-label={`Page ${page.n}`}>
        <Header d={d} page={page} />
        <Title d={d} />
        <Blank />
        <Body d={d} />
        <div className="flex" role="tablist" aria-label="Pages" style={{ marginTop: LH }}>
          {PAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={p.id === id}
              onClick={() => setId(p.id)}
              className="whitespace-pre text-center focus-visible:outline-dashed"
              style={{ width: '10ch', height: LH, color: p.id === id ? K.k : p.c, background: p.id === id ? p.c : K.k }}
            >
              {mid(p.label, 10)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
