// HLS helpers shared by the extractors whose streams carry full URLs (manifestUrl + headers).

export const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";

// Every non-comment manifest line is a segment URL: resolve it, remember it as fetchable
// (so /seg can't be used as an open proxy), and point the player at our /seg route.
export function rewriteManifest(text, stream, i) {
    stream.allowed ??= new Set();
    return text.split('\n').map((line) => {
        const l = line.trim();
        if (!l || l.startsWith('#')) return line;
        const abs = new URL(l, stream.manifestUrl).href;
        stream.allowed.add(abs);
        if (stream.allowed.size > 2000) stream.allowed.delete(stream.allowed.values().next().value);
        return `/proxy/${i}/seg/${Buffer.from(abs).toString('base64url')}`;
    }).join('\n');
}

// Some hosts hide MPEG-TS video inside fake "image" files (a junk header, then the real data).
// Skip to the first 0x47 sync byte that repeats every 188 bytes.
export function stripDisguise(buf) {
    if (buf[0] === 0x47) return buf;
    for (let i = 0; i < Math.min(buf.length - 564, 4096); i++) {
        if (buf[i] === 0x47 && buf[i + 188] === 0x47 && buf[i + 376] === 0x47 && buf[i + 564] === 0x47) return buf.subarray(i);
    }
    return buf;
}
