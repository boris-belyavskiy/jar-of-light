import { z } from "zod";
import { locales } from "@/i18n/config";
import { isValidTimeZone } from "@/lib/time";

export const ENTRY_MAX_LENGTH = 4000;
export const CATEGORY_NAME_MAX_LENGTH = 40;
export const DISPLAY_NAME_MAX_LENGTH = 80;

/** Counts characters the way Postgres `char_length` does (code points, so an emoji is 1). */
export function charCount(value: string) {
  return Array.from(value).length;
}

export const entrySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "entry.errors.empty")
    .refine((s) => charCount(s) <= ENTRY_MAX_LENGTH, "entry.errors.tooLong"),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "entry.errors.date"),
  occurredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "entry.errors.time"),
  categoryIds: z.array(z.uuid()).max(20),
});
export type EntryInput = z.infer<typeof entrySchema>;

export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, "categories.errors.empty")
  .refine((s) => charCount(s) <= CATEGORY_NAME_MAX_LENGTH, "categories.errors.tooLong");

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .refine((s) => charCount(s) <= DISPLAY_NAME_MAX_LENGTH, "settings.errors.nameTooLong"),
  locale: z.enum(locales),
  timezone: z.string().refine(isValidTimeZone, "settings.errors.timezone"),
});
