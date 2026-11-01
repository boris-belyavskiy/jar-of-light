"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarClock, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DayPicker } from "react-day-picker";
import { enUS, ru } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { entryDateLabel } from "@/lib/time";
import { PILL } from "./pill";

function toDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The date and time at the top of an entry being written: the same pill the
 * feed shows, which opens a small window with a calendar and the time.
 * The form receives "YYYY-MM-DD" and "HH:MM" from hidden inputs.
 */
export function DateTimePill({ date: initialDate, time: initialTime }: { date: string; time: string }) {
  const locale = useLocale();
  const t = useTranslations("entry");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [open, setOpen] = useState(false);
  const thisYear = new Date().getFullYear();

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <input type="hidden" name="occurredOn" value={date} />
      <input type="hidden" name="occurredTime" value={time} />
      <Popover.Trigger
        aria-label={t("changeDateTime")}
        className={cn(PILL, "cursor-pointer transition-colors hover:bg-sky focus-visible:ring-2 focus-visible:ring-ring")}
      >
        <CalendarClock className="size-4 text-primary" aria-hidden="true" />
        {entryDateLabel(date, time, locale)}
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start" className="z-50">
          <Popover.Popup className="date-picker rounded-xl bg-popover p-3 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
            <DayPicker
              mode="single"
              required
              locale={locale === "ru" ? ru : enUS}
              selected={toDate(date)}
              defaultMonth={toDate(date)}
              captionLayout="dropdown"
              startMonth={new Date(2000, 0)}
              endMonth={new Date(thisYear + 5, 11)}
              onSelect={(d) => d && setDate(toIso(d))}
            />
            <div className="mt-2 flex items-end gap-2 border-t pt-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="occurredTime" className="text-xs text-muted-foreground">
                  {t("time")}
                </Label>
                <Input
                  id="occurredTime"
                  type="time"
                  required
                  value={time}
                  onChange={(e) => e.target.value && setTime(e.target.value)}
                />
              </div>
              <Button type="button" onClick={() => setOpen(false)}>
                {t("done")}
              </Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
