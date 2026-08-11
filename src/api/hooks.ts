import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "./client";
import { POLL_INTERVAL_MS } from "../config";
import { usePollingPaused } from "../runtimeSettings";
import type { Alert, Device, Envelope, ForecastResponse, Reading, RawSensorValues, StatusSummary } from "../types";

export interface PolledResource<T> {
  data: T | null;
  error: string | null;
  loading: boolean; // true only until the FIRST successful load - see module docstring below
  refetch: () => void;
}

/**
 * Polls `fetcher` every `intervalMs`. Deliberately does NOT flip back to a loading state on every
 * poll tick - per the dataviz skill's interaction guidance ("refetch keeps the frame... no skeleton,
 * no layout jump, no flash"), the dashboard holds its previous render while a background refetch is
 * in flight, and only shows a hard error state if a refetch fails outright (stale-but-present data
 * is better than a flash of "loading" every 10-60s).
 *
 * Respects the global pause toggle (runtimeSettings.setPollingPaused) - useful for freezing the
 * dashboard mid-demo without losing what's on screen. Paused only stops the *interval* tick; the
 * initial load and any explicit refetch() call (e.g. after submitting a manual reading) still fire.
 */
function usePolledResource<T>(fetcher: () => Promise<T>, intervalMs: number, deps: unknown[]): PolledResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const paused = usePollingPaused();

  const load = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setData(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, ...deps]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(load, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, load, paused]);

  return { data, error, loading, refetch: load };
}

export function useDevices(): PolledResource<Device[]> {
  return usePolledResource(
    async () => (await api.get<Envelope<Device[]>>("/api/v1/devices")).data,
    POLL_INTERVAL_MS.devices,
    [],
  );
}

export function useStatus(deviceId: string | null): PolledResource<StatusSummary | null> {
  return usePolledResource(
    async () => {
      if (!deviceId) return null;
      const envelope = await api.get<Envelope<StatusSummary[]>>("/api/v1/status", { device_id: deviceId });
      return envelope.data[0] ?? null;
    },
    POLL_INTERVAL_MS.status,
    [deviceId],
  );
}

export function useActiveAlerts(deviceId: string | null): PolledResource<Alert[]> {
  return usePolledResource(
    async () => {
      if (!deviceId) return [];
      return (await api.get<Envelope<Alert[]>>("/api/v1/alerts/active", { device_id: deviceId })).data;
    },
    POLL_INTERVAL_MS.alerts,
    [deviceId],
  );
}

export const TREND_RANGE_OPTIONS = [
  { label: "24h", hours: 24 },
  { label: "3d", hours: 24 * 3 },
  { label: "7d", hours: 24 * 7 },
  { label: "14d", hours: 24 * 14 },
  { label: "30d", hours: 24 * 30 },
] as const;

export function useHistoricalReadings(deviceId: string | null, hours = 24): PolledResource<Reading[]> {
  return usePolledResource(
    async () => {
      if (!deviceId) return [];
      const start = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      const envelope = await api.get<Envelope<Reading[]>>("/api/v1/readings", {
        device_id: deviceId,
        start,
        limit: 1000, // backend's max (readings router) - headroom for longer-range selections
      });
      // API returns newest-first (§ readings router sort); charts read chronologically.
      return [...envelope.data].reverse();
    },
    POLL_INTERVAL_MS.history,
    [deviceId, hours],
  );
}

export interface ReadingsPage {
  rows: Reading[];
  total: number;
}

/** Paginated, newest-first - backs the measurements table (separate from useHistoricalReadings,
 * which fetches a fixed chronological window for the trend chart). `archivedOnly` flips between the
 * default "active" view and a "view archived / restore" mode - these are mutually exclusive on the
 * backend (archived readings are excluded from every other read path: the trend chart, /latest, and
 * the scoring engine's rolling averages). */
export function usePaginatedReadings(
  deviceId: string | null,
  page: number,
  pageSize: number,
  archivedOnly = false,
): PolledResource<ReadingsPage> {
  return usePolledResource(
    async () => {
      if (!deviceId) return { rows: [], total: 0 };
      const envelope = await api.get<Envelope<Reading[]>>("/api/v1/readings", {
        device_id: deviceId,
        limit: pageSize,
        skip: page * pageSize,
        archived_only: archivedOnly ? "true" : undefined,
      });
      return { rows: envelope.data, total: envelope.meta.total ?? envelope.data.length };
    },
    POLL_INTERVAL_MS.history,
    [deviceId, page, pageSize, archivedOnly],
  );
}

export async function archiveReading(readingId: string): Promise<void> {
  await api.patch(`/api/v1/readings/${readingId}/archive`, {});
}

export async function unarchiveReading(readingId: string): Promise<void> {
  await api.patch(`/api/v1/readings/${readingId}/unarchive`, {});
}

export function useForecast(deviceId: string | null, horizonHours = 6): PolledResource<ForecastResponse | null> {
  return usePolledResource(
    async () => {
      if (!deviceId) return null;
      return (
        await api.get<{ data: ForecastResponse; meta: { count: number } }>("/api/v1/forecast", {
          device_id: deviceId,
          horizon_hours: horizonHours,
        })
      ).data;
    },
    POLL_INTERVAL_MS.forecast,
    [deviceId, horizonHours],
  );
}

export async function acknowledgeAlert(alertId: string, acknowledgedBy?: string): Promise<void> {
  await api.patch(`/api/v1/alerts/${alertId}/acknowledge`, {
    acknowledged_by: acknowledgedBy?.trim() || undefined,
  });
}

export interface SubmitReadingInput {
  device_id: string;
  raw: Partial<RawSensorValues>;
}

/** Manual reading submission (demo/testing tool, e.g. when live hardware isn't available) - posts
 * through the exact same /api/v1/readings path real firmware uses, so it exercises the real scoring
 * and alert engine, not a mocked shortcut. */
export async function submitReading(input: SubmitReadingInput): Promise<{ category: string; dominant_pollutant: string | null }> {
  return api.post("/api/v1/readings", {
    device_id: input.device_id,
    timestamp: new Date().toISOString(),
    raw: input.raw,
  });
}
