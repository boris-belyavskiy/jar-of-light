"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The feed filters on a phone: folded under their title inside the sticky
 * head, so the entries keep most of the screen — the same filters as the
 * side column on wider screens, only folded (ADR-0004).
 */
export function FilterPanel({
  title,
  active,
  children,
}: {
  title: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <h2 className="text-sm font-semibold">
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-left">
          {title}
          {active && <span aria-hidden="true" className="size-2 rounded-full bg-primary" />}
          <ChevronDown
            aria-hidden="true"
            className={cn("ml-auto size-4 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </button>
      </h2>
      {open && <div className="max-h-[50dvh] overflow-y-auto">{children}</div>}
    </div>
  );
}
