// Roxiestreams: the event page lists getRandomStream('file','subdomain') calls; the manifests
// are plain on <subdomain>.formaturamaxi.com.br. Moved here from server.js without behaviour changes.
import * as cheerio from 'cheerio';
import { fetch as wreqFetch } from 'wreq-js';

export const headers = {
    "Referer": "https://roxiestreams.su/",
    "Origin": "https://roxiestreams.su",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36"
};

// The event pages only label buttons "Stream N"; the manifest filename is the only hint at the channel.
// Read off the on-screen channel bug of the live feeds (Oct 2026); slugs not listed show as just "Stream N".
const CHANNELS = {
    'golazo.m3u8': 'CBS Sports Golazo Network', 'cbssn.m3u8': 'CBS Sports Network',
    'tnt.m3u8': 'TNT Sports', 'ncaa15.m3u8': 'USA Network', 'test2.m3u8': 'Now Sports 1',
    'prem.m3u8': 'Sky Sports Premier League', 'main.m3u8': 'Sky Sports Main Event', 'sky2.m3u8': 'Sky Sports (alt feed)',
    'plus.m3u8': 'Sky Sports+',
    'bein.m3u8': 'beIN Sports 1', 'beines.m3u8': 'beIN Sports en Español', 'xtra.m3u8': 'beIN Sports Xtra',
    'one.m3u8': 'ONE Soccer', 'nfl.m3u8': 'NFL Network',
};

export const fetch = (url, opts) => wreqFetch(url, { browser: 'chrome_142', ...opts });

export const baseUrl = (stream) => `https://${stream.subdomain}.formaturamaxi.com.br`;

// { url, headers } to fetch this stream's manifest with
export const resolve = async (stream) => ({ url: `${baseUrl(stream)}/${stream.filename}`, headers });

// manifest text -> text whose segment lines point at our /segment route
export const rewrite = (text, i) => text.replace(/^(index_[a-zA-Z0-9_]+\.js)\s*$/gm, `/proxy/${i}/segment/$1`);

// -> the activeEvent for an event page
export async function selectEvent(eventPath, fallbackTitle) {
    const pageUrl = `https://roxiestreams.su/${eventPath}`;
    const response = await fetch(pageUrl, { headers });
    if (!response.ok) throw new Error("Failed to fetch event page");
    const html = await response.text();

    const regex = /getRandomStream\(\s*['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?\s*\)/g;
    const matches = [...html.matchAll(regex)];

    if (matches.length === 0) throw new Error("No streams found on page");

    // the page's auto-load line repeats the first stream, so dedupe by filename
    const streams = [...new Map(matches.map(m => [m[1], m])).values()].map((m, i) => ({
        id: i,
        name: CHANNELS[m[1]] ? `Stream ${i + 1} · ${CHANNELS[m[1]]}` : `Stream ${i + 1}`,
        filename: m[1],
        subdomain: m[2] || 'admin2'
    }));

    const $ = cheerio.load(html);
    let title = $('title').text().replace(/[-–|]\s*Roxiestreams.*$/i, '').trim();
    if (!title || title.includes("Roxiestreams")) title = fallbackTitle || eventPath;

    return { name: title, eventPath, streams, activeIndex: 0 };
}

// -> [{ id, title, link, startTime }] for a Roxiestreams sport page
export async function listEvents(sport) {
    const response = await fetch(`https://roxiestreams.su/${sport}`, { headers });
    const html = await response.text();
    const $ = cheerio.load(html);

    const events = [];
    $('#eventsTable tbody tr').each((i, el) => {
        const link = $(el).find('td a').attr('href') || '';
        const title = $(el).find('td a').text().trim();
        const startTime = $(el).find('td.event-start-time').text().trim();
        if (title) events.push({ id: i, title, link, startTime });
    });
    return events;
}
