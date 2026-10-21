// Events-list adapters for the extra sites. Each one exposes:
//   sports()        -> [{ id, label }]
//   events(sportId) -> [{ id, title, startMs, live }]   (startMs 0 = always on / unknown)
// ids are whatever the site needs later to find the match's streams.
import * as roxieSite from "./extractors/roxie.js";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const fetchJson = async (url, referer) => {
    const res = await fetch(url, { headers: { "User-Agent": UA, ...(referer && { Referer: referer, Origin: referer.replace(/\/$/, "") }) } });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return res.json();
};

const cache = new Map(); // url -> { at, p }: one refresh asks the same listing several times
const getJson = (url, referer) => {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.at < 20000) return hit.p;
    const p = fetchJson(url, referer);
    cache.set(url, { at: Date.now(), p });
    p.catch(() => cache.delete(url));
    return p;
};

// a wall-clock time in a named zone -> epoch ms. `asUtc` is the same digits read as UTC.
function zonedToMs(asUtc, timeZone) {
    const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
        .formatToParts(asUtc).find(p => p.type === "timeZoneName").value; // "GMT-4"
    return asUtc - Number(part.replace("GMT", "")) * 3600000;
}
// timst.top times are US Eastern with no zone marker ("2026-10-17T10:00")
const easternToMs = (str) => zonedToMs(Date.parse(str + "Z"), "America/New_York");
// Roxiestreams times are US Pacific ("October 18, 2026 6:00 AM")
const pacificToMs = (str) => zonedToMs(Date.parse(str + " UTC"), "America/Los_Angeles");

const streamed = {
    sports: async () => (await getJson("https://streamed.pk/api/sports")).map(s => ({ id: s.id, label: s.name })),
    events: async (sport) => {
        const list = await getJson(`https://streamed.pk/api/matches/${encodeURIComponent(sport)}`);
        return list.map(m => ({ id: m.id, title: m.title, startMs: m.date, live: false }));
    },
};

const timst = {
    // the sports are the "genres"; events refer to them by numeric id
    sports: async () => (await getJson("https://timst.top/api/live-upcoming", "https://timst.top/")).genres.map(g => ({ id: String(g.id), label: g.name })),
    events: async (genre) => {
        const { events } = await getJson("https://timst.top/api/live-upcoming", "https://timst.top/");
        return events.filter(e => String(e.genre) === genre).map(e => {
            const [away, home] = e.name.split(" @ "); // "Away @ Home" -> "Home vs Away"
            return { id: e.url, title: home ? `${home} vs ${away}` : e.name, startMs: easternToMs(e.time), live: false };
        });
    },
};

const ppv = {
    sports: async () => (await getJson("https://api.ppv.st/api/streams", "https://ppv.st/")).streams.map(c => ({ id: c.category, label: c.category })),
    events: async (category) => {
        const { streams } = await getJson("https://api.ppv.st/api/streams", "https://ppv.st/");
        const cat = streams.find(c => c.category === category);
        return (cat?.streams || []).map(s => ({
            id: s.uri_name,
            title: s.name.replace(/\s+vs\.\s+/i, " vs "), // ppv writes "vs."
            startMs: s.starts_at * 1000,
            live: !!s.always_live,
        }));
    },
};

// Roxiestreams: its event pages are listed per sport page; the id is the page path
const roxie = {
    sports: async () => ["soccer", "mlb", "nba", "nfl", "nhl", "fighting", "motorsports"].map(id => ({ id, label: id })),
    events: async (sport) => (await roxieSite.listEvents(sport)).map(e => ({
        id: e.link.replace(/^\//, ""),
        title: e.title,
        startMs: pacificToMs(e.startTime) || 0,
        live: false,
    })).filter(e => e.id),
};

const adapters = { streamed, timst, ppv, roxie };

// One sport list across the sites: each site's own sport ids (some sites split a sport in two)
export const SPORTS = {
    football: { label: "Football", streamed: ["football"], timst: ["1"], ppv: ["Football"], roxie: ["soccer"] },
    basketball: { label: "Basketball", streamed: ["basketball"], timst: ["7"], ppv: ["Basketball"], roxie: ["nba"] },
    "american-football": { label: "American Football", streamed: ["american-football"], timst: ["8"], ppv: ["American Football"], roxie: ["nfl"] },
    baseball: { label: "Baseball", streamed: ["baseball"], timst: ["9"], ppv: ["Baseball"], roxie: ["mlb"] },
    hockey: { label: "Hockey", streamed: ["hockey"], timst: ["11"], ppv: ["Ice Hockey"], roxie: ["nhl"] },
    motorsport: { label: "Motorsport", streamed: ["motor-sports"], timst: ["2"], ppv: [], roxie: ["motorsports"] },
    fighting: { label: "Fighting", streamed: ["fight"], timst: ["3", "4", "5", "6"], ppv: ["Combat Sports", "Wrestling"], roxie: ["fighting"] },
    tennis: { label: "Tennis", streamed: ["tennis"], timst: ["10"], ppv: [], roxie: [] },
    rugby: { label: "Rugby", streamed: ["rugby"], timst: ["15", "16"], ppv: ["Rugby"], roxie: [] },
    cricket: { label: "Cricket", streamed: ["cricket"], timst: ["13"], ppv: ["Cricket"], roxie: [] },
    darts: { label: "Darts", streamed: ["darts"], timst: ["12"], ppv: ["Darts"], roxie: [] },
    golf: { label: "Golf", streamed: ["golf"], timst: [], ppv: ["Golf"], roxie: [] },
};

// Events for one unified sport from every site; a site that errors is reported, not fatal.
export async function eventsForSport(sport) {
    const def = SPORTS[sport];
    if (!def) return null;
    const perSite = {};
    const errors = {};
    await Promise.all(Object.keys(adapters).map(async (site) => {
        try {
            perSite[site] = (await Promise.all(def[site].map((id) => adapters[site].events(id)))).flat();
        } catch (e) {
            perSite[site] = [];
            errors[site] = e.message;
        }
    }));
    return { perSite, errors };
}

export default adapters;
