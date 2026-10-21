import { useCallback, useEffect, useRef, useState } from "react";

const pad = (n) => String(n).padStart(2, "0");

function format(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

function parseClock(input) {
  const t = input.trim();
  let m = t.match(/^(\d{1,3})[:.](\d{1,2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = t.match(/^(\d{1,3})$/);
  if (m) return Number(m[1]) * 60;
  return null;
}

export default function MatchClock({ videoRef, auto, home = "HOME", away = "AWAY" }) {
  const [manualOffset, setManualOffset] = useState(null);
  const [manualScore, setManualScore] = useState(null);
  const [display, setDisplay] = useState("--:--");
  const [open, setOpen] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const snapshotRef = useRef(null);
  const lastShownRef = useRef("");

  const offset = manualOffset ?? auto?.offset ?? null;
  const score = manualScore ?? auto?.score ?? null;
  const manual = manualOffset !== null || manualScore !== null;
  const hasTeams = Boolean(home && away);

  useEffect(() => {
    if (offset === null) return;
    let raf;
    const tick = () => {
      const v = videoRef.current;
      if (v) {
        const text = format(v.currentTime + offset);
        if (text !== lastShownRef.current) {
          lastShownRef.current = text;
          setDisplay(text);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [offset, videoRef]);

  const startCalibrate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    snapshotRef.current = { time: v.currentTime, wasPlaying: !v.paused };
    v.pause();
    setInput("");
    setError("");
    setCalibrating(true);
    setOpen(true);
  }, [videoRef]);

  const finishCalibrate = useCallback((e) => {
    e?.preventDefault();
    const seconds = parseClock(input);
    if (seconds === null) {
      setError("Use mm:ss, for example 46:10");
      return;
    }
    const snap = snapshotRef.current;
    if (!snap) return;
    setManualOffset(seconds + 0.5 - snap.time);
    setCalibrating(false);
    setOpen(false);
    const v = videoRef.current;
    if (v && snap.wasPlaying) v.play().catch(() => {});
  }, [input, videoRef]);

  const cancelCalibrate = useCallback(() => {
    setCalibrating(false);
    setOpen(false);
    const v = videoRef.current;
    if (v && snapshotRef.current?.wasPlaying) v.play().catch(() => {});
  }, [videoRef]);

  const nudge = (delta) => setManualOffset((current) => (current ?? offset ?? 0) + delta);

  const setSecondHalf = () => {
    const v = videoRef.current;
    if (v) setManualOffset(45 * 60 + 0.5 - v.currentTime);
  };

  const bump = (side, d) =>
    setManualScore((s) => ({ ...(s ?? score ?? { home: 0, away: 0 }), [side]: Math.max(0, (s?.[side] ?? score?.[side] ?? 0) + d) }));

  const resetAuto = () => {
    setManualOffset(null);
    setManualScore(null);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") (calibrating ? cancelCalibrate() : setOpen(false));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, calibrating, cancelCalibrate]);

  return (
    <div className="panel relative flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
      {hasTeams && (
        <>
          <div className="flex items-center gap-2.5">
            <span className="font-display text-lg font-semibold tracking-wide text-gray-300">{home}</span>
            <div className="flex items-baseline gap-1 font-display text-3xl font-bold leading-none text-white">
              <span className="tabular">{score?.home ?? '–'}</span>
              <span className="text-muted/50">:</span>
              <span className="tabular">{score?.away ?? '–'}</span>
            </div>
            <span className="font-display text-lg font-semibold tracking-wide text-gray-300">{away}</span>
          </div>
          <div className="h-9 w-px bg-line" aria-hidden="true" />
        </>
      )}

      <div>
        <div
          role="timer"
          aria-label={offset === null ? "Match clock not calibrated" : `Match clock ${display}`}
          className={`font-display text-3xl font-bold leading-none tabular ${offset === null ? 'text-muted/70' : 'text-white'}`}
        >
          {offset === null ? '--:--' : display}
        </div>
        <div className="label mt-1">{offset === null ? 'Not calibrated' : 'Match clock'}</div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {manual && <span className="chip border-amber/30 bg-amber/10 text-amber">Manual</span>}
        {offset === null ? (
          <button type="button" onClick={startCalibrate} className="btn-primary">Calibrate clock</button>
        ) : (
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="btn">
            Clock settings
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Clock settings"
          className="absolute right-3 top-full z-30 mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-xl border border-line bg-ink-850 p-3 shadow-2xl shadow-black/40"
        >
          {calibrating ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-100">Calibrate clock</h3>
                <button type="button" onClick={cancelCalibrate} className="text-xs text-muted hover:text-gray-200">Cancel</button>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">Type the match clock frozen on screen. The video is paused while you do this.</p>
              <form onSubmit={finishCalibrate} className="mt-2 flex gap-2">
                <input
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="mm:ss"
                  aria-label="Match clock on screen"
                  className="field font-mono"
                />
                <button type="submit" className="btn-primary shrink-0">Set</button>
              </form>
              {error && <p className="mt-2 text-[11px] text-live">{error}</p>}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-100">Clock</h3>
                <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted hover:text-gray-200">Close</button>
              </div>

              <div className="mt-3">
                <div className="label">Adjust</div>
                <div className="mt-1 grid grid-cols-3 gap-1">
                  <button type="button" onClick={() => nudge(-1)} className="btn">−1s</button>
                  <button type="button" onClick={() => nudge(1)} className="btn">+1s</button>
                  <button type="button" onClick={setSecondHalf} className="btn">45:00</button>
                </div>
              </div>

              {hasTeams && (
                <div className="mt-3">
                  <div className="label">Score</div>
                  <div className="mt-1 space-y-1">
                    {[['home', home], ['away', away]].map(([side, label]) => (
                      <div key={side} className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-gray-300">{label}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => bump(side, -1)} aria-label={`Decrease ${label} score`} className="btn px-2 py-1">−</button>
                          <span className="w-6 text-center font-mono text-sm text-gray-100">{score?.[side] ?? 0}</span>
                          <button type="button" onClick={() => bump(side, 1)} aria-label={`Increase ${label} score`} className="btn px-2 py-1">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="button" onClick={startCalibrate} className="btn mt-3 w-full">Recalibrate clock</button>
              {manual && (
                <button type="button" onClick={resetAuto} className="btn mt-1 w-full" title="Drop manual edits and follow the scoreboard OCR">
                  Follow scoreboard OCR
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
