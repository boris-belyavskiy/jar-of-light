"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The feed filters. Wide screens always show them in the side column; on a
 * phone they fold under their title so the entries keep most of the screen —
 * the same filters, only folded (ADR-0005).
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
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2 text-left md:pointer-events-none"
        >
          {title}
          {active && <span aria-hidden="true" className="size-2 rounded-full bg-primary md:hidden" />}
          <ChevronDown
            aria-hidden="true"
            className={cn("ml-auto size-4 text-muted-foreground transition-transform md:hidden", open && "rotate-180")}
          />
        </button>
      </h2>
      <div className={cn("md:block", open ? "block" : "hidden")}>{children}</div>
    </div>
  );
}
