import { useState } from "react";
import { Pause, Play, Settings, Wind } from "lucide-react";
import { getApiBaseUrl, setApiBaseUrl, usePollingPaused, setPollingPaused } from "../../runtimeSettings";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface Props {
  isOffline: boolean;
}

export function Header({ isOffline }: Props) {
  const paused = usePollingPaused();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState(getApiBaseUrl());

  function applyUrl() {
    setApiBaseUrl(urlDraft);
    setSettingsOpen(false);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-series-1 to-series-2">
            <Wind className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-foreground">Air Quality Dashboard</h1>
            <p className="text-[11px] leading-tight text-muted-foreground">WHO-aligned rolling-window monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => setPollingPaused(!paused)}
            title={paused ? "Resume auto-refresh" : "Pause auto-refresh"}
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {paused ? "Paused" : "Live"}
          </Button>

          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <span
              className={`h-1.5 w-1.5 rounded-full ${isOffline ? "bg-status-critical" : "bg-status-good animate-pulse"}`}
              aria-hidden="true"
            />
            {isOffline ? "Backend unreachable" : "Connected"}
          </span>

          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full" title="Backend settings">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Label htmlFor="api-base-url">Backend API URL</Label>
              <Input
                id="api-base-url"
                type="text"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyUrl()}
                className="mt-1.5"
                placeholder="http://localhost:8000"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Runtime override, saved in this browser only — no rebuild needed to point at a
                different backend (e.g. local vs. deployed).
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={applyUrl}>
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
