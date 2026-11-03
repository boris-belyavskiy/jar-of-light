"use client";

import { useOptimistic, useTransition } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { setStar } from "@/app/actions/entries";
import { cn } from "@/lib/utils";

/** The star in an entry's top-right corner, beside the "⋯" menu. It lights up at once and saves in the background. */
export function StarButton({ id, starred }: { id: string; starred: boolean }) {
  const t = useTranslations("entry");
  const [optimistic, setOptimistic] = useOptimistic(starred);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? t("removeStar") : t("addStar")}
      title={optimistic ? t("removeStar") : t("addStar")}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await setStar(id, !optimistic);
        })
      }
      className="relative z-10 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-sky hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Star className={cn("size-5", optimistic && "fill-light stroke-foreground/50")} aria-hidden="true" />
    </button>
  );
}
