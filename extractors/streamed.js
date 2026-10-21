// streamed.pk: the API lists every source for a match, each with an embed.st page. embed.js digs the
// video address out of those pages. The host 403s Node's own TLS handshake, so manifests are fetched
// with a Chrome fingerprint (the segments sit on ordinary CDNs).
import { fetch as wreqFetch } from 'wreq-js';
import { UA } from './hls.js';
import { embedResolver } from './embed.js';

const SITE = 'https://streamed.pk/';
const API_HEADERS = { "User-Agent": UA };

export const fetch = (url, opts) => wreqFetch(url, { browser: 'chrome_142', ...opts });

// the player requests the master playlist; the stats and rewriting want the media playlist (best quality)
async function refine(info) {
    const res = await fetch(info.url, { headers: info.headers });
    if (!res.ok) return info; // let the normal manifest fetch report it
    const text = await res.text();
    if (!text.includes('#EXT-X-STREAM-INF')) return info;
    const variant = text.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('#'));
    return variant ? { ...info, url: new URL(variant, info.url).href } : info;
}

export const { resolve, invalidate, isResolved } = embedResolver(SITE, refine);

const getJson = async (url) => {
    const res = await globalThis.fetch(url, { headers: API_HEADERS });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return res.json();
};

// -> the activeEvent for a streamed.pk match (id = the match id from the events list)
export async function selectEvent(id, fallbackTitle) {
    const match = (await getJson('https://streamed.pk/api/matches/all')).find((m) => m.id === id);
    if (!match) throw new Error("Match not found on streamed.pk (it may have been removed)");

    // one entry per source, each with a few streams; a source that has nothing yet is skipped
    const lists = await Promise.all((match.sources || []).map((src) =>
        getJson(`https://streamed.pk/api/stream/${src.source}/${src.id}`).catch(() => [])));
    const streams = lists.flat().filter((s) => s.embedUrl).map((s, i) => ({
        id: i,
        name: `${s.language || `Stream ${i + 1}`} · ${s.source} ${s.streamNo}${s.hd ? ' HD' : ''}`, // language carries the channel ("English - Sky Sports Main Event")
        site: 'streamed',
        embedUrl: s.embedUrl,
    }));
    if (!streams.length) throw new Error("No streams listed for this match yet");

    return { name: fallbackTitle || match.title, eventPath: `streamed:${id}`, streams, activeIndex: 0 };
}
