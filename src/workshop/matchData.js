// Example match shared by every match-centre design: Al Nassr 1-0 Neom SC. The shape is that of
// /api/event-detail (providers/espnDetail.js), plus a few lab-only fields (`inMin` / `outMin`,
// team `colors`) so the lab can replay the match to a minute and try team-coloured designs.
const parseClock = (c) => {
  const m = String(c).match(/^(\d+)'?(?:\+(\d+))?/);
  return m ? Number(m[1]) + Number(m[2] || 0) : 0;
};
const P = (place, jersey, name, position, extra = {}) => ({ id: name, name, jersey: String(jersey), position, starter: true, place: String(place), ...extra });
const B = (jersey, name, position, inMin) => ({ id: name, name, jersey: String(jersey), position, starter: false, place: null, inMin });

const LINEUPS = {
  home: {
    formation: '4-2-3-1',
    starters: [
      P(1, 24, 'Bento', 'G'), P(2, 23, 'Aiman Yahya', 'LB', { outMin: 72 }), P(3, 26, 'Iñigo Martínez', 'CD-L'),
      P(4, 5, 'Abdulelah Al-Amri', 'CD-R'), P(5, 12, 'Nawaf Boushal', 'RB'), P(6, 11, 'Samú Costa', 'CM-L'),
      P(7, 17, 'Abdullah Al-Khaibari', 'CM-R'), P(8, 10, 'Sadio Mané', 'AM-L', { outMin: 91 }),
      P(9, 79, 'João Félix', 'AM', { outMin: 81 }), P(10, 20, 'Ângelo Gabriel', 'AM-R', { outMin: 91 }), P(11, 7, 'Cristiano Ronaldo', 'F'),
    ],
    bench: [B(14, 'Abdullah Al-Hamdan', 'D', 72), B(29, 'Awad Aman', 'M', 81), B(21, 'Saad Haqawi', 'M', 91), B(33, 'Sami Al-Najei', 'F', 91)],
  },
  away: {
    formation: '3-4-3',
    starters: [
      P(1, 1, 'Marcin Bulka', 'G'), P(2, 5, 'Malang Sarr', 'CD-L'), P(3, 44, 'Nathan Zeze', 'CD'),
      P(4, 55, 'Mohammed Al Dossari', 'CD-R', { outMin: 76 }), P(5, 19, 'Mohannad Abu Taha', 'LM', { outMin: 76 }),
      P(6, 6, 'Abbas Al Hassan', 'CM-L', { outMin: 57 }), P(7, 15, 'Abdulmalik Al Oyayari', 'CM-R', { outMin: 57 }),
      P(8, 2, 'Mohammed Al-Burayk', 'RM'), P(9, 10, 'Said Benrahma', 'CF-L'), P(10, 91, 'Alexandre Lacazette', 'F'),
      P(11, 14, 'Khalil Al-Absi', 'CF-R', { outMin: 77 }),
    ],
    bench: [B(7, 'Georgios Masouras', 'M', 57), B(9, 'Valentin Vada', 'M', 57), B(11, 'Faisal Al-Ghamdi', 'F', 77), B(17, 'Khalifah Al-Dawsari', 'M', 76), B(20, 'Haroune Camara', 'F', 76)],
  },
};

const EV = (id, clock, label, side, player, text, scoring = false) => ({ id, clock, min: parseClock(clock), label, side, team: side === 'home' ? 'Al Nassr' : 'Neom SC', player, text, scoring });
const TIMELINE = [
  EV(1, "45'+6'", 'Penalty - Missed', 'home', 'Cristiano Ronaldo', "Cristiano Ronaldo (Al Nassr) Penalty - Missed at 45'+6'"),
  EV(2, "56'", 'Yellow Card', 'away', 'Mohannad Abu Taha', "Mohannad Abu Taha (Neom SC) Yellow Card at 56'"),
  EV(3, "57'", 'Substitution', 'away', 'Valentin Vada', "Valentin Vada (Neom SC) Substitution at 57'"),
  EV(4, "57'", 'Substitution', 'away', 'Georgios Masouras', "Georgios Masouras (Neom SC) Substitution at 57'"),
  EV(5, "61'", 'Goal', 'home', 'João Félix', "João Félix (Al Nassr) Goal at 61'", true),
  EV(6, "63'", 'Yellow Card', 'home', 'Samú Costa', "Samú Costa (Al Nassr) Yellow Card at 63'"),
  EV(7, "72'", 'Substitution', 'home', 'Abdullah Al-Hamdan', "Abdullah Al-Hamdan (Al Nassr) Substitution at 72'"),
  EV(8, "76'", 'Substitution', 'away', 'Haroune Camara', "Haroune Camara (Neom SC) Substitution at 76'"),
  EV(9, "76'", 'Substitution', 'away', 'Khalifah Al-Dawsari', "Khalifah Al-Dawsari (Neom SC) Substitution at 76'"),
  EV(10, "77'", 'Substitution', 'away', 'Faisal Al-Ghamdi', "Faisal Al-Ghamdi (Neom SC) Substitution at 77'"),
  EV(11, "81'", 'Substitution', 'home', 'Awad Aman', "Awad Aman (Al Nassr) Substitution at 81'"),
  EV(12, "90'+1'", 'Substitution', 'home', 'Saad Haqawi', "Saad Haqawi (Al Nassr) Substitution at 90'+1'"),
  EV(13, "90'+1'", 'Substitution', 'home', 'Sami Al-Najei', "Sami Al-Najei (Al Nassr) Substitution at 90'+1'"),
];

const STATS = [
  { name: 'possessionPct', label: 'Possession', home: '58.1', away: '41.9' },
  { name: 'totalShots', label: 'Shots', home: '17', away: '7' },
  { name: 'shotsOnTarget', label: 'On target', home: '2', away: '1' },
  { name: 'wonCorners', label: 'Corners', home: '3', away: '1' },
  { name: 'foulsCommitted', label: 'Fouls', home: '14', away: '18' },
  { name: 'offsides', label: 'Offsides', home: '3', away: '4' },
  { name: 'yellowCards', label: 'Yellow cards', home: '1', away: '4' },
  { name: 'redCards', label: 'Red cards', home: '0', away: '0' },
  { name: 'saves', label: 'Saves', home: '1', away: '1' },
];

const LEADERS = [
  { label: 'Total shots', home: ['Cristiano Ronaldo', '6'], away: ['Said Benrahma', '4'] },
  { label: 'Accurate passes', home: ['Abdullah Al-Khaibari', '66'], away: ['Malang Sarr', '44'] },
  { label: 'Defensive actions', home: ['Abdulelah Al-Amri', '5'], away: ['Nathan Zeze', '5'] },
  { label: 'Saves', home: ['Bento', '1'], away: ['Marcin Bulka', '1'] },
];

const BASE = {
  home: { name: 'Al Nassr', abbreviation: 'NSR', logo: null, score: 1, color: '#ffd400' },
  away: { name: 'Neom SC', abbreviation: 'NEOM', logo: null, score: 0, color: '#00c2a8' },
  venue: 'Al-Awwal Park', city: 'Riyadh', attendance: 8709, broadcasts: ['beIN'], kickoffLabel: 'Tue 19:00',
  stats: STATS, leaders: LEADERS, updatedLabel: '12:47',
};

// the match as it stood at `minute` (flags and score follow the clock)
function at(minute, state) {
  const timeline = TIMELINE.filter((e) => e.min <= minute);
  const goals = (side) => timeline.filter((e) => e.side === side && e.scoring).length;
  const mark = (lu) => ({
    ...lu,
    starters: lu.starters.map((p) => ({ ...p, subbedOut: p.outMin != null && p.outMin <= minute })),
    bench: lu.bench.filter((p) => p.inMin <= minute).map((p) => ({ ...p, subbedIn: true })),
  });
  return {
    ...BASE,
    home: { ...BASE.home, score: goals('home') },
    away: { ...BASE.away, score: goals('away') },
    status: state === 'live'
      ? { state: 'live', detail: `${minute}'`, clockSeconds: minute * 60 }
      : { state: 'finished', detail: 'FT', clockSeconds: null },
    timeline,
    lineups: { home: mark(LINEUPS.home), away: mark(LINEUPS.away) },
  };
}
export const FINISHED = at(99, 'finished');
export const LIVE = at(62, 'live');
export const PRE = {
  ...BASE,
  home: { ...BASE.home, score: null }, away: { ...BASE.away, score: null },
  status: { state: 'scheduled', detail: 'Tue 19:00', clockSeconds: null },
  timeline: [], stats: [], leaders: [], attendance: null,
  lineups: { home: at(0, 'live').lineups.home, away: at(0, 'live').lineups.away },
};


// ---------------------------------------------------------------------------------------------
// Helpers
export const surname = (n) => n.split(' ').slice(-1)[0];
export const numOf = (v) => { const n = parseFloat(String(v ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? n : null; };
export const kindOf = (e) => {
  if (/miss|saved/i.test(e.label)) return 'miss';
  if (e.scoring || /goal/i.test(e.label)) return 'goal';
  if (/yellow/i.test(e.label)) return 'yellow';
  if (/red/i.test(e.label)) return 'red';
  if (/sub/i.test(e.label)) return 'sub';
  return 'other';
};
export const flagsOf = (d, name) => {
  const kinds = d.timeline.filter((e) => e.player === name).map(kindOf);
  return { goals: kinds.filter((k) => k === 'goal').length, yellow: kinds.includes('yellow'), red: kinds.includes('red') };
};


// ---------------------------------------------------------------------------------------------
// Pitch layout: rows from the formation string, left-right from the position code.
const sideScore = (pos = '') => (/(^|-)L$|^(LB|LM|LW)$/.test(pos) ? -1 : /(^|-)R$|^(RB|RM|RW)$/.test(pos) ? 1 : 0);

// The XI as rows, goalkeeper first: [[gk], [defenders...], ..., [forwards...]], each row left to right.
export function rowsOf(lineup) {
  if (!lineup?.formation) return [];
  const parts = lineup.formation.split('-').map(Number);
  const xi = [...lineup.starters].sort((a, b) => Number(a.place) - Number(b.place));
  if (xi.length !== 1 + parts.reduce((a, b) => a + b, 0)) return [];
  const rows = [[xi[0]]];
  let k = 1;
  for (const n of parts) {
    rows.push(xi.slice(k, k + n).sort((a, b) => sideScore(a.position) - sideScore(b.position) || Number(a.place) - Number(b.place)));
    k += n;
  }
  return rows;
}

// Landscape coordinates (0-100 each way), home attacking right: x = along the pitch, y = across.
export function layoutTeam(lineup, side) {
  const rows = rowsOf(lineup);
  const flip = (v) => (side === 'home' ? v : 100 - v);
  return rows.flatMap((row, r) => row.map((p, j) => ({
    p, row: r,
    x: flip(6 + r * (40 / (rows.length - 1))),
    y: r === 0 ? 50 : flip(8 + ((j + 1) / (row.length + 1)) * 84),
  })));
}

// Everyone on one pitch, as left / top percentages. `squeeze` pulls each half towards its own goal
// so the two forward lines don't collide at halfway. `orient`: 'portrait' (home at the bottom,
// attacking up) or 'landscape' (home on the left, attacking right).
export function spots(d, orient = 'portrait', squeeze = 0.93) {
  return ['home', 'away'].flatMap((side) => layoutTeam(d.lineups?.[side], side).map(({ p, row, x, y }) => {
    const along = 6 + ((side === 'home' ? x : 100 - x) - 6) * squeeze; // 6 = own goal line, ~46 = halfway
    const [left, top] = orient === 'portrait' ? [y, side === 'home' ? 100 - along : along] : [side === 'home' ? along : 100 - along, y];
    return { side, p, row, left, top, f: flagsOf(d, p.name) };
  }));
}

// black or white text, whichever reads on a team colour
export const onColor = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.45 ? '#0a0a0a' : '#fff';
};
