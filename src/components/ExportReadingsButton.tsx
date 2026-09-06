import { useState } from "react";
import { Download } from "lucide-react";
import { api } from "../api/client";
import type { Reading, Envelope } from "../types";
import type { ReadingDateRange } from "../api/hooks";
import { Button } from "./ui/button";

interface Props {
  deviceId: string | null;
  dateRange: ReadingDateRange;
  rangeLabel: string;
}

const HEADERS = [
  "timestamp", "device_id", "category", "dominant_pollutant", "co_mg_m3", "pm2_5_ug_m3",
  "pm10_ug_m3", "voc_index", "temperature_c", "humidity_pct", "pressure_hpa",
  "co_who_ratio", "pm2_5_who_ratio", "pm10_who_ratio",
];

function csvValue(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(readings: Reading[]) {
  const rows = readings.map((reading) => [
    reading.timestamp, reading.device_id, reading.category, reading.dominant_pollutant,
    reading.raw.co_mg_m3, reading.raw.pm2_5_ug_m3, reading.raw.pm10_ug_m3, reading.raw.voc_index,
    reading.raw.temperature_c, reading.raw.humidity_pct, reading.raw.pressure_hpa,
    reading.who_scores.co.ratio, reading.who_scores.pm2_5.ratio, reading.who_scores.pm10.ratio,
  ].map(csvValue).join(","));
  return [HEADERS.join(","), ...rows].join("\r\n");
}

export function ExportReadingsButton({ deviceId, dateRange, rangeLabel }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportCsv() {
    if (!deviceId) return;
    setExporting(true);
    setError(null);
    try {
      const allReadings: Reading[] = [];
      const pageSize = 1000;
      for (let skip = 0; ; skip += pageSize) {
        const response = await api.get<Envelope<Reading[]>>("/api/v1/readings", {
          device_id: deviceId,
          start: dateRange.start,
          end: dateRange.end,
          limit: pageSize,
          skip,
        });
        allReadings.push(...response.data);
        if (allReadings.length >= (response.meta.total ?? 0) || response.data.length < pageSize) break;
      }
      const blob = new Blob(["\uFEFF", toCsv(allReadings)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `air-quality-${deviceId}-${rangeLabel.replaceAll(" ", "_")}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      setIsOpen(false);
    } catch {
      setError("The export could not be created. Please check the backend connection and try again.");
    } finally {
      setExporting(false);
    }
  }

  return <>
    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsOpen(true)} disabled={!deviceId}>
      <Download className="h-3.5 w-3.5" /> Export CSV
    </Button>
    {isOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="export-title" className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg">
        <h2 id="export-title" className="text-base font-semibold text-foreground">Export measurements</h2>
        <p className="mt-2 text-sm text-muted-foreground">Download all active measurements for <span className="font-medium text-foreground">{rangeLabel}</span> as a CSV file?</p>
        <p className="mt-1 text-xs text-muted-foreground">The export includes readings beyond the rows currently visible in the table.</p>
        {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => { setIsOpen(false); setError(null); }} disabled={exporting}>Cancel</Button>
          <Button size="sm" onClick={() => void exportCsv()} disabled={exporting}>{exporting ? "Preparing…" : "Export CSV"}</Button>
        </div>
      </section>
    </div>}
  </>;
}
