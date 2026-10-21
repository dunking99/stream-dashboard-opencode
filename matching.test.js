// run: node matching.test.js
import assert from 'node:assert/strict';
import { matchEvents } from './matching.js';

const T = Date.parse('2026-10-17T13:00:00Z');
const m = matchEvents({
  streamed: [
    { id: 's1', title: 'Venezia vs Napoli', startMs: T },
    { id: 's2', title: 'Manchester City vs Ipswich Town', startMs: T + 3600e3 },
    { id: 's3', title: 'Chelsea Women vs Arsenal Women', startMs: T },
    { id: 's4', title: 'Espanyol vs Atlético Madrid', startMs: T },
    { id: 's7', title: 'Halmstad vs Hammarby', startMs: T },
  ],
  timst: [
    { id: 't1', title: 'Venezia vs Napoli', startMs: T },
    { id: 't2', title: 'Man City vs Ipswich', startMs: T + 3600e3 },
    { id: 't4', title: 'Espanyol vs Atletico Madrid', startMs: T },
  ],
  ppv: [
    { id: 'p1', title: 'Venezia vs. Napoli', startMs: T },
    { id: 'p2', title: 'Manchester City vs. Ipswich Town', startMs: T + 3600e3 },
    { id: 'p3', title: 'Chelsea vs. Arsenal', startMs: T }, // men's: must NOT join the women's match
    { id: 'p7', title: 'Halmstads BK vs Hammarby IF', startMs: T },
    { id: 'p5', title: '1. FC Union Berlin vs. Borussia Dortmund', startMs: T },
    { id: 'p6', title: 'Venezia vs. Napoli', startMs: T + 5 * 3600e3 }, // same teams, other day-slot: separate
  ],
});
const sites = (title) => m.find((g) => g.title === title)?.sites.map((s) => s.site).sort().join();
assert.equal(sites('Venezia vs Napoli'), 'ppv,streamed,timst');
assert.equal(sites('Manchester City vs Ipswich Town'), 'ppv,streamed,timst'); // "Man City" / "Ipswich" abbreviations
assert.equal(sites('Espanyol vs Atlético Madrid'), 'streamed,timst'); // accents ignored
assert.equal(sites('Halmstad vs Hammarby'), 'ppv,streamed'); // one-letter spelling difference
assert.equal(sites('Chelsea Women vs Arsenal Women'), 'streamed');
assert.equal(sites('Chelsea vs Arsenal'), 'ppv');
assert.equal(m.filter((g) => g.title === 'Venezia vs Napoli').length, 2); // time gap > 90 min splits them
console.log('matching ok');
