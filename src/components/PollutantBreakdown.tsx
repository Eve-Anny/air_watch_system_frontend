import { Star } from "lucide-react";
import type { PolledResource } from "../api/hooks";
import type { Pollutant, StatusSummary, WhoScore } from "../types";
import { categoryStatus, STATUS_COLOR, STATUS_TEXT_CLASS, STATUS_WASH_CLASS } from "../statusColors";
import { PanelEmpty, PanelError, PanelLoading } from "./common/PanelStates";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { cn } from "../lib/utils";

const POLLUTANT_META: Record<Pollutant, { label: string; unit: string }> = {
  co: { label: "Carbon Monoxide", unit: "× WHO 1-hr guideline" },
  pm2_5: { label: "PM2.5", unit: "× WHO 24-hr guideline" },
  pm10: { label: "PM10", unit: "× WHO 24-hr guideline" },
  voc: { label: "VOC index", unit: "non-WHO, indoor proxy" },
};

// VOC has no WHO ratio by design (non-WHO index, ARCHITECTURE.md §4.1) - GET /api/v1/status only
// exposes its band, not the raw index value, so its meter fill falls back to a fixed step per band
// rather than a precise fraction. WHO-backed pollutants (co/pm2_5/pm10) always use the real ratio.
const BAND_FRACTION: Record<string, number> = { Good: 20, Moderate: 50, Unhealthy: 75, Hazardous: 100 };

function StatTile({
  pollutant,
  score,
  dominant,
  bandFractionFallback = false,
}: {
  pollutant: Pollutant;
  score: WhoScore;
  dominant: boolean;
  bandFractionFallback?: boolean;
}) {
  const role = categoryStatus(score.band);
  const color = STATUS_COLOR[role];
  const percent =
    score.ratio !== null ? Math.min((score.ratio / 4) * 100, 100) : bandFractionFallback ? BAND_FRACTION[score.band] : 0;

  return (
    <Card className={cn("relative transition-shadow", STATUS_WASH_CLASS[role], dominant && "ring-2 ring-foreground/80")}>
      {dominant && (
        <span
          className="absolute right-3 top-3 text-foreground"
          title="Dominant pollutant"
          aria-label="Dominant pollutant"
        >
          <Star className="h-3.5 w-3.5 fill-current" />
        </span>
      )}
      <CardContent className="pt-5">
        <p className="text-xs font-medium text-muted-foreground">{POLLUTANT_META[pollutant].label}</p>
        <p className={cn("mt-1 text-lg font-semibold", STATUS_TEXT_CLASS[role])}>{score.band}</p>
        <Progress value={percent} className="mt-3" indicatorStyle={{ backgroundColor: color }} />
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-[11px] text-muted-foreground">
            {score.ratio !== null
              ? `${score.ratio.toFixed(2)}x guideline`
              : bandFractionFallback
                ? "index-based"
                : "no data yet"}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground/80">{POLLUTANT_META[pollutant].unit}</p>
      </CardContent>
    </Card>
  );
}

export function PollutantBreakdown({ status }: { status: PolledResource<StatusSummary | null> }) {
  if (status.loading) return <PanelLoading label="Loading pollutant breakdown…" />;
  if (status.error) return <PanelError message={status.error} onRetry={status.refetch} />;
  if (!status.data) return <PanelEmpty>No readings yet for this device.</PanelEmpty>;

  const { who_scores, dominant_pollutant } = status.data;
  const whoPollutants: Pollutant[] = ["co", "pm2_5", "pm10"];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {whoPollutants.map((pollutant) => (
        <StatTile key={pollutant} pollutant={pollutant} score={who_scores[pollutant]} dominant={pollutant === dominant_pollutant} />
      ))}
      <StatTile pollutant="voc" score={who_scores.voc} dominant={false} bandFractionFallback />
      <p className="col-span-2 -mt-1 text-[11px] text-muted-foreground lg:col-span-4">
        VOC is a non-WHO indoor air quality proxy — it never sets the overall category.
      </p>
    </div>
  );
}
