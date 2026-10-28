"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createCategory, deleteCategory, renameCategory, setCategoryHidden } from "@/app/actions/categories";
import type { FormState } from "@/app/actions/state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/db/queries";
import { CATEGORY_NAME_MAX_LENGTH } from "@/lib/validation";
import { categoryLabel } from "./category-label";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const t = useTranslations("categories");
  const system = categories.filter((c) => c.isSystem);
  const own = categories.filter((c) => !c.isSystem);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="font-heading text-xl font-semibold">{t("systemTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("systemHint")}</p>
        <ul className="mt-4 flex flex-col divide-y rounded-2xl bg-card ring-1 ring-border">
          {system.map((c) => (
            <SystemRow key={c.id} category={c} />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold">{t("ownTitle")}</h2>
        <CreateForm />
        {own.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("ownEmpty")}</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y rounded-2xl bg-card ring-1 ring-border">
            {own.map((c) => (
              <OwnRow key={c.id} category={c} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SystemRow({ category }: { category: Category }) {
  const t = useTranslations("categories");
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className={category.hidden ? "text-muted-foreground line-through" : undefined}>
        {categoryLabel(category, t)}
      </span>
      {category.hidden && <span className="text-xs text-muted-foreground">{t("hidden")}</span>}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-auto"
        disabled={pending}
        onClick={() => startTransition(() => setCategoryHidden(category.id, !category.hidden))}
      >
        {category.hidden ? t("show") : t("hide")}
      </Button>
    </li>
  );
}

function ErrorText({ state }: { state: FormState }) {
  const t = useTranslations();
  return state.error ? (
    <p role="alert" className="mt-2 text-sm text-destructive">
      {t(state.error)}
    </p>
  ) : null;
}

function CreateForm() {
  const t = useTranslations("categories");
  const [state, action, pending] = useActionState(createCategory, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-4">
      <div className="flex gap-2">
        <Input
          name="name"
          required
          maxLength={CATEGORY_NAME_MAX_LENGTH}
          placeholder={t("newPlaceholder")}
          aria-label={t("newPlaceholder")}
          className="bg-card"
        />
        <Button type="submit" disabled={pending}>
          {t("add")}
        </Button>
      </div>
      <ErrorText state={state} />
    </form>
  );
}

function OwnRow({ category }: { category: Category }) {
  const t = useTranslations("categories");
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await renameCategory(category.id, prev, formData);
    if (result.ok) setEditing(false);
    return result;
  }, {});

  if (editing) {
    return (
      <li className="px-4 py-3">
        <form action={action} className="flex gap-2">
          <Input
            name="name"
            required
            autoFocus
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            defaultValue={category.name ?? ""}
            aria-label={t("rename")}
          />
          <Button type="submit" size="sm" disabled={pending}>
            {t("save")}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            {t("cancel")}
          </Button>
        </form>
        <ErrorText state={state} />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-1 px-4 py-3">
      <span className="mr-auto break-all">{category.name}</span>
      <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
        {t("rename")}
      </Button>
      <ConfirmDialog
        trigger={t("delete")}
        triggerVariant="ghost"
        triggerSize="sm"
        title={t("deleteTitle", { name: category.name ?? "" })}
        description={t("deleteBody")}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("cancel")}
        onConfirm={() => deleteCategory(category.id)}
      />
    </li>
  );
}
