// Made-up data for the Gallery design. Nothing here is real or fetched.

const rnd = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };

// ---- the rundown (match list). Al Nassr v Neom SC is the one that's fully wired up.
export const MATCHES = [
  { id: 'nassr', home: 'Al Nassr', away: 'Neom SC', hc: '#ffd400', ac: '#00c2a8', league: 'Saudi Pro League', status: 'live', min: 62, hs: 1, as: 0, streams: 4, time: '19:00' },
  { id: 'levante', home: 'Levante', away: 'Athletic Club', hc: '#c8102e', ac: '#d4001a', league: 'La Liga', status: 'live', min: 55, hs: 0, as: 0, streams: 2, time: '19:00' },
  { id: 'como', home: 'Como', away: 'Manchester United', hc: '#1b4f9c', ac: '#da291c', league: 'Champions League', status: 'done', hs: 2, as: 1, streams: 3, time: '17:45' },
  { id: 'lille', home: 'Lille', away: 'Galatasaray', hc: '#c8102e', ac: '#fdb913', league: 'Champions League', status: 'done', hs: 1, as: 1, streams: 3, time: '17:45' },
  { id: 'brugge', home: 'Club Brugge', away: 'Lens', hc: '#0a5eb0', ac: '#f2c200', league: 'Champions League', status: 'next', streams: 4, time: '20:00' },
  { id: 'betis', home: 'Real Betis', away: 'Feyenoord', hc: '#00954c', ac: '#d4001a', league: 'Champions League', status: 'next', streams: 3, time: '20:00' },
  { id: 'madrid', home: 'Real Madrid', away: 'RB Leipzig', hc: '#e8e8e8', ac: '#d6002a', league: 'Champions League', status: 'next', streams: 5, time: '20:00' },
  { id: 'inter', home: 'Inter Milan', away: 'Shakhtar Donetsk', hc: '#0a4aa6', ac: '#f26a1b', league: 'Champions League', status: 'next', streams: 3, time: '20:00' },
  { id: 'sporting', home: 'Sporting CP', away: 'LASK', hc: '#00814a', ac: '#111111', league: 'Champions League', status: 'next', streams: 2, time: '20:00' },
  { id: 'bayern', home: 'Bayern Munich', away: 'Arsenal', hc: '#d6002a', ac: '#e03a3e', league: 'Champions League', status: 'next', streams: 5, time: '20:00' },
  { id: 'villa', home: 'Aston Villa', away: 'Viking', hc: '#7a1f3d', ac: '#c8102e', league: 'Europa League', status: 'next', streams: 2, time: '20:00' },
  { id: 'cincy', home: 'FC Cincinnati', away: 'D.C. United', hc: '#f05323', ac: '#d4001a', league: 'MLS', status: 'next', streams: 2, time: '00:00' },
  { id: 'puebla', home: 'Puebla', away: 'Monterrey', hc: '#1f4aa8', ac: '#1b2a6b', league: 'Liga MX', status: 'next', streams: 1, time: '02:00' },
];
export const FAVS0 = ['como', 'bayern'];

