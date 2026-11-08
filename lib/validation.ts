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

/** The text of an entry: trimmed, 1 to 4,000 characters. Checked on the device for encrypted accounts. */
export const entryBody = z
  .string()
  .trim()
  .min(1, "entry.errors.empty")
  .refine((s) => charCount(s) <= ENTRY_MAX_LENGTH, "entry.errors.tooLong");

/** What an entry has besides its text: this stays readable by the server in every account. */
export const entryMetaSchema = z.object({
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "entry.errors.date"),
  occurredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "entry.errors.time"),
  categoryIds: z.array(z.uuid()).max(20),
});

export const entrySchema = entryMetaSchema.extend({ body: entryBody });
export type EntryInput = z.infer<typeof entrySchema>;

/** A value encrypted on the device (lib/crypto): `v1.` and base64url, up to `max` characters. */
const sealed = (max: number) => z.string().min(16).max(max).regex(/^v1\.[A-Za-z0-9_-]+$/, "encryption.errors.generic");
const optionalSealed = (max: number) => z.preprocess((v) => (v === "" || v === null ? undefined : v), sealed(max).optional());

/** An entry from an encrypted account: the text arrives as ciphertext, with the row id it is bound to. */
export const encryptedEntrySchema = entryMetaSchema.extend({
  entryId: z.uuid("encryption.errors.generic"),
  bodyCipher: sealed(24_000),
});

/** An own category's names from an encrypted account; at least one, as for plaintext (CAT-02). */
export const encryptedCategoryNamesSchema = z
  .object({ nameRuCipher: optionalSealed(512), nameEnCipher: optionalSealed(512) })
  .refine((n) => n.nameRuCipher || n.nameEnCipher, "categories.errors.empty");

/** The same for a built-in category, where both empty means "back to the built-in name". */
export const encryptedSystemNamesSchema = z.object({ nameRuCipher: optionalSealed(512), nameEnCipher: optionalSealed(512) });

const categoryName = z
  .string()
  .trim()
  .refine((s) => charCount(s) <= CATEGORY_NAME_MAX_LENGTH, "categories.errors.tooLong")
  .transform((s) => s || null);

/** A category's names in Russian and English: either may be empty, not both (CAT-02). */
export const categoryNamesSchema = z
  .object({ nameRu: categoryName, nameEn: categoryName })
  .refine((n) => n.nameRu || n.nameEn, "categories.errors.empty");

/** The same for a built-in category, where both empty means "back to the built-in name". */
export const systemCategoryNamesSchema = z.object({ nameRu: categoryName, nameEn: categoryName });

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .refine((s) => charCount(s) <= DISPLAY_NAME_MAX_LENGTH, "settings.errors.nameTooLong"),
  locale: z.enum(locales),
  timezone: z.string().refine(isValidTimeZone, "settings.errors.timezone"),
});
