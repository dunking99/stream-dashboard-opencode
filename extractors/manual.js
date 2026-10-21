// A stream address you captured yourself (e.g. from your browser's Network tab) pasted in as-is.
// Nothing to look up: the stream carries its own manifestUrl and the headers the host wants.
import { UA } from './hls.js';

export const resolve = async (stream) => ({ url: stream.manifestUrl, headers: { "User-Agent": UA, ...stream.headers } });

// -> the activeEvent for one pasted address. `referer` is the embed page it came from
// (the host may check it), e.g. https://ehgembxe.cfd/
export function selectEvent(manifestUrl, referer, title) {
    if (!/^https?:\/\/.+\.m3u8/i.test(manifestUrl)) throw new Error("That doesn't look like an .m3u8 address");
    const origin = referer ? new URL(referer).origin : '';
    const headers = referer ? { Referer: origin + '/', Origin: origin } : {};
    return {
        name: title || "Pasted stream",
        eventPath: `manual:${manifestUrl.slice(-40)}`,
        streams: [{ id: 0, name: "Pasted stream", site: 'manual', manifestUrl, headers }],
        activeIndex: 0,
    };
}
