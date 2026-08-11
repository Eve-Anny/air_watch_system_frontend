import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";

// Shared loading/empty/error states so no panel ever renders a blank screen when the backend is
// down or a device has no data yet (Phase 6 requirement). Loading only appears on a panel's FIRST
// load - background poll refetches hold the previous render instead (see api/hooks.ts).

export function PanelLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground" role="status">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function PanelEmpty({ children }: { children: ReactNode }) {
  return <div className="py-10 text-center text-sm text-muted-foreground">{children}</div>;
}

export function PanelError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-sm" role="alert">
      <span className="font-medium text-status-critical">{message}</span>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
