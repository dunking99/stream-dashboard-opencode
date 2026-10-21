// Cross-site event matching. Events are { id, title, startMs, live } per site; matched
// events are grouped by "same teams, starting within MAX_GAP_MS of each other".
const MAX_GAP_MS = 90 * 60 * 1000;

const ALIASES = { man: 'manchester', utd: 'united', spurs: 'tottenham', intl: 'international' };
const NOISE = new Set(['fc', 'cf', 'afc', 'sc', 'ac', 'as', 'ssc', 'fk', 'sv', 'the']);
// markers that make a team a *different* team (women's, youth, reserve sides)
const MARKERS = new Set(['w', 'women', 'womens', 'u17', 'u18', 'u19', 'u20', 'u21', 'u23', 'ii', 'b', 'reserves']);
// words too common to count as evidence of the same team on their own
const GENERIC = new Set(['city', 'united', 'town', 'real', 'club', 'county', 'rovers', 'athletic', 'sporting', 'sport', 'international']);

const tokens = (name) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().split(' ')
    .filter(Boolean).map((t) => ALIASES[t] ?? t).filter((t) => !NOISE.has(t) && !/^\d$/.test(t));

// 1 = same team, 0 = different/unsure
function sameTeam(a, b) {
  const [ta, tb] = [tokens(a), tokens(b)];
  if (!ta.length || !tb.length) return 0;
  const [ma, mb] = [ta.filter((t) => MARKERS.has(t)).sort().join(), tb.filter((t) => MARKERS.has(t)).sort().join()];
  if (ma !== mb) return 0;
  const [sa, sb] = [new Set(ta), new Set(tb)];
  const shared = [...sa].filter((t) => sb.has(t));
  if (shared.length === sa.size || shared.length === sb.size) return 1; // equal, or one contains the other
  if (shared.some((t) => t.length >= 4 && !GENERIC.has(t))) return 1;
  // "Halmstads" / "Halmstad": one word is a long prefix of the other
  return ta.some((x) => tb.some((y) => Math.min(x.length, y.length) >= 5 && !GENERIC.has(x) && (x.startsWith(y) || y.startsWith(x)))) ? 1 : 0;
}

// "Home vs Away" / "Home vs. Away" -> ["Home", "Away"]
export const splitTeams = (title) => {
  const parts = title.split(/\s+(?:vs\.?|v)\s+/i);
  return parts.length === 2 ? parts : null;
};
export const cleanTitle = (title) => title.replace(/\s+vs\.\s+/i, ' vs ');

export function sameEvent(a, b) {
  if (a.startMs && b.startMs && Math.abs(a.startMs - b.startMs) > MAX_GAP_MS) return false;
  const [ta, tb] = [splitTeams(a.title), splitTeams(b.title)];
  if (ta && tb) return sameTeam(ta[0], tb[0]) && sameTeam(ta[1], tb[1]);
  return !ta && !tb && tokens(a.title).join(' ') === tokens(b.title).join(' '); // no "vs": exact name only
}

/** perSite: { siteName: [event] } -> [{ title, startMs, live, sites: [{ site, id, title }] }] by start time */
export function matchEvents(perSite) {
  const all = Object.entries(perSite)
    .flatMap(([site, evs]) => evs.map((e) => ({ ...e, site })))
    .sort((a, b) => a.startMs - b.startMs);
  const groups = [];
  for (const ev of all) {
    // join the first group that has no entry from this site yet and matches any member
    const g = groups.find((g) => !g.sites.some((s) => s.site === ev.site) && g.members.some((m) => sameEvent(m, ev)));
    if (g) { g.members.push(ev); g.sites.push({ site: ev.site, id: ev.id, title: ev.title }); }
    else groups.push({ title: cleanTitle(ev.title), startMs: ev.startMs, live: ev.live, members: [ev], sites: [{ site: ev.site, id: ev.id, title: ev.title }] });
  }
  return groups.map(({ members, ...g }) => g);
}
