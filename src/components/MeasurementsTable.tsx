import { useMemo, useState } from "react";
import { Archive, ArchiveRestore, ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { PolledResource, ReadingsPage } from "../api/hooks";
import { archiveReading, unarchiveReading } from "../api/hooks";
import { PanelEmpty, PanelError, PanelLoading } from "./common/PanelStates";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { CategoryBadge } from "./common/CategoryBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

const PAGE_SIZE = 10;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });
}

function fmt(value: number | null | undefined, decimals = 1): string {
  return value !== null && value !== undefined ? value.toFixed(decimals) : "—";
}

interface Props {
  readings: PolledResource<ReadingsPage>;
  page: number;
  onPageChange: (page: number) => void;
  showArchived: boolean;
  onToggleShowArchived: (show: boolean) => void;
}

export function MeasurementsTable({ readings, page, onPageChange, showArchived, onToggleShowArchived }: Props) {
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const rows = readings.data?.rows ?? [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) => r.category.toLowerCase().includes(q) || (r.dominant_pollutant ?? "").toLowerCase().includes(q),
    );
  }, [readings.data, search]);

  const total = readings.data?.total ?? 0;
  const hasNextPage = (page + 1) * PAGE_SIZE < total;

  async function handleArchiveToggle(readingId: string) {
    setPendingId(readingId);
    try {
      if (showArchived) {
        await unarchiveReading(readingId);
      } else {
        await archiveReading(readingId);
      }
      readings.refetch();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{showArchived ? "Archived Measurements" : "Recent Measurements"}</CardTitle>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search this page…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => onToggleShowArchived(!showArchived)}
            title={showArchived ? "Back to active measurements" : "View archived measurements"}
          >
            {showArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            {showArchived ? "Active" : "Archived"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {readings.loading ? (
          <PanelLoading label="Loading measurements…" />
        ) : readings.error ? (
          <PanelError message={readings.error} onRetry={readings.refetch} />
        ) : total === 0 ? (
          <PanelEmpty>
            {showArchived ? "No archived measurements for this device." : "No measurements recorded yet for this device."}
          </PanelEmpty>
        ) : filtered.length === 0 ? (
          <PanelEmpty>No rows on this page match "{search}".</PanelEmpty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Dominant</TableHead>
                <TableHead>CO (mg/m³)</TableHead>
                <TableHead>PM2.5 (µg/m³)</TableHead>
                <TableHead>PM10 (µg/m³)</TableHead>
                <TableHead>VOC index</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const isPending = pendingId === r.id;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatTime(r.timestamp)}</TableCell>
                    <TableCell>
                      <CategoryBadge category={r.category} size="sm" variant="soft" />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.dominant_pollutant ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{fmt(r.raw.co_mg_m3, 2)}</TableCell>
                    <TableCell className="text-muted-foreground">{fmt(r.raw.pm2_5_ug_m3)}</TableCell>
                    <TableCell className="text-muted-foreground">{fmt(r.raw.pm10_ug_m3)}</TableCell>
                    <TableCell className="text-muted-foreground">{fmt(r.raw.voc_index, 0)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        disabled={isPending}
                        onClick={() => handleArchiveToggle(r.id)}
                        title={showArchived ? "Restore this reading" : "Archive this reading (hides it from default views, still recoverable)"}
                      >
                        {showArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                        {isPending ? "…" : showArchived ? "Restore" : "Archive"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))} · {total} total
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0} className="gap-1">
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={!hasNextPage} className="gap-1">
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
