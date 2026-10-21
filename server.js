import express from 'express';
import cors from 'cors';
import sites, { SPORTS, eventsForSport } from './sites.js';
import { matchEvents } from './matching.js';
import { espnEvents, findLeague } from './espn.js';
import { espnDetail } from './providers/espnDetail.js';
import * as roxie from './extractors/roxie.js';
import * as timst from './extractors/timst.js';
import * as streamed from './extractors/streamed.js';
import * as manual from './extractors/manual.js';
import { rewriteManifest, stripDisguise } from './extractors/hls.js';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());

// Each stream belongs to a site; the site's extractor knows where its manifest is and how to
// reach it. Streams without a `site` are Roxiestreams.
const extractors = { roxie, timst, streamed, manual };
const extFor = (stream) => extractors[stream.site || 'roxie'];

// Default to Liverpool vs Man City (which we know has 2 streams)
let activeEvent = {
    name: "Liverpool vs Man City",
    eventPath: "soccer-streams-8",
    streams: [
        { id: 0, name: "Stream 1", filename: "forest.m3u8", subdomain: "admin2" },
        { id: 1, name: "Stream 2", filename: "wnba.m3u8", subdomain: "admin2" }
    ],
    activeIndex: 0
};

// { url, headers } for a stream's manifest
async function streamInfo(stream) {
    const info = await extFor(stream).resolve(stream);
    if (stream.site && stream.site !== 'roxie') stream.manifestUrl = info.url; // generic segment rewriting needs it
    return info;
}

