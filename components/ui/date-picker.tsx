"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DayPicker } from "react-day-picker";
import { enUS, ru } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";
import { displayDate } from "@/lib/time";

function toDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * A date field that shows the date in the interface language (MM-DD-YYYY in
 * English, DD.MM.YYYY in Russian) whatever the browser's own locale is — the
 * native <input type="date"> follows the browser instead. The form receives
 * "YYYY-MM-DD" from a hidden input named `name`.
 */
export function DatePicker({
  id,
  name,
  defaultValue = "",
  clearable = false,
  className,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  clearable?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("datePicker");
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const selected = value ? toDate(value) : undefined;
  const thisYear = new Date().getFullYear();

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <input type="hidden" name={name} value={value} />
      <Popover.Trigger
        id={id}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-2.5 text-left text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
          !value && "text-muted-foreground",
          className,
        )}
      >
        {value ? displayDate(value, locale) : t("placeholder")}
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start" className="z-50">
          <Popover.Popup className="date-picker rounded-xl bg-popover p-3 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
            <DayPicker
              mode="single"
              locale={locale === "ru" ? ru : enUS}
              selected={selected}
              defaultMonth={selected}
              captionLayout="dropdown"
              startMonth={new Date(2000, 0)}
              endMonth={new Date(thisYear + 5, 11)}
              onSelect={(date) => {
                if (date) setValue(toIso(date));
                setOpen(false);
              }}
            />
            {clearable && value && (
              <button
                type="button"
                className="mt-1 text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setValue("");
                  setOpen(false);
                }}
              >
                {t("clear")}
              </button>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
