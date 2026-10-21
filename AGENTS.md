# AGENTS.md

Sports-stream failover dashboard: React 19 + Vite SPA (`src/`) against an Express backend (`server.js`). Plain JS/JSX — **no TypeScript, no typecheck step**. `README.md` is untouched Vite boilerplate and describes none of this; trust the code.

## Commands

- Backend: `node server.js` → `:3005` (`PORT`). Frontend: `npm run dev` → Vite on `:5173`, proxying `/api` and `/proxy` to `http://localhost:3005` (`API_PORT` points at a second backend copy). **Both must be running**; the dashboard just logs fetch errors without the backend.
- `npm run build`, `npm run lint`. The proxy is `server.proxy` only, so `npm run preview` (and the `dist/` output) can't reach `/api` — expected, not a bug you introduced. `server.js` has no static middleware, so nothing serves `dist/` in production.
- Test: `node matching.test.js` is the **only** test (plain `node:assert`, prints `matching ok`). There is no `npm test` script.
- Verify in this order: `node matching.test.js` → `npm run build`. `npm run lint` is **red at baseline with 21 errors** — treat that as the floor, not your regression, and don't fix unrelated files while on another task:
  - `Buffer`/`process` → `no-undef` in `server.js`, `vite.config.js`, `extractors/hls.js` (eslint config declares only browser globals while the backend is Node code)
  - unused `React` default imports in 5 JSX files; unused destructured-omit vars in `server.js`; unused `members` in `matching.js:57`
- **Not a git repo** (Syncthing-synced; never delete `.stfolder`). No CI, no pre-commit hooks, no commit workflow.

## Architecture

- **Adding a site = 4 touch points**: events adapter + `SPORTS` row in `sites.js` → `extractors` map in `server.js` → `SITE_URL`, `PLAYABLE`, `SITE_NAME` in `src/components/MatchedEvents.jsx`. `ppv` has an adapter but is deliberately not `PLAYABLE` (no extractor); `manual` (paste an `.m3u8`) has an extractor but no listing adapter.
- `/api/select-*` mutates a **module-level `activeEvent`** in `server.js`, and every `/proxy/:i/...` route reads that same global. One active event per process, no sessions — run two copies (`PORT` + `API_PORT`) for isolation.
- Manifest pipeline: extractor `resolve(stream)` → `{ url, headers }` → segments rewritten to `/proxy/:i/seg/<base64url>` and recorded in the stream's `allowed` set (`extractors/hls.js`), which is what keeps `/seg` from being an open proxy. Roxiestreams instead use `/proxy/:i/segment/:name` (bare filenames on the manifest's own host).
- Upstream politeness is deliberate — preserve it when touching polling: active stream stats every 10s, inactive every 10 min (`statsFor` in `server.js`), listing responses cached 20s (`getJson` in `sites.js`), and `src/components/StreamProbe.jsx` queues hidden probe players so only one hits a site at a time.
- `extractors/embed.js` drives one shared headless Chrome through `playwright-core` with `channel: 'chrome'` → **Google Chrome must be installed locally** (playwright-core downloads no browsers). Extractions are serialized, 25s timeout, cached until the URL's expiry token; `invalidate`/`isResolved` let the server skip streams nobody is watching.
- Hosts that reject Node's TLS handshake (`streamed.pk`, roxiestreams) must be fetched via `wreq-js` (`browser: 'chrome_142'`); plain `fetch` gets 403.
- Listing routes swallow upstream failures into a JSON `errors` map instead of 5xx (`eventsForSport`, `/api/matched-events-espn`). Site APIs and the unofficial ESPN feeds break often; that's by design.

## Frontend

- Scoreboard OCR is in `src/useScoreboard.js` (tesseract.js, in-browser). `LAYOUTS` are boxes as fractions of the video frame — a new broadcast graphic means adding a box there, not touching the parser. A clock/score value only lands after two consecutive agreeing reads.
- `StreamProbe.jsx` hides probe players with fixed positioning + `opacity: 0`, never `display: none` (browsers skip decoding those).
- Second entrypoint: `workshop.html` → `src/workshop/` is a design sandbox served at `/workshop.html`, isolated from the live app. `design/*.html` are standalone static mockups.
