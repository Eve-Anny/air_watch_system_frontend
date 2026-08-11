// Mirrors backend/app/models/*.py response shapes (ARCHITECTURE.md §2/§3). Kept as plain types, not
// generated - the API surface is small and stable enough that codegen would be more machinery than
// the problem needs.

export type Category = "Good" | "Moderate" | "Unhealthy" | "Hazardous";
export type AlertLevel = "Info" | "Warning" | "Critical";
export type Pollutant = "co" | "pm2_5" | "pm10" | "voc";

export interface Envelope<T> {
  data: T;
  meta: { count: number; total?: number; limit?: number; skip?: number };
}

export interface RawSensorValues {
  co_mg_m3: number | null;
  voc_index: number | null;
  pm1_0_ug_m3: number | null;
  pm2_5_ug_m3: number | null;
  pm10_ug_m3: number | null;
  temperature_c: number | null;
  humidity_pct: number | null;
  pressure_hpa: number | null;
}

export interface WhoScore {
  ratio: number | null;
  band: Category;
  note?: string;
}

export interface WhoScores {
  co: WhoScore;
  pm2_5: WhoScore;
  pm10: WhoScore;
  voc: WhoScore;
}

export interface RollingAverages {
  co_mg_m3_1h: number | null;
  co_mg_m3_15min: number | null;
  pm2_5_ug_m3_24h: number | null;
  pm10_ug_m3_24h: number | null;
  voc_index_1h: number | null;
}

export interface Reading {
  id: string;
  device_id: string;
  timestamp: string;
  received_at: string;
  raw: RawSensorValues;
  rolling_averages: RollingAverages;
  who_scores: WhoScores;
  dominant_pollutant: Pollutant | null;
  category: Category;
  archived?: boolean;
}

export interface StatusSummary {
  device_id: string;
  timestamp: string;
  category: Category;
  dominant_pollutant: Pollutant | null;
  who_scores: WhoScores;
}

export interface Device {
  device_id: string;
  name: string;
  location: { label: string | null; lat: number | null; lng: number | null };
  status: "online" | "offline";
  last_seen_at: string | null;
  registered_at: string;
  firmware_version: string | null;
}

export interface Alert {
  id: string;
  device_id: string;
  reading_id: string;
  level: AlertLevel;
  pollutant: string;
  category_at_trigger: Category;
  message: string;
  value: number | null;
  who_ratio: number | null;
  triggered_at: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
}

export interface ForecastStep {
  target_time: string;
  offset_hours: number;
  predicted_category: Category;
  predicted_dominant_pollutant: Pollutant | null;
  pollutant_forecasts: { co_mg_m3: number | null; pm2_5_ug_m3: number | null; pm10_ug_m3: number | null };
  // WHO-guideline ratios (dimensionless, same "x guideline" scale TrendChart.tsx plots history on) -
  // lets the forecast chart share an axis/ReferenceLine scheme with the trend chart instead of
  // mixing mg/m3 (CO) and ug/m3 (PM) on a dual axis.
  pollutant_ratios: { co: number | null; pm2_5: number | null; pm10: number | null };
}

export interface ForecastResponse {
  device_id: string;
  generated_at: string;
  model_status: "trained" | "placeholder";
  ml_classification_now: { category: Category; dominant_pollutant: Pollutant | null; confidence: number | null };
  horizon_hours: number;
  predictions: ForecastStep[];
}
