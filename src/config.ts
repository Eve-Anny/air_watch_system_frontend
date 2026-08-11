// Env-based backend URL so the same build works against local and deployed backends (Phase 0's
// "environment-based config, no code changes between local/deployed" requirement). Vite exposes
// import.meta.env.VITE_* vars at build time - see .env.example / README.md.
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// Polling intervals ("real-time" strategy - ARCHITECTURE.md §1.3 confirmed polling over WebSocket).
// Different panels poll at different rates because they have different staleness tolerances and
// query costs:
export const POLL_INTERVAL_MS = {
  // Status + active alerts are what a panel member watches live during a demo - short interval.
  status: 10_000,
  alerts: 10_000,
  // Device list rarely changes mid-demo (no new hardware being plugged in every few seconds).
  devices: 30_000,
  // Historical trend + forecast are comparatively expensive queries (aggregation / model inference)
  // and don't need sub-minute freshness - a single new reading barely moves a 24h/multi-hour view.
  history: 60_000,
  forecast: 60_000,
};