// ---- the sources for the selected match. `delay` is seconds behind the live data feed.
export const SOURCES0 = [
  { id: 1, name: 'Sky Sports Main Event', tag: 'English · HD', res: '1080p', mbps: 4.2, delay: 110, buffer: 12, dropped: 0, state: 'ok', lat: [1.8, 2.1, 1.9, 2.4, 2.0, 1.9, 2.2, 2.6, 2.1, 1.9, 2.0, 2.3, 2.1, 1.8, 2.0, 2.2, 2.4, 2.1, 1.9, 2.0] },
  { id: 2, name: 'beIN Sports 2', tag: 'Arabic · HD', res: '720p', mbps: 2.8, delay: 140, buffer: 9, dropped: 3, state: 'ok', lat: [2.4, 2.9, 3.4, 3.1, 4.0, 3.6, 3.2, 3.9, 4.4, 4.1, 3.7, 3.3, 3.8, 4.2, 4.6, 4.1, 3.9, 4.3, 4.0, 4.4] },
  { id: 3, name: 'SSC Sports 1', tag: 'Arabic · HD', res: '1080p', mbps: 5.0, delay: 102, buffer: 14, dropped: 0, state: 'ok', lat: [1.5, 1.6, 1.4, 1.7, 1.5, 1.6, 1.5, 1.4, 1.6, 1.8, 1.5, 1.6, 1.4, 1.5, 1.7, 1.6, 1.5, 1.4, 1.6, 1.5] },
  { id: 4, name: 'Streamed · English', tag: 'English · SD', res: '—', mbps: 0, delay: null, buffer: 0, dropped: 0, state: 'dead', downFor: 42, lat: [2.2, 2.4, 2.9, 3.8, 5.2, 7.9, 12, 20, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1] },
];

// ---- clocks, in seconds of match time
export const DATA_SEC0 = 62 * 60 + 10; // the live data feed says 62:10 when the page opens
export const DVR_SEC = 180; // the stream keeps about three minutes you can seek back into
export const GOAL_SEC = 61 * 60;

// ---- momentum: -1 (Neom on top) .. +1 (Al Nassr on top), one value per minute
export const momentum = (upTo) => Array.from({ length: upTo }, (_, i) => {
  const m = i + 1;
  let v = 0.22 + 0.45 * Math.sin(m / 6) + 0.2 * Math.cos(m / 3.1) + (rnd(m) - 0.5) * 0.35;
  if (m > 55 && m < 62) v += 0.35;
  if (m > 20 && m < 28) v -= 0.55;
  if (m >= 40 && m <= 46) v += 0.4;
  if (m > 66) v -= 0.3;
  if (m > 80) v -= 0.25;
  return Math.max(-1, Math.min(1, v));
});

// ---- the table
export const TABLE = [
  { pos: 1, team: 'Al Hilal', p: 11, gd: '+19', pts: 28 },
  { pos: 2, team: 'Al Nassr', p: 11, gd: '+17', pts: 25, me: 'home' },
  { pos: 3, team: 'Al Ahli', p: 11, gd: '+10', pts: 22 },
  { pos: 4, team: 'Al Ittihad', p: 11, gd: '+6', pts: 20 },
  { pos: 5, team: 'Al Shabab', p: 11, gd: '+2', pts: 17 },
  { pos: 6, team: 'Al Taawoun', p: 11, gd: '+1', pts: 16 },
  { pos: 7, team: 'Al Fateh', p: 11, gd: '−1', pts: 14 },
  { pos: 8, team: 'Al Ettifaq', p: 11, gd: '−3', pts: 13 },
  { pos: 9, team: 'Neom SC', p: 11, gd: '−4', pts: 12, me: 'away' },
  { pos: 10, team: 'Al Fayha', p: 11, gd: '−6', pts: 10 },
];

export const TEAMS = {
  home: { form: ['W', 'W', 'D', 'W', 'W'], manager: 'Stefano Pioli', topScorer: 'Cristiano Ronaldo, 11 goals', out: ['Kingsley Coman (knee)', 'Ali Al-Hassan (suspended)'] },
  away: { form: ['L', 'D', 'L', 'W', 'D'], manager: 'Fernando Hierro', topScorer: 'Said Benrahma, 4 goals', out: ['Faisal Al-Ghamdi (doubtful)'] },
};
export const H2H = {
  record: { home: 3, draw: 1, away: 1 },
  games: [
    { date: 'Mar 2026', comp: 'Pro League', h: 'Neom SC', a: 'Al Nassr', hs: 0, as: 2 },
    { date: 'Oct 2025', comp: 'Pro League', h: 'Al Nassr', a: 'Neom SC', hs: 3, as: 1 },
    { date: 'Feb 2025', comp: 'Pro League', h: 'Al Nassr', a: 'Neom SC', hs: 1, as: 1 },
    { date: 'Sep 2024', comp: 'King’s Cup', h: 'Neom SC', a: 'Al Nassr', hs: 2, as: 1 },
    { date: 'Apr 2024', comp: 'Pro League', h: 'Al Nassr', a: 'Neom SC', hs: 4, as: 0 },
  ],
};

