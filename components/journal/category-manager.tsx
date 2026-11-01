"use client";

import { useActionState, useEffect, useOptimistic, useState, useTransition } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  renameSystemCategory,
  reorderCategories,
  setCategoryHidden,
} from "@/app/actions/categories";
import type { FormState } from "@/app/actions/state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { Category } from "@/lib/db/queries";
import { cn } from "@/lib/utils";
import { categoryLabel } from "./category-label";
import { CategoryNameFields } from "./category-name-fields";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const t = useTranslations("categories");
  const locale = useLocale();
  const byId = new Map(categories.map((c) => [c.id, c]));
  // The new order shows at once; the server copy replaces it after saving.
  const [order, setOrder] = useOptimistic(categories.map((c) => c.id));
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    // A click on a button inside a row stays a click: dragging starts after a short move.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // On touch screens a short press picks a row up, so the page still scrolls.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const name = (id: string | number) => {
    const c = byId.get(String(id));
    return c ? categoryLabel(c, t, locale) : "";
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const next = arrayMove(order, order.indexOf(String(active.id)), order.indexOf(String(over.id)));
    startTransition(async () => {
      setOrder(next);
      await reorderCategories(next);
    });
  }

  return (
    <section>
      <p className="text-sm text-muted-foreground">{t("orderHint")}</p>
      <CreateForm />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{
          screenReaderInstructions: { draggable: t("dragInstructions") },
          announcements: {
            onDragStart: ({ active }) => t("dragStart", { name: name(active.id) }),
            onDragOver: ({ active, over }) =>
              over ? t("dragOver", { name: name(active.id), position: order.indexOf(String(over.id)) + 1 }) : undefined,
            onDragEnd: ({ active, over }) =>
              over ? t("dragEnd", { name: name(active.id), position: order.indexOf(String(over.id)) + 1 }) : undefined,
            onDragCancel: ({ active }) => t("dragCancel", { name: name(active.id) }),
          },
        }}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ul className="mt-4 flex flex-col divide-y rounded-2xl bg-card ring-1 ring-border">
            {order.map((id) => {
              const c = byId.get(id);
              return c ? <SortableRow key={id} category={c} /> : null;
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}

/** The whole row can be dragged with the mouse or a finger; the keyboard picks it up from the row itself. */
function SortableRow({ category }: { category: Category }) {
  const t = useTranslations("categories");
  const locale = useLocale();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });
  const { onKeyDown, ...pointerListeners } = listeners ?? {};

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      aria-label={categoryLabel(category, t, locale)}
      {...pointerListeners}
      // Space and Enter on a button inside the row press the button, not pick the row up.
      onKeyDown={(e) => {
        if (e.target === e.currentTarget) onKeyDown?.(e);
      }}
      className={cn(
        "relative flex cursor-grab touch-manipulation items-center gap-1 bg-card py-1.5 pr-2 pl-1 outline-none select-none first:rounded-t-2xl last:rounded-b-2xl focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "z-10 cursor-grabbing rounded-xl shadow-lg ring-1 ring-primary/40",
      )}
    >
      <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <CategoryRow category={category} />
    </li>
  );
}

/** One category: its name (and the other language's under it), then rename and hide or delete. */
function CategoryRow({ category }: { category: Category }) {
  const t = useTranslations("categories");
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const rename = category.isSystem ? renameSystemCategory : renameCategory;
  const [state, action, saving] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await rename(category.id, prev, formData);
    if (result.ok) setEditing(false);
    return result;
  }, {});

  if (editing) {
    // Built-in categories show their own name as a hint; saving both empty brings it back.
    const builtIn = category.slug ? t(`system.${category.slug}`) : undefined;
    return (
      <div className="flex-1 py-1.5 pl-2">
        <form
          action={action}
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <CategoryNameFields
            idPrefix={`rename-${category.id}`}
            defaultRu={category.nameRu ?? ""}
            defaultEn={category.nameEn ?? ""}
            placeholderRu={locale === "ru" ? builtIn : undefined}
            placeholderEn={locale === "en" ? builtIn : undefined}
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {t("save")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
        {category.isSystem && <p className="mt-1 text-xs text-muted-foreground">{t("renameBuiltInHint")}</p>}
        <ErrorText state={state} />
      </div>
    );
  }

  const name = categoryLabel(category, t, locale);
  const other = locale === "ru" ? category.nameEn : category.nameRu;
  return (
    <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 pl-2">
      <span className="flex min-w-0 flex-col">
        <span className={cn("break-words", category.hidden && "text-muted-foreground line-through")}>{name}</span>
        {other && other !== name && <span className="text-xs text-muted-foreground">{other}</span>}
      </span>
      {category.isSystem && (
        <span className="text-xs text-muted-foreground">{category.hidden ? t("hidden") : t("builtIn")}</span>
      )}
      <div className="ml-auto flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
          {t("rename")}
        </Button>
        {category.isSystem ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => setCategoryHidden(category.id, !category.hidden))}
          >
            {category.hidden ? t("show") : t("hide")}
          </Button>
        ) : (
          <ConfirmDialog
            trigger={t("delete")}
            triggerVariant="ghost"
            triggerSize="sm"
            title={t("deleteTitle", { name })}
            description={t("deleteBody")}
            confirmLabel={t("deleteConfirm")}
            cancelLabel={t("cancel")}
            onConfirm={() => deleteCategory(category.id)}
          />
        )}
      </div>
    </div>
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
  // A new key after each save empties the fields.
  const [round, setRound] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.ok) setRound((r) => r + 1);
  }, [state]);

  return (
    <form action={action} className="mt-4 rounded-2xl bg-card p-3 ring-1 ring-border">
      <p className="mb-2 text-sm font-medium">{t("newTitle")}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <CategoryNameFields key={round} idPrefix="new-category" />
        <Button type="submit" disabled={pending}>
          {t("add")}
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("namesHint")}</p>
      <ErrorText state={state} />
    </form>
  );
}
