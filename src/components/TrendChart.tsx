import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PolledResource } from "../api/hooks";
import { TREND_RANGE_OPTIONS } from "../api/hooks";
import type { Reading } from "../types";
import { PanelEmpty, PanelError, PanelLoading } from "./common/PanelStates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { cn } from "../lib/utils";

// Series colors: fixed categorical slots 1/2/3 (dataviz skill, references/palette.md), assigned in
// order and never cycled - CO always slot 1, PM2.5 always slot 2, PM10 always slot 3. Exported so
// ForecastChart can reuse the exact same colors/labels instead of risking drift from a duplicate.
export const SERIES = [
  { key: "co", label: "CO", color: "#2a78d6" },
  { key: "pm2_5", label: "PM2.5", color: "#1baf7a" },
  { key: "pm10", label: "PM10", color: "#eda100" },
] as const;

interface ChartPoint {
  timestamp: number;
  timeLabel: string;
  co: number | null;
  pm2_5: number | null;
  pm10: number | null;
}

function toChartData(readings: Reading[], rangeHours: number): ChartPoint[] {
  // Longer ranges need a date in the label, not just a time - otherwise multi-day ticks are
  // indistinguishable ("10:00 AM" repeated every day).
  const includeDate = rangeHours > 24;
  return readings.map((r) => {
    const date = new Date(r.timestamp);
    return {
      timestamp: date.getTime(),
      timeLabel: includeDate
        ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
          (rangeHours <= 24 * 3 ? " " + date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "")
        : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      co: r.who_scores.co.ratio,
      pm2_5: r.who_scores.pm2_5.ratio,
      pm10: r.who_scores.pm10.ratio,
    };
  });
}

export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-gridline bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium text-ink-primary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-1.5 text-ink-secondary">
          <span className="inline-block h-0.5 w-3" style={{ backgroundColor: entry.color }} />
          <span className="font-semibold text-ink-primary">{entry.value?.toFixed(2)}x</span> {entry.name}
        </p>
      ))}
    </div>
  );
}

interface Props {
  readings: PolledResource<Reading[]>;
  rangeHours: number;
  onRangeChange: (hours: number) => void;
}

export function TrendChart({ readings, rangeHours, onRangeChange }: Props) {
  const rangeLabel = TREND_RANGE_OPTIONS.find((o) => o.hours === rangeHours)?.label ?? `${rangeHours}h`;

  const rangeSelector = (
    <div className="flex gap-1 rounded-md bg-muted p-1">
      {TREND_RANGE_OPTIONS.map((option) => (
        <button
          key={option.hours}
          onClick={() => onRangeChange(option.hours)}
          className={cn(
            "rounded px-2 py-1 text-xs font-medium transition-colors",
            option.hours === rangeHours
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  if (readings.loading)
    return (
      <Card>
        <CardContent className="pt-5">
          <PanelLoading label="Loading trend…" />
        </CardContent>
      </Card>
    );
  if (readings.error)
    return (
      <Card>
        <CardContent className="pt-5">
          <PanelError message={readings.error} onRetry={readings.refetch} />
        </CardContent>
      </Card>
    );
  if (!readings.data || readings.data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>WHO Guideline Ratio</CardTitle>
            <CardDescription>1.0x = at guideline; VOC excluded (non-WHO)</CardDescription>
          </div>
          {rangeSelector}
        </CardHeader>
        <CardContent>
          <PanelEmpty>Not enough history in the last {rangeLabel} to plot a trend for this device.</PanelEmpty>
        </CardContent>
      </Card>
    );
  }

  const data = toChartData(readings.data, rangeHours);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>WHO Guideline Ratio — Last {rangeLabel}</CardTitle>
          <CardDescription>1.0x = at guideline; VOC excluded (non-WHO)</CardDescription>
        </div>
        {rangeSelector}
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e1e0d9" strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              tick={{ fontSize: 11, fill: "#898781" }}
              axisLine={{ stroke: "#c3c2b7" }}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#898781" }}
              axisLine={{ stroke: "#c3c2b7" }}
              tickLine={false}
              label={{ value: "× guideline", angle: -90, position: "insideLeft", fontSize: 11, fill: "#898781" }}
            />
            {/* Band boundaries (ARCHITECTURE.md §4.3): 1.0=Good/Moderate, 2.0=Moderate/Unhealthy, 4.0=Unhealthy/Hazardous */}
            <ReferenceLine y={1} stroke="#fab219" strokeDasharray="3 3" strokeWidth={1} />
            <ReferenceLine y={2} stroke="#ec835a" strokeDasharray="3 3" strokeWidth={1} />
            <ReferenceLine y={4} stroke="#d03b3b" strokeDasharray="3 3" strokeWidth={1} />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#52514e" }}
              formatter={(value) => <span className="text-ink-secondary">{value}</span>}
            />
            {SERIES.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stroke={series.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fcfcfb" }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
