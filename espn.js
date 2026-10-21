// League info for the events list, from ESPN's public schedule feeds (unofficial: they can change or
// vanish, so callers must cope with a failure). Each unified sport maps to feeds that give
// { title: "Home vs Away", startMs, league, leagueLogo, teams }; a merged event then borrows the league of the ESPN
// event it matches (same teams, kickoff within 90 minutes).
import { sameEvent, splitTeams } from './matching.js';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";
const CACHE_MS = 15 * 60 * 1000;

// header = the all-leagues feed for a sport (one request per day); board = one league's scoreboard;
// soccer = every league's matches (see fromSoccer)
const SOURCES = {
    football: [{ soccer: true }],
    basketball: [{ board: 'basketball/nba' }, { board: 'basketball/wnba' }, { board: 'basketball/mens-college-basketball' }],
    "american-football": [{ board: 'football/nfl' }, { board: 'football/college-football' }],
    baseball: [{ board: 'baseball/mlb' }],
    hockey: [{ board: 'hockey/nhl' }],
    motorsport: [{ board: 'racing/f1' }, { board: 'racing/nascar-premier' }, { board: 'racing/irl' }],
    fighting: [{ board: 'mma/ufc' }],
    tennis: [{ header: 'tennis' }],
    rugby: [{ header: 'rugby' }],
    cricket: [{ header: 'cricket' }],
    golf: [{ board: 'golf/pga' }],
    darts: [],
};

// "English Premier League" -> England. Only for leagues named after their country.
const DEMONYMS = {
    English: 'England', Spanish: 'Spain', Italian: 'Italy', German: 'Germany', French: 'France', Scottish: 'Scotland',
    Dutch: 'Netherlands', Portuguese: 'Portugal', Turkish: 'Turkey', Russian: 'Russia', Saudi: 'Saudi Arabia',
    Chinese: 'China', Mexican: 'Mexico', Brazilian: 'Brazil', Argentine: 'Argentina', Belgian: 'Belgium',
    Swedish: 'Sweden', Norwegian: 'Norway', Danish: 'Denmark', Australian: 'Australia', Japanese: 'Japan',
    Greek: 'Greece', Swiss: 'Switzerland', Austrian: 'Austria', Welsh: 'Wales', Irish: 'Ireland',
};
const countryOf = (league) => DEMONYMS[league.split(' ')[0]] || null;

const getJson = async (url) => {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return res.json();
};

const yyyymmdd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
const days = () => [-1, 0, 1].map((n) => yyyymmdd(new Date(Date.now() + n * 86400000)));

const nameOf = (c) => c.team?.displayName || c.athlete?.displayName || c.displayName || c.name;
const logoOf = (c) => c.team?.logo || c.athlete?.flag?.href || c.logo || null;
// two sides with home/away -> { title: "Home vs Away", teams: [home, away] }; anything else (races,
// tournaments) keeps the event's own name and has no teams
function shape(name, competitors = []) {
    const home = competitors.find((c) => c.homeAway === 'home');
    const away = competitors.find((c) => c.homeAway === 'away');
    if (!(home && away && competitors.length === 2)) return { title: name, teams: null };
    return { title: `${nameOf(home)} vs ${nameOf(away)}`, teams: [home, away].map((c) => ({ name: nameOf(c), logo: logoOf(c) })) };
}
// ESPN lists a dark-background variant of league logos: use it when there is one
const pickLogo = (logos = []) => (logos.find((l) => /500-dark/.test(l.href)) || logos[0])?.href || null;

async function fromHeader(sport, day) {
    const j = await getJson(`https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=${sport}&dates=${day}`);
    return (j.sports?.[0]?.leagues || []).flatMap((lg) => (lg.events || []).map((e) => ({
        ...shape(e.name, e.competitors), id: e.id, summaryPath: `${sport}/${lg.slug}`,
        startMs: Date.parse(e.date), league: lg.name, leagueLogo: null,
    })));
}

