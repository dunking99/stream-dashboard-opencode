import { useEffect, useState } from 'react';
import { createWorker } from 'tesseract.js';

// Known broadcast graphics. Boxes are fractions of the video frame (x, y, w, h).
// `score: null` = the score font isn't OCR-able, so only the clock is read.
const LAYOUTS = [
  { // Premier League, bottom-left
    clock: { x: 0.21, y: 0.89, w: 0.11, h: 0.07 },
    score: { x: 0.07, y: 0.89, w: 0.15, h: 0.07 },
  },
  { // La Liga (ESPN Deportes), top-left: clock under the logos, score stacked (its bold 0 reads as "|")
    clock: { x: 0.05, y: 0.105, w: 0.065, h: 0.055 },
    score: null,
  },
  { // Sky Sports, top-left: clock under the score box (checked on the Premier League and Main Event feeds)
    clock: { x: 0.08, y: 0.095, w: 0.10, h: 0.045 },
    score: null,
  },
];
const FAST_MS = 5000; // scan rate until the first confirmed clock
const SCALE = 2; // upscale small text before OCR
const MAX_SECS = 130 * 60;

function crop(video, box) {
  const sw = box.w * video.videoWidth;
  const sh = box.h * video.videoHeight;
  const c = document.createElement('canvas');
  c.width = sw * SCALE;
  c.height = sh * SCALE;
  c.getContext('2d').drawImage(
    video, box.x * video.videoWidth, box.y * video.videoHeight, sw, sh, 0, 0, c.width, c.height
  );
  return c;
}

const parseScore = (t) => {
  const m = t.match(/\b(\d{1,2})\b\D{0,4}\b(\d{1,2})\b/);
  return m ? { home: +m[1], away: +m[2] } : null;
};
const parseClock = (t) => {
  const m = t.match(/(\d{1,3}):(\d{2})/);
  const s = m && +m[1] * 60 + +m[2];
  return m && s <= MAX_SECS ? s : null;
};

/**
 * OCRs the broadcast scoreboard off the <video>. Scans every 5s until the first confirmed
 * clock, then every `intervalMs`. A value is only used after two consecutive agreeing reads.
 * Returns { offset, score, live, liveAt } (null until read); offset = matchSeconds - currentTime,
 * live = match seconds at the stream's live edge as of liveAt (Date.now()), for comparing streams.
 * `resetKey` (e.g. the stream's identity) discards everything read for the previous stream.
 */
export default function useScoreboard(videoRef, intervalMs, resetKey = '') {
  const [auto, setAuto] = useState({ key: resetKey, offset: null, score: null, live: null, liveAt: 0 });

  useEffect(() => {
    let dead = false;
    let worker;
    let timer;
    let layout = 0; // last layout that produced a clock
    let prevOffset = null;
    let prevScore = '';
    const cur = { key: resetKey, offset: null, score: null, live: null, liveAt: 0 };

    const read = async (v, i) => {
      const L = LAYOUTS[i];
      const secs = parseClock((await worker.recognize(crop(v, L.clock))).data.text);
      const score = L.score && parseScore((await worker.recognize(crop(v, L.score))).data.text);
      return { secs, score };
    };

    const scan = async () => {
      const v = videoRef.current;
      if (v && !v.paused && v.readyState >= 2 && v.videoWidth) {
        try {
          const t = v.currentTime;
          let r = await read(v, layout);
          for (let i = 0; r.secs === null && i < LAYOUTS.length; i++) {
            if (i === layout) continue;
            const alt = await read(v, i);
            if (alt.secs !== null) { r = alt; layout = i; prevOffset = null; prevScore = ''; }
          }
          if (dead) return;

          if (r.score) {
            const key = `${r.score.home}-${r.score.away}`;
            if (key === prevScore) cur.score = r.score;
            prevScore = key;
          }
          if (r.secs !== null) {
            // +0.5: the broadcast floors to whole seconds
            const off = r.secs + 0.5 - t;
            if (prevOffset !== null && Math.abs(off - prevOffset) < 2 &&
                (cur.offset === null || Math.abs(off - cur.offset) > 3)) {
              cur.offset = off;
            }
            prevOffset = off;
          }
          if (cur.offset !== null && v.seekable.length) {
            cur.live = cur.offset + v.seekable.end(v.seekable.length - 1);
            cur.liveAt = Date.now();
          }
          setAuto({ ...cur });
        } catch (e) {
          console.log('scoreboard OCR failed:', e); // e.g. tainted canvas
        }
      }
      if (!dead) timer = setTimeout(scan, cur.offset === null ? FAST_MS : intervalMs);
    };

    (async () => {
      worker = await createWorker('eng');
      await worker.setParameters({ tessedit_pageseg_mode: '7' }); // single line
      if (dead) return worker.terminate();
      scan();
    })();

    return () => {
      dead = true;
      clearTimeout(timer);
      worker?.terminate();
    };
  }, [videoRef, intervalMs, resetKey]);

  // anything read for a previous stream is ignored until the new one reports
  return auto.key === resetKey ? auto : { offset: null, score: null, live: null, liveAt: 0 };
}
