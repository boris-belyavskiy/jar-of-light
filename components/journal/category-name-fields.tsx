"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { detectScript } from "@/lib/script";
import { CATEGORY_NAME_MAX_LENGTH } from "@/lib/validation";

type Lang = "ru" | "en";

/**
 * A category's names in Russian and English; either may stay empty. Text typed
 * in the other alphabet moves to its own field as you type (Latin into the
 * Russian field goes to English, and back), as long as that field is empty.
 */
export function CategoryNameFields({
  idPrefix,
  defaultRu = "",
  defaultEn = "",
  placeholderRu,
  placeholderEn,
  autoFocus,
}: {
  idPrefix: string;
  defaultRu?: string;
  defaultEn?: string;
  placeholderRu?: string;
  placeholderEn?: string;
  autoFocus?: boolean;
}) {
  const t = useTranslations("categories");
  const [values, setValues] = useState<Record<Lang, string>>({ ru: defaultRu, en: defaultEn });
  const refs = { ru: useRef<HTMLInputElement>(null), en: useRef<HTMLInputElement>(null) };

  function change(lang: Lang, value: string) {
    const other: Lang = lang === "ru" ? "en" : "ru";
    if (detectScript(value) === other && values[other] === "") {
      setValues({ [lang]: "", [other]: value } as Record<Lang, string>);
      // Keep typing in the field the text moved to.
      requestAnimationFrame(() => {
        const input = refs[other].current;
        input?.focus();
        input?.setSelectionRange(value.length, value.length);
      });
      return;
    }
    setValues((v) => ({ ...v, [lang]: value }));
  }

  const field = (lang: Lang, placeholder: string | undefined, focus: boolean) => (
    <div className="flex flex-1 flex-col gap-1">
      <Label htmlFor={`${idPrefix}-${lang}`} className="text-xs text-muted-foreground">
        {t(lang === "ru" ? "nameRu" : "nameEn")}
      </Label>
      <Input
        ref={refs[lang]}
        id={`${idPrefix}-${lang}`}
        name={lang === "ru" ? "nameRu" : "nameEn"}
        lang={lang}
        value={values[lang]}
        onChange={(e) => change(lang, e.target.value)}
        maxLength={CATEGORY_NAME_MAX_LENGTH}
        placeholder={placeholder}
        autoFocus={focus}
        className="bg-card"
      />
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-2 sm:flex-row">
      {field("en", placeholderEn, Boolean(autoFocus))}
      {field("ru", placeholderRu, false)}
    </div>
  );
}
