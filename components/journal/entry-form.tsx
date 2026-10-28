"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { FormState } from "@/app/actions/state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { charCount, ENTRY_MAX_LENGTH } from "@/lib/validation";
import { categoryLabel } from "./category-label";

type Option = { id: string; slug: string | null; name: string | null };
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

export function EntryForm({
  action,
  categories,
  initial,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  categories: Option[];
  initial: Values;
}) {
  const t = useTranslations("entry");
  const tc = useTranslations("categories");
  const tAll = useTranslations();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(action, {});
  const [values, setValues] = useState(initial);
  const [version, setVersion] = useState(0);
  const [body, setBody] = useState(initial.body);
  const count = charCount(body);
  const tooLong = count > ENTRY_MAX_LENGTH;

  useEffect(() => {
    const draft = readDraft(pathname);
    if (!draft) return;
    // Restoring browser-only state after hydration; the server cannot know it.
    /* eslint-disable react-hooks/set-state-in-effect */
    setValues(draft);
    setBody(draft.body);
    setVersion((v) => v + 1); // remount the uncontrolled inputs with the draft values
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pathname]);

  return (
    <form ref={formRef} key={version} action={formAction} className="flex flex-col gap-5">
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
          <Input id="occurredOn" name="occurredOn" type="date" required defaultValue={values.occurredOn} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="occurredTime">{t("time")}</Label>
          <Input id="occurredTime" name="occurredTime" type="time" required defaultValue={values.occurredTime} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <legend className="text-sm font-medium">{t("categories")}</legend>
          <Link
            href={`/app/categories?back=${encodeURIComponent(pathname)}`}
            onClick={() => formRef.current && saveDraft(pathname, formRef.current)}
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
              <span className="inline-block rounded-full bg-card px-3.5 py-1.5 text-sm ring-1 ring-border transition-colors peer-checked:bg-sky peer-checked:ring-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                {categoryLabel(c, tc)}
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
        <Link href="/app" className={buttonVariants({ variant: "outline" })}>
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
