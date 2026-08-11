import { useState } from "react";
import type { PolledResource } from "../api/hooks";
import { acknowledgeAlert } from "../api/hooks";
import type { Alert } from "../types";
import { alertLevelStatus, STATUS_BG_CLASS, STATUS_BORDER_CLASS, STATUS_TEXT_CLASS, STATUS_WASH_CLASS } from "../statusColors";
import { StatusIcon } from "./common/StatusIcon";
import { PanelEmpty, PanelError, PanelLoading } from "./common/PanelStates";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

const ACKNOWLEDGED_BY_STORAGE_KEY = "aqms.acknowledgedBy";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });
}

function AlertRow({
  alert,
  acknowledgedBy,
  onAcknowledged,
}: {
  alert: Alert;
  acknowledgedBy: string;
  onAcknowledged: () => void;
}) {
  const [acking, setAcking] = useState(false);
  const role = alertLevelStatus(alert.level);

  async function handleAcknowledge() {
    setAcking(true);
    try {
      await acknowledgeAlert(alert.id, acknowledgedBy);
      onAcknowledged();
    } finally {
      setAcking(false);
    }
  }

  return (
    <li className={`flex items-start gap-3 rounded-lg border-l-4 p-3 ${STATUS_BORDER_CLASS[role]} ${STATUS_WASH_CLASS[role]}`}>
      <span className={`mt-0.5 rounded-full p-1 text-white ${STATUS_BG_CLASS[role]}`}>
        <StatusIcon role={role} className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold uppercase tracking-wide ${STATUS_TEXT_CLASS[role]}`}>
            {alert.level}
          </span>
          <span className="text-xs text-muted-foreground">{formatTime(alert.triggered_at)}</span>
        </div>
        <p className="mt-0.5 text-sm text-foreground">{alert.message}</p>
      </div>
      {!alert.acknowledged ? (
        <Button variant="outline" size="sm" onClick={handleAcknowledge} disabled={acking} className="shrink-0">
          {acking ? "…" : "Acknowledge"}
        </Button>
      ) : (
        <span className="shrink-0 text-xs text-muted-foreground">
          Acknowledged{alert.acknowledged_by ? ` by ${alert.acknowledged_by}` : ""}
        </span>
      )}
    </li>
  );
}

export function AlertsPanel({ alerts }: { alerts: PolledResource<Alert[]> }) {
  const [acknowledgedBy, setAcknowledgedBy] = useState(
    () => localStorage.getItem(ACKNOWLEDGED_BY_STORAGE_KEY) || "",
  );

  function updateAcknowledgedBy(value: string) {
    setAcknowledgedBy(value);
    localStorage.setItem(ACKNOWLEDGED_BY_STORAGE_KEY, value);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Active Alerts</CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="ack-by" className="whitespace-nowrap">
            Acknowledging as
          </Label>
          <Input
            id="ack-by"
            type="text"
            placeholder="your name (optional)"
            value={acknowledgedBy}
            onChange={(e) => updateAcknowledgedBy(e.target.value)}
            className="h-7 w-40 text-xs"
          />
        </div>
      </CardHeader>
      <CardContent>
        {alerts.loading ? (
          <PanelLoading label="Loading alerts…" />
        ) : alerts.error ? (
          <PanelError message={alerts.error} onRetry={alerts.refetch} />
        ) : !alerts.data || alerts.data.length === 0 ? (
          <PanelEmpty>No active alerts — all pollutants within WHO guidelines.</PanelEmpty>
        ) : (
          <ul className="space-y-2">
            {alerts.data.map((alert) => (
              <AlertRow key={alert.id} alert={alert} acknowledgedBy={acknowledgedBy} onAcknowledged={alerts.refetch} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
