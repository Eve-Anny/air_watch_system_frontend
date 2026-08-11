import type { Device } from "../types";
import { PanelEmpty, PanelError, PanelLoading } from "./common/PanelStates";
import type { PolledResource } from "../api/hooks";
import { cn } from "../lib/utils";

interface Props {
  devices: PolledResource<Device[]>;
  selectedDeviceId: string | null;
  onSelect: (deviceId: string) => void;
}

export function DeviceSelector({ devices, selectedDeviceId, onSelect }: Props) {
  if (devices.loading) return <PanelLoading label="Loading devices…" />;
  if (devices.error) return <PanelError message={devices.error} onRetry={devices.refetch} />;
  if (!devices.data || devices.data.length === 0) {
    return <PanelEmpty>No devices have reported in yet. Devices auto-register on their first reading.</PanelEmpty>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Select device">
      {devices.data.map((device) => {
        const isSelected = device.device_id === selectedDeviceId;
        return (
          <button
            key={device.device_id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(device.device_id)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            <span
              className={cn("h-2 w-2 rounded-full", device.status === "online" ? "bg-status-good" : "bg-muted-foreground")}
              aria-hidden="true"
            />
            {device.name}
            <span className="sr-only">({device.status})</span>
          </button>
        );
      })}
    </div>
  );
}