async function fromBoard(path, day) {
    const j = await getJson(`https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard?dates=${day}&limit=300`);
    const league = j.leagues?.[0]?.name;
    const leagueLogo = pickLogo(j.leagues?.[0]?.logos);
    return (j.events || []).map((e) => ({
        ...shape(e.name, e.competitions?.[0]?.competitors), id: e.id, summaryPath: path,
        startMs: Date.parse(e.date), league, leagueLogo,
    }));
}

// Soccer: the all-leagues scoreboard has every match but names few leagues, so each league id gets its
// name from the best source available: the header feed's list, ESPN's own league lookup (by the code
// in a match link), or the season's name ("2026-allsvenskan" -> "Allsvenskan").
const GENERIC_SEASON = /^(regular-season|group-stage|league-phase|knockout.*|playoffs?|\d+(st|nd|rd|th)-round|torneo-.*|apertura.*|clausura.*|.*-stage)$/;
const leagueIdOf = (e) => e.uid?.match(/l:(\d+)/)?.[1];
const leagueCode = (e) => (e.links || []).map((l) => l.href.match(/league\/([a-z0-9.]+)/)?.[1]).find(Boolean);
const seasonName = (e) => {
    const slug = (e.season?.slug || '').replace(/^\d{4}(-\d{2})?-/, '');
    return slug && !GENERIC_SEASON.test(slug) ? slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') : null;
};

const codeInfos = new Map(); // league code ("swe.1") -> { name, logo }, kept for the life of the server
function infoForCode(code) {
    if (!codeInfos.has(code)) codeInfos.set(code, getJson(`https://sports.core.api.espn.com/v2/sports/soccer/leagues/${code}`).then((l) => ({ name: l.name, logo: pickLogo(l.logos) }), () => ({})));
    return codeInfos.get(code);
}

async function fromSoccer(day) {
    const [board, header] = await Promise.all([
        getJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${day}&limit=500`),
        getJson(`https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=soccer&dates=${day}`).catch(() => ({})),
    ]);
    const names = new Map((header.sports?.[0]?.leagues || []).map((l) => [leagueIdOf(l), { name: l.name, code: l.slug }]));
    const byLeague = new Map(); // id -> [event]
    for (const e of board.events || []) byLeague.set(leagueIdOf(e), [...(byLeague.get(leagueIdOf(e)) || []), e]);

    const out = [];
    for (const [id, evs] of byLeague) {
        const known = names.get(id);
        const code = known?.code || evs.map(leagueCode).find(Boolean);
        const info = code ? await infoForCode(code) : {};
        const league = known?.name || info.name || evs.map(seasonName).find(Boolean) || null;
        const countries = new Set(evs.map((e) => e.competitions?.[0]?.venue?.address?.country).filter(Boolean));
        for (const e of evs) out.push({
            ...shape(e.name, e.competitions?.[0]?.competitors), id: e.id, summaryPath: 'soccer/all',
            startMs: Date.parse(e.date), league, leagueLogo: info.logo || null,
            country: countries.size === 1 ? [...countries][0] : null, // only when every venue of the league agrees
        });
    }
    return out;
}

const cache = new Map(); // sport -> { at, p }
export function espnEvents(sport) {
    const hit = cache.get(sport);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.p;
    const p = Promise.all((SOURCES[sport] || []).flatMap((src) => days().map((d) =>
        src.soccer ? fromSoccer(d) : src.header ? fromHeader(src.header, d) : fromBoard(src.board, d).catch(() => []) // a league with no feed today isn't an error
    ))).then((lists) => lists.flat().map((e) => ({ ...e, country: countryOf(e.league || '') || e.country || null })));
    cache.set(sport, { at: Date.now(), p });
    p.catch(() => cache.delete(sport));
    return p;
}

// the site lists don't always agree on which team is "home", so try both orders.
// -> { league, country, leagueLogo, teams: [{ name, logo }, { name, logo }] | null } with the teams in
// the same order as the event's own title
const flip = (title) => { const t = splitTeams(title); return t ? `${t[1]} vs ${t[0]}` : title; };
export function findLeague(event, espn) {
    for (const e of espn) {
        if (sameEvent(event, e)) return { ...e };
        if (sameEvent(event, { ...e, title: flip(e.title) })) return { ...e, teams: e.teams && [...e.teams].reverse() };
    }
    return null;
}
