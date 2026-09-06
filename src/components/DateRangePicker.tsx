import { CalendarDays } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export interface DateRange {
  startDate: string;
  endDate: string;
}

interface Props {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

/** A blank end date means one local calendar day; an end date makes the range inclusive. */
export function DateRangePicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-2" aria-label="Measurement date range">
      <div className="grid gap-1">
        <Label htmlFor="start-date" className="text-xs text-muted-foreground">Date</Label>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input id="start-date" type="date" value={value.startDate} onChange={(event) => onChange({ ...value, startDate: event.target.value })} className="h-8 w-36 pl-7 text-xs" />
        </div>
      </div>
      <div className="grid gap-1">
        <Label htmlFor="end-date" className="text-xs text-muted-foreground">End date <span className="font-normal">(optional)</span></Label>
        <Input id="end-date" type="date" min={value.startDate || undefined} value={value.endDate} onChange={(event) => onChange({ ...value, endDate: event.target.value })} className="h-8 w-36 text-xs" />
      </div>
    </div>
  );
}
