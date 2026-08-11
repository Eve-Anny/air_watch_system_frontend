import type { PolledResource } from "../api/hooks";
import type { StatusSummary } from "../types";
import { CategoryBadge } from "./common/CategoryBadge";
import { categoryStatus, STATUS_COLOR } from "../statusColors";
import { PanelEmpty, PanelError, PanelLoading } from "./common/PanelStates";
import { Card, CardContent } from "./ui/card";

const POLLUTANT_LABEL: Record<string, string> = {
  co: "Carbon Monoxide (CO)",
  pm2_5: "PM2.5",
  pm10: "PM10",
  voc: "VOC (non-WHO proxy)",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });
}

export function StatusCard({ status }: { status: PolledResource<StatusSummary | null> }) {
  if (status.loading)
    return (
      <Card>
        <CardContent className="pt-5">
          <PanelLoading label="Loading current status…" />
        </CardContent>
      </Card>
    );
  if (status.error)
    return (
      <Card>
        <CardContent className="pt-5">
          <PanelError message={status.error} onRetry={status.refetch} />
        </CardContent>
      </Card>
    );
  if (!status.data)
    return (
      <Card>
        <CardContent className="pt-5">
          <PanelEmpty>No readings yet for this device.</PanelEmpty>
        </CardContent>
      </Card>
    );

  const { category, dominant_pollutant, who_scores, timestamp } = status.data;
  const role = categoryStatus(category);
  const color = STATUS_COLOR[role];
  const ratio = dominant_pollutant ? who_scores[dominant_pollutant]?.ratio : null;

  return (
    <Card className="animate-fade-in-up overflow-hidden">
      <div style={{ background: `linear-gradient(135deg, ${color}1a, transparent 60%)` }}>
        <CardContent className="pt-5">
          <p className="text-sm font-medium text-muted-foreground">Current Air Quality</p>
          <div className="mt-4 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4"
              style={{ borderColor: color, backgroundColor: `${color}14` }}
            >
              <span className="text-2xl font-bold" style={{ color }}>
                {ratio !== null && ratio !== undefined ? `${ratio.toFixed(2)}x` : "—"}
              </span>
            </div>
            <div>
              <CategoryBadge category={category} size="lg" />
              <p className="mt-2 text-sm text-muted-foreground">
                Dominant pollutant:{" "}
                <span className="font-medium text-foreground">
                  {dominant_pollutant ? POLLUTANT_LABEL[dominant_pollutant] : "None (all within guidelines)"}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">as of {formatTime(timestamp)}</p>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
