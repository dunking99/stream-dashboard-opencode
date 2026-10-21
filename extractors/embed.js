// Shared by the sites whose events list embed pages (iframes). The video address isn't in the page
// text, so a hidden Chrome loads the embed and we note the .m3u8 request its player makes.
// Addresses often carry an expiring token, so they're cached only until it expires.
import { chromium } from 'playwright-core';
import { UA } from './hls.js';

const EXTRACT_TIMEOUT_MS = 25000;
const MAX_TTL_MS = 30 * 60 * 1000;
const FAIL_TTL_MS = 30 * 1000; // after a failed extraction, don't retry for a bit
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// one shared Chrome, one extraction at a time
let browserP = null;
const getBrowser = () => browserP ??= chromium
    .launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] })
    .then((b) => { b.on('disconnected', () => { browserP = null; }); return b; })
    .catch((e) => { browserP = null; throw e; });

let queue = Promise.resolve();
const serial = (fn) => {
    const run = queue.then(fn);
    queue = run.catch(() => {});
    return run;
};

async function extract(embedUrl, referer) {
    const context = await (await getBrowser()).newContext({ userAgent: UA });
    try {
        const page = await context.newPage();
        const found = new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`no .m3u8 request within ${EXTRACT_TIMEOUT_MS / 1000}s`)), EXTRACT_TIMEOUT_MS);
            page.on('request', (req) => {
                if (/\.m3u8(\?|$)/.test(req.url())) { clearTimeout(timer); resolve(req); }
            });
        });
        page.goto(embedUrl, { referer, waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
        // some players wait for a click before they start
        const early = await Promise.race([found, sleep(5000).then(() => null)]);
        if (!early) await page.mouse.click(640, 360).catch(() => {});
        const req = early || await found;
        const h = req.headers();
        return { url: req.url(), headers: { "User-Agent": UA, ...(h.referer && { Referer: h.referer }), ...(h.origin && { Origin: h.origin }) } };
    } finally {
        await context.close().catch(() => {});
    }
}

// the address may have a unix expiry in its path ("/secure/<hash>/1792258457/name.m3u8")
const expiryOf = (url) => {
    const m = url.match(/\/(\d{10})\//);
    const now = Date.now();
    return Math.min(m ? Number(m[1]) * 1000 - 60000 : now + 10 * 60 * 1000, now + MAX_TTL_MS);
};

// -> { resolve, invalidate, isResolved } for a site whose streams carry an `embedUrl`.
// `refine(info)` can turn what the page requested into the address to use (e.g. master -> media playlist).
export function embedResolver(referer, refine = async (info) => info) {
    const cache = new Map(); // embedUrl -> { p: Promise<{url, headers}>, expires }
    return {
        // { url, headers } to fetch this stream's manifest with (extracted on first use, then cached)
        resolve(stream) {
            const hit = cache.get(stream.embedUrl);
            if (hit && Date.now() < hit.expires) return hit.p;
            const entry = { expires: Date.now() + EXTRACT_TIMEOUT_MS + 30000 }; // while pending
            entry.p = serial(() => extract(stream.embedUrl, referer)).then(refine).then(
                (info) => { entry.expires = expiryOf(info.url); return info; },
                (err) => { entry.expires = Date.now() + FAIL_TTL_MS; throw err; },
            );
            entry.p.catch(() => {});
            cache.set(stream.embedUrl, entry);
            return entry.p;
        },
        // the address stopped working (token expired early, 403, ...): extract a fresh one next time
        invalidate: (stream) => cache.delete(stream.embedUrl),
        // has this stream been extracted already? (lets the stats poll skip streams nobody is watching)
        isResolved(stream) {
            const hit = cache.get(stream.embedUrl);
            return !!hit && Date.now() < hit.expires;
        },
    };
}
