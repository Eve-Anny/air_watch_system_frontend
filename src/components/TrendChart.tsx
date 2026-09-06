import type { ReactNode } from "react";
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
import type { Reading } from "../types";
import type { DateRange } from "./DateRangePicker";
import { PanelEmpty, PanelError, PanelLoading } from "./common/PanelStates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

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

function toChartData(readings: Reading[], isMultiDay: boolean): ChartPoint[] {
  return readings.map((r) => {
    const date = new Date(r.timestamp);
    return {
      timestamp: date.getTime(),
      timeLabel: isMultiDay
        ? `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
        : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      co: r.who_scores.co.ratio,
      pm2_5: r.who_scores.pm2_5.ratio,
      pm10: r.who_scores.pm10.ratio,
    };
  });
}

export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return <div className="rounded-md border border-gridline bg-surface px-3 py-2 text-xs shadow-sm"><p className="mb-1 font-medium text-ink-primary">{label}</p>{payload.map((entry) => <p key={entry.name} className="flex items-center gap-1.5 text-ink-secondary"><span className="inline-block h-0.5 w-3" style={{ backgroundColor: entry.color }} /><span className="font-semibold text-ink-primary">{entry.value?.toFixed(2)}x</span> {entry.name}</p>)}</div>;
}

interface Props {
  readings: PolledResource<Reading[]>;
  dateRange: DateRange;
  datePicker: ReactNode;
}

export function TrendChart({ readings, dateRange, datePicker }: Props) {
  const rangeLabel = dateRange.endDate ? `${dateRange.startDate} to ${dateRange.endDate}` : dateRange.startDate;
  const isMultiDay = Boolean(dateRange.endDate && dateRange.endDate !== dateRange.startDate);
  const header = <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>WHO Guideline Ratio — {rangeLabel}</CardTitle><CardDescription>1.0x = at guideline; VOC excluded (non-WHO)</CardDescription></div>{datePicker}</CardHeader>;

  if (readings.loading) return <Card><CardContent className="pt-5"><PanelLoading label="Loading trend…" /></CardContent></Card>;
  if (readings.error) return <Card><CardContent className="pt-5"><PanelError message={readings.error} onRetry={readings.refetch} /></CardContent></Card>;
  if (!readings.data || readings.data.length === 0) return <Card>{header}<CardContent><PanelEmpty>No history for {rangeLabel} on this device.</PanelEmpty></CardContent></Card>;

  const data = toChartData(readings.data, isMultiDay);
  return <Card>{header}<CardContent><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}><CartesianGrid stroke="#e1e0d9" strokeDasharray="0" vertical={false} /><XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} minTickGap={40} /><YAxis tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} label={{ value: "× guideline", angle: -90, position: "insideLeft", fontSize: 11, fill: "#898781" }} /><ReferenceLine y={1} stroke="#fab219" strokeDasharray="3 3" strokeWidth={1} /><ReferenceLine y={2} stroke="#ec835a" strokeDasharray="3 3" strokeWidth={1} /><ReferenceLine y={4} stroke="#d03b3b" strokeDasharray="3 3" strokeWidth={1} /><Tooltip content={<ChartTooltip />} /><Legend wrapperStyle={{ fontSize: 12, color: "#52514e" }} formatter={(value) => <span className="text-ink-secondary">{value}</span>} />{SERIES.map((series) => <Line key={series.key} type="monotone" dataKey={series.key} name={series.label} stroke={series.color} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#fcfcfb" }} connectNulls />)}</LineChart></ResponsiveContainer></div></CardContent></Card>;
}
