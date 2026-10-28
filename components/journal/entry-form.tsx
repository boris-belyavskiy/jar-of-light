"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { FormState } from "@/app/actions/state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { charCount, ENTRY_MAX_LENGTH } from "@/lib/validation";
import { categoryLabel } from "./category-label";

type Option = { id: string; slug: string | null; name: string | null };

export function EntryForm({
  action,
  categories,
  initial,
  today,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  categories: Option[];
  initial: { body: string; occurredOn: string; occurredTime: string; categoryIds: string[] };
  /** "Today" in the user's time zone: the latest date the picker allows. */
  today: string;
}) {
  const t = useTranslations("entry");
  const tc = useTranslations("categories");
  const tAll = useTranslations();
  const [state, formAction, pending] = useActionState(action, {});
  const [body, setBody] = useState(initial.body);
  const count = charCount(body);
  const tooLong = count > ENTRY_MAX_LENGTH;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="body">{t("bodyLabel")}</Label>
        <Textarea
          id="body"
          name="body"
          required
          autoFocus
          rows={7}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("bodyPlaceholder")}
          aria-describedby="body-counter"
          aria-invalid={tooLong || undefined}
          className="min-h-40 bg-card font-serif text-[1.0625rem] leading-[1.6]"
        />
        <p
          id="body-counter"
          aria-live="polite"
          className={`self-end text-xs ${tooLong ? "text-destructive" : "text-muted-foreground"}`}
        >
          {t("counter", { count: count.toLocaleString(), max: ENTRY_MAX_LENGTH.toLocaleString() })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="occurredOn">{t("date")}</Label>
          <Input id="occurredOn" name="occurredOn" type="date" required max={today} defaultValue={initial.occurredOn} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="occurredTime">{t("time")}</Label>
          <Input id="occurredTime" name="occurredTime" type="time" required defaultValue={initial.occurredTime} />
        </div>
      </div>

      {categories.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{t("categories")}</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <label key={c.id} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={c.id}
                  defaultChecked={initial.categoryIds.includes(c.id)}
                  className="peer sr-only"
                />
                <span className="inline-block rounded-full bg-card px-3.5 py-1.5 text-sm ring-1 ring-border transition-colors peer-checked:bg-sky peer-checked:ring-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                  {categoryLabel(c, tc)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {tAll(state.error)}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending || tooLong} className="flex-1 sm:flex-none">
          {pending ? t("saving") : t("save")}
        </Button>
        <Link href="/app" className={buttonVariants({ variant: "outline" })}>
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
