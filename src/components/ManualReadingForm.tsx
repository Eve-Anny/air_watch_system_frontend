import { useState } from "react";
import { Send } from "lucide-react";
import { submitReading } from "../api/hooks";
import { ApiError } from "../api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

// Matches ReadingIngestIn/RawSensorValues (backend/app/models/reading.py) exactly - this posts
// through the real POST /api/v1/readings path, so it exercises the actual scoring/alert engine
// rather than a mocked shortcut. Useful for demos/testing without live hardware.
const FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "co_mg_m3", label: "CO (mg/m³)", placeholder: "1.2" },
  { key: "voc_index", label: "VOC index", placeholder: "80" },
  { key: "pm1_0_ug_m3", label: "PM1.0 (µg/m³)", placeholder: "5" },
  { key: "pm2_5_ug_m3", label: "PM2.5 (µg/m³)", placeholder: "12" },
  { key: "pm10_ug_m3", label: "PM10 (µg/m³)", placeholder: "20" },
  { key: "temperature_c", label: "Temperature (°C)", placeholder: "24" },
  { key: "humidity_pct", label: "Humidity (%)", placeholder: "55" },
  { key: "pressure_hpa", label: "Pressure (hPa)", placeholder: "1013" },
];

interface Props {
  deviceId: string | null;
  onSubmitted: () => void;
}

export function ManualReadingForm({ deviceId, onSubmitted }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  function update(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!deviceId) return;

    const raw: Record<string, number> = {};
    for (const field of FIELDS) {
      const v = values[field.key]?.trim();
      if (v) {
        const parsed = Number(v);
        if (Number.isNaN(parsed)) {
          setFeedback({ kind: "error", message: `Invalid value for ${field.label}` });
          return;
        }
        raw[field.key] = parsed;
      }
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const ack = await submitReading({ device_id: deviceId, raw });
      setFeedback({ kind: "success", message: `Submitted — category: ${ack.category}` });
      setValues({});
      onSubmitted();
    } catch (err) {
      setFeedback({ kind: "error", message: err instanceof ApiError ? err.message : "Submission failed." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a Manual Reading</CardTitle>
        <CardDescription>
          Posts through the real ingestion endpoint — useful for a demo or test without live hardware.
          Leave any field blank to send it as null (simulates a sensor failure).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <Label htmlFor={`reading-${field.key}`}>{field.label}</Label>
              <Input
                id={`reading-${field.key}`}
                type="number"
                step="any"
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                onChange={(e) => update(field.key, e.target.value)}
                className="mt-1"
              />
            </div>
          ))}
          <div className="col-span-2 flex items-end sm:col-span-4">
            <Button type="submit" disabled={!deviceId || submitting} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              {submitting ? "Submitting…" : "Submit reading"}
            </Button>
          </div>
        </form>
        {feedback && (
          <p className={`mt-3 text-xs ${feedback.kind === "success" ? "text-status-good" : "text-status-critical"}`}>
            {feedback.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
