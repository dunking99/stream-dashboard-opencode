import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import useScoreboard from '../useScoreboard';

const GIVE_UP_MS = 60 * 1000; // stop trying to read a stream after this long
const RESCAN_MS = 10 * 60 * 1000; // sleep between scans (the dashboard's timers carry the clock meanwhile)

// Only one probe scans at a time, so the sites never see several extra viewers at once.
let tail = Promise.resolve();
function acquire() {
  let release;
  const held = new Promise((r) => { release = r; });
  const ready = tail.then(() => release);
  tail = tail.then(() => held);
  return ready; // resolves, once it's our turn, to the function that hands the turn back
}

// Hidden muted player that is only mounted while scanning: connects, OCRs the scoreboard
// until the clock is confirmed, reports it, and closes.
function ProbePlayer({ event, index, onClock, onRead }) {
  const videoRef = useRef(null);
  const { live, liveAt } = useScoreboard(videoRef, RESCAN_MS, `${event}:${index}`);

  useEffect(() => {
    const hls = new Hls({ enableWorker: false });
    hls.loadSource(`/proxy/${index}/manifest.m3u8`);
    hls.attachMedia(videoRef.current);
    hls.on(Hls.Events.MANIFEST_PARSED, () => videoRef.current.play().catch(() => {}));
    return () => hls.destroy();
  }, [index]);

  useEffect(() => {
    if (live === null) return;
    onClock(event, index, live, liveAt);
    onRead();
  }, [event, index, live, liveAt, onClock, onRead]);

  // not display:none -- browsers may skip decoding frames for those
  return <video ref={videoRef} muted playsInline style={{ position: 'fixed', width: 320, height: 180, opacity: 0, pointerEvents: 'none' }} />;
}

// waiting (for its turn) -> scanning -> asleep -> waiting ...; `recheck` changing sends it back to waiting
export default function StreamProbe({ recheck, ...props }) {
  const [phase, setPhase] = useState('waiting');
  const release = useRef(null);

  useEffect(() => {
    if (phase === 'waiting') {
      let cancelled = false;
      acquire().then((rel) => {
        if (cancelled) return rel();
        release.current = rel;
        setPhase('scanning');
      });
      return () => { cancelled = true; };
    }
    const t = setTimeout(() => setPhase(phase === 'scanning' ? 'asleep' : 'waiting'), phase === 'scanning' ? GIVE_UP_MS : RESCAN_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // leaving 'scanning' (read, gave up, unmounted) hands the turn to the next probe
  useEffect(() => {
    if (phase !== 'scanning') { release.current?.(); release.current = null; }
  }, [phase]);
  useEffect(() => () => release.current?.(), []);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setPhase('waiting');
  }, [recheck]);

  return phase === 'scanning' ? <ProbePlayer {...props} onRead={() => setPhase('asleep')} /> : null;
}
