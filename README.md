# frontend/

React + Tailwind dashboard for the IoT Air Quality Management System, built against the Phase 4 API
contract (`ARCHITECTURE.md` §3) and Phase 5's forecast endpoint.

## Stack choices

- **React + Vite + TypeScript.** Vite for fast dev/build with zero config ceremony; TypeScript so the
  API response shapes (`src/types.ts`, mirroring the backend's Pydantic models) are checked at compile
  time rather than trusted at runtime.
- **Tailwind CSS**, per Phase 0's tech stack.
- **Recharts** for the trend chart — a React-native charting API (declarative `<LineChart>`/`<Line>`
  components, not an imperative D3 wrapper you have to bridge yourself), small enough footprint for
  one chart type, and well-documented enough to be defensible in a panel Q&A about "why this library."
- **No React Query / SWR.** A small hand-rolled polling hook (`api/hooks.ts`'s `usePolledResource`) was
  used instead of pulling in a data-fetching library. At this app's scale (5 endpoints, simple polling,
  no complex cache invalidation) a ~40-line hook is easier to explain line-by-line in a defense than a
  library's cache internals, and keeps the dependency list small — consistent with Phase 0's
  "prefer clarity/simplicity" lineage note.

## Component structure

```
src/
├── config.ts               # API base URL (env) + per-panel poll intervals
├── types.ts                  # API response shapes
├── statusColors.ts             # category/alert-level -> status color mapping (see below)
├── api/
│   ├── client.ts                # fetch wrapper, error normalization
│   └── hooks.ts                   # usePolledResource + per-endpoint hooks (useStatus, useForecast, …)
└── components/
    ├── layout/Header.tsx
    ├── DeviceSelector.tsx
    ├── StatusCard.tsx              # current category, color-coded, dominant pollutant
    ├── PollutantBreakdown.tsx       # per-pollutant WHO-ratio meters, dominant pollutant highlighted
    ├── TrendChart.tsx                 # WHO-ratio trend line (see "Why ratio, not raw values" below)
    ├── AlertsPanel.tsx                  # active Info/Warning/Critical alerts + acknowledge
    ├── ForecastPanel.tsx                  # near-future category timeline (Phase 5 forecast)
    └── common/                              # StatusIcon, CategoryBadge, PanelLoading/Empty/Error
```

## Color system

Built against the project's `dataviz` design skill rather than hand-picked colors — every categorical
and status color used here was run through the skill's validator
(`node scripts/validate_palette.js "<hex,…>" --mode light`) before use, not eyeballed:

- **Status colors** (category Good/Moderate/Unhealthy/Hazardous, and alert levels Info/Warning/
  Critical) use the skill's fixed, reserved status scale (`statusColors.ts`) — never the categorical
  palette, and always paired with an icon + text label (`StatusIcon.tsx`), never color alone, since
  "warning"/"serious" fall below 3:1 contrast on a light surface by design in that palette.
- **Trend chart series** (CO/PM2.5/PM10 identity) use the skill's categorical palette, slots 1–3 in
  fixed order (blue/aqua/yellow), never cycled. The validator flagged aqua/yellow as sub-3:1 contrast
  against the surface (a WARN, not a fail) — the chart ships the required mitigation: a legend, a
  visible line-color tooltip, and CO/PM2.5/PM10 always spelled out in the axis/legend text rather than
  relying on the reader to distinguish hues alone.

## Why the trend chart plots WHO ratio, not raw pollutant values

CO is measured in mg/m³ and PM2.5/PM10 in µg/m³ — different units and wildly different scales (CO
sits around 0–5, PM10 can run into the hundreds). Plotting all three on one chart with a shared axis
would either need a second y-axis (a dual-axis chart — the dataviz skill's #1 flagged anti-pattern, since
it makes two unrelated scales look visually comparable) or would squash CO into an invisible flat line.
Instead, `TrendChart.tsx` plots each pollutant's **WHO guideline ratio** (already computed by the
backend's scoring engine, `who_scores.*.ratio`) — a dimensionless, directly comparable "x guideline"
value for all three, with reference lines at the 1.0/2.0/4.0 band boundaries from `ARCHITECTURE.md`
§4.3. This is the skill's own recommended alternative to a dual axis ("index to a common base"), and
it ties the chart directly into the project's WHO-rolling-window narrative rather than being an
arbitrary normalization choice. VOC is excluded from this chart — it has no WHO ratio (non-WHO index,
labeled as such everywhere it appears in the UI).

## "Real-time" behavior: polling

Per `ARCHITECTURE.md` §1.3's confirmed decision (polling over WebSocket — sensor cadence is the real
bottleneck, not delivery latency), each panel polls on its own interval (`config.ts`):

| Panel | Interval | Why |
|---|---|---|
| Status, active alerts | 10s | What a panel member watches live during a demo |
| Device list | 30s | Doesn't change mid-demo |
| Historical trend, forecast | 60s | More expensive queries (aggregation / model inference); a single new reading barely moves a 24h view |

Background poll refetches **hold the previous render** rather than flashing back to a loading state
every cycle (`usePolledResource` only sets `loading=true` before the *first* successful load) — an
error from one bad poll doesn't nuke a panel that already has good data on screen.

## Local dev setup

```
cd frontend
npm install
cp .env.example .env.local   # defaults to http://localhost:8000
npm run dev
```

Requires the backend running locally (see `backend/README.md`) — `.env.local`'s `VITE_API_BASE_URL`
points at it. For the deployed build (Vercel), set `VITE_API_BASE_URL` as a platform env var pointing
at the deployed backend URL — no code changes between local and deployed, per Phase 0.

| Variable | Local dev default | Deployed value |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | your deployed backend URL, e.g. `https://your-backend.onrender.com` |

`npm run build` type-checks (`tsc -b`) then produces a static `dist/` bundle via Vite, deployable as-is
to Vercel or any static host.

**Known dev-only advisory:** `npm audit` flags esbuild/Vite 5.x's dev-server-only vulnerability
(GHSA-67mh-4wv8-2f99 — a malicious website could probe the local dev server while `npm run dev` is
running). It doesn't affect production builds. The fix requires a breaking Vite 8 upgrade, out of
scope here; noted rather than silently ignored.

## Loading / empty / error states

Every panel (`components/common/PanelStates.tsx`) has three states beyond its normal render: a first-
load spinner, an empty-but-successful state (e.g. "No active alerts", "No readings yet for this
device"), and an error state with a Retry button (shown when the backend is unreachable or returns an
error) — verified directly by simulating a fully-down backend rather than assumed: the device selector
shows a clear error + retry, and every other panel falls back to its empty state instead of the app
crashing to a blank screen.
