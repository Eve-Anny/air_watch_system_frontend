import { Sparkles } from "lucide-react";
import type { PolledResource } from "../api/hooks";
import type { ForecastResponse } from "../types";
import { CategoryBadge } from "./common/CategoryBadge";
import { PanelEmpty, PanelError, PanelLoading } from "./common/PanelStates";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { categoryStatus, STATUS_WASH_CLASS } from "../statusColors";
import { ForecastChart } from "./ForecastChart";

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function ForecastPanel({ forecast }: { forecast: PolledResource<ForecastResponse | null> }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          Near-Future Forecast
        </CardTitle>
        {forecast.data && (
          <Badge
            variant="outline"
            className={forecast.data.model_status === "trained" ? "border-status-good/30 text-status-good" : "text-muted-foreground"}
            title={
              forecast.data.model_status === "trained"
                ? "Backed by trained Random Forest models (ml/train.py)"
                : "Fallback: naive persistence forecast (Random Forest models not yet trained)"
            }
          >
            {forecast.data.model_status === "trained" ? "ML model" : "placeholder"}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {forecast.loading ? (
          <PanelLoading label="Loading forecast…" />
        ) : forecast.error ? (
          <PanelError message={forecast.error} onRetry={forecast.refetch} />
        ) : !forecast.data || forecast.data.predictions.length === 0 ? (
          <PanelEmpty>No forecast available yet for this device.</PanelEmpty>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              RF near-term outlook: <CategoryBadge category={forecast.data.ml_classification_now.category} size="sm" />
              {forecast.data.ml_classification_now.confidence !== null && (
                <span className="ml-1">({Math.round(forecast.data.ml_classification_now.confidence * 100)}% confidence)</span>
              )}
              {" — comparative signal only; the rule-based scorer above is authoritative for the current reading."}
            </p>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {forecast.data.predictions.map((step) => {
                const role = categoryStatus(step.predicted_category);
                return (
                  <div
                    key={step.offset_hours}
                    className={`flex min-w-[84px] flex-col items-center gap-1.5 rounded-lg border border-border p-2.5 ${STATUS_WASH_CLASS[role]}`}
                  >
                    <span className="text-[11px] text-muted-foreground">+{step.offset_hours}h</span>
                    <CategoryBadge category={step.predicted_category} size="sm" variant="soft" />
                    <span className="text-[10px] text-muted-foreground">{formatHour(step.target_time)}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <ForecastChart predictions={forecast.data.predictions} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
