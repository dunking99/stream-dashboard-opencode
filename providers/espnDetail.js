import { UA } from '../extractors/hls.js';

const TTL = { scheduled: 2 * 60 * 1000, live: 20 * 1000, finished: 10 * 60 * 1000, unknown: 60 * 1000 };
const cache = new Map();

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

function clockOf(status) {
    if (typeof status?.clock === 'number') return status.clock;
    const m = String(status?.displayClock || '').match(/^(\d+)(?:\+(\d+))?/);
    return m ? Number(m[1]) * 60 + Number(m[2] || 0) : null;
}

function statusOf(status) {
    const state = { pre: 'scheduled', in: 'live', post: 'finished' }[status?.type?.state] || 'unknown';
    return {
        state,
        description: status?.type?.description || '',
        detail: status?.type?.shortDetail || status?.type?.detail || status?.type?.description || '',
        period: status?.period ?? null,
        displayPeriod: status?.displayPeriod || null,
        clock: status?.displayClock || null,
        clockSeconds: clockOf(status),
        completed: !!status?.type?.completed,
    };
}

function teamOf(c) {
    const team = c?.team || {};
    return {
        id: team.id ?? null,
        name: team.displayName || team.name || '',
        short: team.shortDisplayName || team.abbreviation || '',
        abbreviation: team.abbreviation || '',
        logo: team.logo || team.logos?.[0]?.href || null,
        score: num(c?.score),
        winner: !!c?.winner,
        record: c?.record?.[0]?.summary || null,
    };
}

function playerOf(p) {
    return {
        id: p.athlete?.id ?? null,
        name: p.athlete?.displayName || p.athlete?.fullName || '',
        jersey: p.jersey || null,
        position: p.position?.abbreviation || p.athlete?.position?.abbreviation || null,
        starter: !!p.starter,
        subbedIn: !!p.subbedIn,
        subbedOut: !!p.subbedOut,
        place: p.formationPlace && p.formationPlace !== '0' ? p.formationPlace : null,
    };
}

function lineupsOf(rosters) {
    if (!rosters?.length) return null;
    const out = {};
    for (const r of rosters) {
        if (!r?.roster?.length) continue;
        const players = r.roster.map(playerOf);
        out[r.homeAway === 'home' ? 'home' : 'away'] = {
            formation: r.formation || null,
            starters: players.filter((p) => p.starter),
            bench: players.filter((p) => !p.starter),
        };
    }
    return out.home || out.away ? out : null;
}

function statsOf(boxscore) {
    const teams = boxscore?.teams || [];
    const home = teams.find((t) => t.homeAway === 'home');
    const away = teams.find((t) => t.homeAway === 'away');
    if (!home?.statistics?.length || !away?.statistics?.length) return [];
    const awayStats = new Map(away.statistics.map((s) => [s.name, s]));
    return home.statistics.map((s) => {
        const other = awayStats.get(s.name);
        return {
            name: s.name,
            label: s.label || s.displayName || s.name,
            home: s.displayValue ?? s.value ?? null,
            away: other ? other.displayValue ?? other.value ?? null : null,
        };
    });
}

function timelineOf(j, homeId, awayId) {
    const events = j.keyEvents || j.plays || j.scoringPlays || [];
    return events.map((e, i) => {
        const teamId = e.team?.id;
        return {
            id: e.id ?? String(i),
            type: e.type?.type || e.type?.text || 'event',
            label: e.type?.text || e.type?.type || 'Event',
            text: e.text || e.shortText || '',
            short: e.shortText || '',
            period: e.period?.number ?? null,
            clock: e.clock?.displayValue || '',
            clockSeconds: typeof e.clock?.value === 'number' ? e.clock.value : null,
            side: teamId && teamId === homeId ? 'home' : teamId && teamId === awayId ? 'away' : null,
            team: e.team?.displayName || null,
            player: e.participants?.[0]?.athlete?.displayName || null,
            scoring: !!e.scoringPlay,
            wallclock: e.wallclock || null,
        };
    });
}

function commentaryOf(j) {
    return (j.commentary || []).slice(-200).map((c, i) => ({
        id: c.sequence ?? i,
        text: c.text || '',
        clock: c.time?.displayValue || '',
        clockSeconds: typeof c.time?.value === 'number' ? c.time.value : null,
    }));
}

function leadersOf(j) {
    return (j.leaders || []).map((l) => ({
        team: l.team?.displayName || '',
        categories: (l.leaders || []).map((cat) => ({
            name: cat.name,
            label: cat.displayName || cat.name,
            players: (cat.leaders || []).map((p) => ({
                name: p.athlete?.displayName || '',
                value: p.displayValue || '',
            })),
        })),
    }));
}

function broadcastsOf(comp) {
    return [...new Set((comp?.broadcasts || []).map((b) => b.media?.shortName || b.names?.join?.(', ')).filter(Boolean))];
}

function normalize(j, id, path) {
    const comp = j.header?.competitions?.[0] || {};
    const competitors = comp.competitors || [];
    const homeComp = competitors.find((c) => c.homeAway === 'home') || competitors[0];
    const awayComp = competitors.find((c) => c.homeAway === 'away') || competitors[1];
    return {
        id: comp.id || id,
        path,
        status: statusOf(comp.status),
        kickoffMs: comp.date ? Date.parse(comp.date) : null,
        home: teamOf(homeComp),
        away: teamOf(awayComp),
        lineups: lineupsOf(j.rosters),
        stats: statsOf(j.boxscore),
        timeline: timelineOf(j, homeComp?.team?.id, awayComp?.team?.id),
        commentary: commentaryOf(j),
        leaders: leadersOf(j),
        venue: j.gameInfo?.venue?.fullName || null,
        city: j.gameInfo?.venue?.address?.city || null,
        attendance: j.gameInfo?.attendance ?? null,
        broadcasts: broadcastsOf(comp),
        updatedAt: Date.now(),
    };
}

export async function espnDetail(id, path) {
    const key = `${path}:${id}`;
    const hit = cache.get(key);
    if (hit && Date.now() < hit.expires) return hit.p;

    const entry = { expires: Date.now() + 30000, p: null };
    entry.p = fetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/summary?event=${encodeURIComponent(id)}`, {
        headers: { "User-Agent": UA },
    }).then((res) => {
        if (!res.ok) throw new Error(`ESPN summary -> ${res.status}`);
        return res.json();
    }).then((j) => {
        const detail = normalize(j, id, path);
        entry.expires = Date.now() + (TTL[detail.status.state] ?? TTL.unknown);
        return detail;
    });
    entry.p.catch(() => cache.delete(key));
    cache.set(key, entry);
    return entry.p;
}