// Manifest -> { sequence, duration, time }, or null if the stream is dead.
// `force`: resolve it even if that's costly (the active stream); otherwise streams an extractor
// hasn't resolved yet are skipped (undefined = not checked).
async function fetchStats(stream, force) {
    try {
        const ext = extFor(stream);
        if (!force && ext.isResolved && !ext.isResolved(stream)) return undefined;
        const info = await streamInfo(stream);
        const response = await (extFor(stream).fetch || fetch)(info.url, { headers: info.headers });
        if (!response.ok) return null;
        const text = await response.text();
        const seqMatch = text.match(/#EXT-X-MEDIA-SEQUENCE:(\d+)/);
        const sequence = seqMatch ? parseInt(seqMatch[1]) : 0;
        const durMatch = text.match(/#EXTINF:([\d.]+)/);
        const duration = durMatch ? parseFloat(durMatch[1]) : 4.004;
        const totalSeconds = sequence * duration;
        const hms = [Math.floor(totalSeconds / 3600), Math.floor((totalSeconds % 3600) / 60), Math.floor(totalSeconds % 60)];
        return { sequence, duration, time: hms.map(n => String(n).padStart(2, '0')).join(':') };
    } catch {
        return null;
    }
}

// The dashboard polls every few seconds, but the sites only get asked at these paces: the stream
// being watched every 10s, the others at most once every 10 minutes (so nothing hammers a site
// that bans heavy traffic). The player itself fetches the watched manifest on top of this.
const ACTIVE_STATS_MS = 10 * 1000;
const INACTIVE_STATS_MS = 10 * 60 * 1000;
const statsCache = new Map(); // "<event>:<index>" -> { at, value }
async function statsFor(stream, i) {
    const active = i === activeEvent.activeIndex;
    const key = `${activeEvent.eventPath}:${i}${active ? ':active' : ''}`; // separate, so a stream that becomes active isn't served its old background reading
    const hit = statsCache.get(key);
    if (hit && Date.now() - hit.at < (active ? ACTIVE_STATS_MS : INACTIVE_STATS_MS)) return hit.value;
    const value = await fetchStats(stream, active);
    if (value !== undefined) statsCache.set(key, { at: Date.now(), value });
    return value;
}

app.get('/api/streams', async (req, res) => {
    const all = await Promise.all(activeEvent.streams.map((st, i) => statsFor(st, i)));
    // the client only needs name/id/filename etc. -- not our internals (embed pages, allowed-segment sets)
    const streams = activeEvent.streams.map(({ allowed, headers, manifestUrl, embedUrl, ...st }, i) => ({ ...st, stats: all[i] }));
    const active = all[activeEvent.activeIndex];
    const base = {
        eventName: activeEvent.name,
        eventPath: activeEvent.eventPath,
        sport: activeEvent.sport || null,
        espnId: activeEvent.espnId || null,
        espnPath: activeEvent.espnPath || null,
        streams,
        activeIndex: activeEvent.activeIndex,
    };

    // If the active stream is dead, return an error status but DON'T crash the server
    if (!active) {
        return res.json({ ...base, stats: { sequence: 0, duration: 0, time: "--:--:--", latency: 0, buffer: 0 }, error: "Stream offline or expired" });
    }
    res.json({ ...base, stats: { ...active, latency: 2.1, buffer: 80 } });
});

app.get('/api/select-event', async (req, res) => {
    try {
        const eventPath = req.query.path;
        if (!eventPath) return res.status(400).json({ error: "Missing path" });

        activeEvent = await roxie.selectEvent(eventPath, req.query.title);
        console.log(`[SELECT] ${eventPath} -> found ${activeEvent.streams.length} streams`);

        res.json({ success: true, activeEvent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// The streams (options) one site has for an event, without switching the player to it
app.get('/api/event-streams', async (req, res) => {
    try {
        const ext = extractors[req.query.site];
        if (!ext?.selectEvent || !req.query.id) return res.status(400).json({ error: "Unknown site or missing id" });
        const event = await ext.selectEvent(String(req.query.id), req.query.title && String(req.query.title));
        res.json({ streams: event.streams.map(({ id, name }) => ({ id, name })) });
    } catch (error) {
        res.status(502).json({ error: error.message });
    }
});

// Play an event from any site's list (optionally starting on stream `index`)
app.get('/api/select-site-event', async (req, res) => {
    try {
        const ext = extractors[req.query.site];
        if (!ext?.selectEvent) return res.status(400).json({ error: "No extractor for that site yet" });
        if (!req.query.id) return res.status(400).json({ error: "Missing id" });

        activeEvent = await ext.selectEvent(String(req.query.id), req.query.title);
        const index = parseInt(req.query.index);
        if (index >= 0 && index < activeEvent.streams.length) activeEvent.activeIndex = index;

        const sport = req.query.sport ? String(req.query.sport) : '';
        const startMs = Number(req.query.startMs) || 0;
        if (sport) {
            try {
                const hit = findLeague({ title: String(req.query.title || activeEvent.name), startMs }, await espnEvents(sport));
                if (hit?.id) {
                    activeEvent.sport = sport;
                    activeEvent.espnId = hit.id;
                    activeEvent.espnPath = hit.summaryPath || null;
                }
            } catch (e) {
                console.log(`[ESPN] no detail match for ${req.query.title || activeEvent.name}: ${e.message}`);
            }
        }

        console.log(`[SELECT] ${req.query.site}:${req.query.id} -> found ${activeEvent.streams.length} streams`);

        res.json({ success: true, activeEvent: { ...activeEvent, streams: activeEvent.streams.map(({ embedUrl, ...s }) => s) } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Play an .m3u8 address you captured yourself: /api/manual-stream?url=<m3u8>&referer=<embed page>&title=<name>
app.get('/api/manual-stream', (req, res) => {
    try {
        activeEvent = manual.selectEvent(String(req.query.url || ''), req.query.referer && String(req.query.referer), req.query.title && String(req.query.title));
        console.log(`[SELECT] manual stream -> ${activeEvent.name}`);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/switch-stream', (req, res) => {
    const index = parseInt(req.query.index);
    if (!isNaN(index) && index >= 0 && index < activeEvent.streams.length) {
        activeEvent.activeIndex = index;
        console.log(`[SWITCH] Now using ${activeEvent.streams[index].name}`);
        res.json({ success: true, activeIndex: index });
    } else {
        res.status(400).json({ error: "Invalid index" });
    }
});

app.get('/api/events/:sport', async (req, res) => {
    try {
        const events = await roxie.listEvents(req.params.sport);
        res.json({ sport: req.params.sport, count: events.length, events });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch events" });
    }
});

// Events lists for the extra sites (see sites.js)
app.get('/api/site/:site/sports', async (req, res) => {
    const adapter = sites[req.params.site];
    if (!adapter) return res.status(404).json({ error: "Unknown site" });
    try { res.json({ sports: await adapter.sports() }); }
    catch (error) { res.status(502).json({ error: error.message }); }
});

app.get('/api/site/:site/events', async (req, res) => {
    const adapter = sites[req.params.site];
    if (!adapter) return res.status(404).json({ error: "Unknown site" });
    try {
        const events = (await adapter.events(String(req.query.sport || ''))).sort((a, b) => a.startMs - b.startMs);
        res.json({ count: events.length, events });
    } catch (error) { res.status(502).json({ error: error.message }); }
});

// One events list across all the extra sites: the same match on several sites is grouped
app.get('/api/matched-sports', (req, res) => {
    res.json({ sports: Object.entries(SPORTS).map(([id, s]) => ({ id, label: s.label })) });
});

app.get('/api/matched-events', async (req, res) => {
    const found = await eventsForSport(String(req.query.sport || 'football'));
    if (!found) return res.status(404).json({ error: "Unknown sport" });
    const events = matchEvents(found.perSite);
    res.json({ count: events.length, events, errors: found.errors });
});

// Same list, with each event's league (and country) looked up from ESPN's schedules. The plain
// /api/matched-events above is left alone as the fallback.
app.get('/api/matched-events-espn', async (req, res) => {
    const sport = String(req.query.sport || 'football');
    const found = await eventsForSport(sport);
    if (!found) return res.status(404).json({ error: "Unknown sport" });
    const events = matchEvents(found.perSite);
    const errors = { ...found.errors };
    try {
        const espn = await espnEvents(sport);
        for (const ev of events) {
            const hit = findLeague(ev, espn);
            ev.espnId = hit?.id || null;
            ev.espnPath = hit?.summaryPath || null;
            ev.league = hit?.league || null;
            ev.country = hit?.country || null;
            ev.leagueLogo = hit?.leagueLogo || null;
            ev.teams = hit?.teams || null; // [{ name, logo }, { name, logo }] in the title's order
        }
    } catch (e) {
        errors.espn = e.message;
    }
    res.json({ count: events.length, events, errors });
});

app.get('/api/event-detail', async (req, res) => {
    const id = String(req.query.id || '');
    const path = String(req.query.path || '');
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id) || !/^[a-z][a-z0-9-]*\/[a-z0-9][a-z0-9.-]*$/i.test(path)) {
        return res.status(400).json({ error: "Missing or invalid id/path" });
    }
    try {
        res.json(await espnDetail(id, path));
    } catch (error) {
        res.status(502).json({ error: error.message });
    }
});

// Any stream can be proxied by index, so hidden probe players can read the non-active ones
app.get('/proxy/:i/manifest.m3u8', async (req, res) => {
    try {
        const stream = activeEvent.streams[req.params.i];
        if (!stream) return res.status(404).send("No such stream");
        const ext = extFor(stream);

        let info = await streamInfo(stream);
        const doFetch = ext.fetch || fetch;
        let response = await doFetch(info.url, { headers: info.headers });
        if (!response.ok && ext.invalidate) { // an extracted address may have expired: get a fresh one, once
            ext.invalidate(stream);
            info = await streamInfo(stream);
            response = await doFetch(info.url, { headers: info.headers });
        }
        if (!response.ok) return res.status(404).send("Manifest not found");

        let text = await response.text();
        text = stream.manifestUrl ? rewriteManifest(text, stream, req.params.i) : ext.rewrite(text, req.params.i);
        res.set('Content-Type', 'application/vnd.apple.mpegurl');
        res.set('Cache-Control', 'no-cache');
        res.send(text);
    } catch (error) {
        res.status(500).send("Error");
    }
});

// Roxiestreams segments: bare filenames on the manifest's own host
app.get('/proxy/:i/segment/:name', async (req, res) => {
    try {
        const stream = activeEvent.streams[req.params.i];
        if (!stream) return res.status(404).send("No such stream");
        const url = `${roxie.baseUrl(stream)}/${req.params.name}`;
        const response = await roxie.fetch(url, { headers: roxie.headers });
        if (!response.ok) return res.status(response.status).send("Segment fetch failed");
        const buffer = Buffer.from(await response.arrayBuffer());
        res.set('Content-Type', 'video/mp2t');
        res.send(buffer);
    } catch (error) {
        res.status(500).send("Error");
    }
});

// Segments of the other sites: full URLs, possibly on another host and disguised as images
app.get('/proxy/:i/seg/:enc', async (req, res) => {
    try {
        const stream = activeEvent.streams[req.params.i];
        const url = Buffer.from(req.params.enc, 'base64url').toString();
        if (!stream?.allowed?.has(url)) return res.status(404).send("Unknown segment");
        // the site's headers only go to the manifest's own host, not to third-party CDNs
        const info = await streamInfo(stream);
        const sameHost = new URL(url).host === new URL(stream.manifestUrl).host;
        const doFetch = sameHost ? extFor(stream).fetch || fetch : fetch;
        const response = await doFetch(url, { headers: sameHost ? info.headers : { "User-Agent": info.headers["User-Agent"] } });
        if (!response.ok) return res.status(response.status).send("Segment fetch failed");
        res.set('Content-Type', 'video/mp2t');
        res.send(stripDisguise(Buffer.from(await response.arrayBuffer())));
    } catch (error) {
        res.status(500).send("Error");
    }
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
