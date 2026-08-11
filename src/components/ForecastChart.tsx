import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ForecastStep } from "../types";
import { ChartTooltip, SERIES } from "./TrendChart";

interface ChartPoint {
  offsetLabel: string;
  co: number | null;
  pm2_5: number | null;
  pm10: number | null;
}

function toChartData(predictions: ForecastStep[]): ChartPoint[] {
  return predictions.map((step) => ({
    offsetLabel: `+${step.offset_hours}h`,
    co: step.pollutant_ratios.co,
    pm2_5: step.pollutant_ratios.pm2_5,
    pm10: step.pollutant_ratios.pm10,
  }));
}

// Same WHO-ratio axis TrendChart.tsx plots history on (see ml_inference.py's `_ratios` docstring for
// why forecasts are exposed as guideline ratios rather than raw mg/m3-vs-ug/m3 values) - lets this
// sit directly beneath the forecast cards as a visual continuation of the trend chart above it.
export function ForecastChart({ predictions }: { predictions: ForecastStep[] }) {
  const data = toChartData(predictions);

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e1e0d9" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="offsetLabel"
            tick={{ fontSize: 11, fill: "#898781" }}
            axisLine={{ stroke: "#c3c2b7" }}
            tickLine={false}
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
              dot={{ r: 3, strokeWidth: 0, fill: series.color }}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fcfcfb" }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
