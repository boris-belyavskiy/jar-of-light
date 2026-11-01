"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { FormState } from "@/app/actions/state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { charCount, ENTRY_MAX_LENGTH } from "@/lib/validation";
import { categoryLabel } from "./category-label";
import { DateTimePill } from "./date-time-pill";

type Option = { id: string; slug: string | null; nameRu: string | null; nameEn: string | null };
type Values = { body: string; occurredOn: string; occurredTime: string; categoryIds: string[] };

// A draft is kept only in this browser tab (sessionStorage) and only while the
// user is away on the categories page, so unsaved text is not lost.
function draftKey(path: string) {
  return `entry-draft:${path}`;
}

function readDraft(path: string): Values | null {
  try {
    const raw = sessionStorage.getItem(draftKey(path));
    sessionStorage.removeItem(draftKey(path));
    return raw ? (JSON.parse(raw) as Values) : null;
  } catch {
    return null;
  }
}

function saveDraft(path: string, form: HTMLFormElement) {
  const data = new FormData(form);
  const values: Values = {
    body: String(data.get("body") ?? ""),
    occurredOn: String(data.get("occurredOn") ?? ""),
    occurredTime: String(data.get("occurredTime") ?? ""),
    categoryIds: data.getAll("categoryIds").map(String),
  };
  try {
    sessionStorage.setItem(draftKey(path), JSON.stringify(values));
  } catch {
    // Storage may be unavailable (private mode); the link still works.
  }
}

/**
 * Writing or editing an entry, shown in place of the feed: the composer bar
 * "expands" into this card (ADR-0005). `href` is this form's own address,
 * `closeHref` where cancel and saving lead back to.
 */
export function EntryForm({
  action,
  categories,
  initial,
  href,
  closeHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  categories: Option[];
  initial: Values;
  href: string;
  closeHref: string;
}) {
  const t = useTranslations("entry");
  const tc = useTranslations("categories");
  const tAll = useTranslations();
  const locale = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(action, {});
  const [values, setValues] = useState(initial);
  const [version, setVersion] = useState(0);
  const [body, setBody] = useState(initial.body);
  const count = charCount(body);
  const tooLong = count > ENTRY_MAX_LENGTH;

  useEffect(() => {
    const draft = readDraft(href);
    if (!draft) return;
    // Restoring browser-only state after hydration; the server cannot know it.
    /* eslint-disable react-hooks/set-state-in-effect */
    setValues(draft);
    setBody(draft.body);
    setVersion((v) => v + 1); // remount the uncontrolled inputs with the draft values
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [href]);

  return (
    <form
      ref={formRef}
      key={version}
      action={formAction}
      className="flex min-h-full flex-col gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border dark:shadow-none"
    >
      <input type="hidden" name="returnTo" value={closeHref} />
      <div className="flex items-center justify-between gap-3">
        <DateTimePill date={values.occurredOn} time={values.occurredTime} />
        <Link
          href={closeHref}
          aria-label={t("cancel")}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-sky hover:text-foreground"
        >
          <X className="size-5" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="body" className="sr-only">
          {t("bodyLabel")}
        </label>
        <Textarea
          id="body"
          name="body"
          required
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("bodyPlaceholder")}
          aria-describedby="body-counter"
          aria-invalid={tooLong || undefined}
          className="min-h-48 flex-1 resize-none border-0 bg-transparent px-0 font-serif text-[1.0625rem] leading-[1.6] shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <p
          id="body-counter"
          aria-live="polite"
          className={`self-end text-xs ${tooLong ? "text-destructive" : "text-muted-foreground"}`}
        >
          {t("counter", { count: count.toLocaleString(), max: ENTRY_MAX_LENGTH.toLocaleString() })}
        </p>
      </div>

      <fieldset className="flex flex-col gap-2 border-t pt-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <legend className="text-sm font-medium">{t("categories")}</legend>
          <Link
            href={`/app/categories?back=${encodeURIComponent(href)}`}
            onClick={() => formRef.current && saveDraft(href, formRef.current)}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {t("editCategories")}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <label key={c.id} className="cursor-pointer">
              <input
                type="checkbox"
                name="categoryIds"
                value={c.id}
                defaultChecked={values.categoryIds.includes(c.id)}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full bg-background px-3.5 py-1.5 text-sm ring-1 ring-border transition-colors peer-checked:bg-sky peer-checked:ring-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                {categoryLabel(c, tc, locale)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {tAll(state.error)}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending || tooLong} className="flex-1 sm:flex-none">
          {pending ? t("saving") : t("save")}
        </Button>
        <Link href={closeHref} className={buttonVariants({ variant: "outline" })}>
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
