// timst.top: the events API lists each match's embed pages (iframes); embed.js digs the video
// address out of them.
import { UA } from './hls.js';
import { embedResolver } from './embed.js';

const SITE = 'https://timst.top/';

export const { resolve, invalidate, isResolved } = embedResolver(SITE);

// -> the activeEvent for a timst event (id = the event's `url` slug from the events list)
export async function selectEvent(id, fallbackTitle) {
    const res = await fetch('https://timst.top/api/live-upcoming', { headers: { "User-Agent": UA, Referer: SITE, Origin: SITE.slice(0, -1) } });
    if (!res.ok) throw new Error(`timst events API -> ${res.status}`);
    const ev = (await res.json()).events.find((e) => e.url === id);
    if (!ev) throw new Error("Event not found on timst.top (it may have been removed)");
    if (!ev.streams?.length) throw new Error("No streams listed for this event yet");

    const streams = ev.streams.map((s, i) => ({ id: i, name: s.name || `Stream ${i + 1}`, site: 'timst', embedUrl: s.url }));
    return { name: fallbackTitle || ev.name, eventPath: `timst:${id}`, streams, activeIndex: 0 };
}
