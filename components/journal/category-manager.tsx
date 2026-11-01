"use client";

import { useActionState, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
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
import { useTranslations } from "next-intl";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  reorderCategories,
  setCategoryHidden,
} from "@/app/actions/categories";
import type { FormState } from "@/app/actions/state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/db/queries";
import { cn } from "@/lib/utils";
import { CATEGORY_NAME_MAX_LENGTH } from "@/lib/validation";
import { categoryLabel } from "./category-label";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const t = useTranslations("categories");
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
    return c ? categoryLabel(c, t) : "";
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });
  const { onKeyDown, ...pointerListeners } = listeners ?? {};

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      aria-label={categoryLabel(category, t)}
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
      {category.isSystem ? <SystemRow category={category} /> : <OwnRow category={category} />}
    </li>
  );
}

function SystemRow({ category }: { category: Category }) {
  const t = useTranslations("categories");
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 pl-2">
      <span className={category.hidden ? "text-muted-foreground line-through" : undefined}>
        {categoryLabel(category, t)}
      </span>
      <span className="text-xs text-muted-foreground">{category.hidden ? t("hidden") : t("builtIn")}</span>
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
      <div className="flex-1 py-1.5 pl-2">
        <form
          action={action}
          className="flex gap-2"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
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
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-1 pl-2">
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
    </div>
  );
}