// ---- shots with expected goals (x, y in pitch metres; Al Nassr attack to the right)
export const SHOTS = (() => {
  const out = [];
  for (let i = 0; i < 17; i++) {
    const goal = i === 5;
    out.push({ side: 'home', min: 3 + Math.round(rnd(i + 1) * 58), x: goal ? 94.2 : 76 + rnd(i + 3) * 20, y: 22 + rnd(i + 7) * 24, xg: goal ? 0.31 : 0.03 + rnd(i + 11) * 0.22, res: goal ? 'goal' : ['saved', 'off', 'blocked', 'off'][i % 4], who: goal ? 'João Félix' : ['Cristiano Ronaldo', 'Cristiano Ronaldo', 'Ângelo Gabriel', 'Sadio Mané', 'João Félix'][i % 5] });
  }
  out.push({ side: 'home', min: 51, x: 94, y: 34, xg: 0.79, res: 'miss', who: 'Cristiano Ronaldo' });
  for (let i = 0; i < 7; i++) out.push({ side: 'away', min: 8 + Math.round(rnd(i + 20) * 52), x: 105 - (78 + rnd(i + 23) * 18), y: 20 + rnd(i + 27) * 28, xg: 0.02 + rnd(i + 31) * 0.14, res: ['saved', 'off', 'blocked'][i % 3], who: ['Said Benrahma', 'Alexandre Lacazette', 'Said Benrahma'][i % 3] });
  return out.sort((a, b) => a.min - b.min);
})();

export const PLAYERS = [
  { name: 'João Félix', side: 'home', rating: 8.1, line: '1 goal · 2 shots · 91% passes', xg: 0.62 },
  { name: 'Cristiano Ronaldo', side: 'home', rating: 7.4, line: '6 shots · penalty missed · 3 key passes', xg: 2.0 },
  { name: 'Abdullah Al-Khaibari', side: 'home', rating: 7.2, line: '66 accurate passes · 4 tackles', xg: 0.0 },
  { name: 'Bento', side: 'home', rating: 6.9, line: '1 save · 0 errors', xg: 0.0 },
  { name: 'Said Benrahma', side: 'away', rating: 6.9, line: '4 shots · 2 key passes', xg: 0.4 },
  { name: 'Malang Sarr', side: 'away', rating: 6.8, line: '44 accurate passes · 5 clearances', xg: 0.0 },
  { name: 'Alexandre Lacazette', side: 'away', rating: 6.6, line: '2 shots · 1 chance created', xg: 0.2 },
  { name: 'Marcin Bulka', side: 'away', rating: 6.4, line: '1 save · conceded 1', xg: 0.0 },
];

// text that isn't a "key event", for the commentary view
export const CHATTER = [
  { min: 62, text: 'Neom win a corner after a deflection off Al-Amri.' },
  { min: 58, text: 'Al Nassr keep the ball for 90 seconds in the Neom half.' },
  { min: 52, text: 'Play restarts after the missed penalty; Benrahma pushes the Neom line up.' },
  { min: 47, text: 'Second half under way.' },
  { min: 45, text: 'Half-time. Al Nassr 0, Neom SC 0.' },
  { min: 33, text: 'Lacazette drops deep to collect and Neom briefly find some rhythm.' },
  { min: 12, text: 'Al Khaibari hits a long diagonal for Ronaldo, who just fails to reach it.' },
  { min: 1, text: 'Kick-off.' },
];
