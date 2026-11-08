import { categoryNamesSchema, entryBody, systemCategoryNamesSchema } from "@/lib/validation";

/**
 * What a form does on the device before it sends anything, for an account with
 * keys (ADR-0011): check the rules the server can no longer check, because it
 * cannot read the text, then encrypt. Pure functions that take the encrypting
 * function as an argument, so they can be tested without a browser.
 */

/** Which way a write goes, from the key state of this device and the account. */
export type WriteMode =
  | "plain" // no keys: save readable text, as before
  | "encrypted" // keys and this device has the key: encrypt, then save
  | "locked" // keys, but this device has no key: ask for the password first
  | "setup" // a new account: set up encryption before the first entry
  | "wait"; // still reading the device's storage

export function writeMode(status: "loading" | "off" | "locked" | "unlocked", needsSetup: boolean): WriteMode {
  switch (status) {
    case "loading":
      return "wait";
    case "locked":
      return "locked";
    case "unlocked":
      return "encrypted";
    case "off":
      return needsSetup ? "setup" : "plain";
  }
}

type Encrypt = (place: { table: "entries" | "categories" | "category_names"; rowId: string; field: string }, text: string) => Promise<string>;

export type Sealed<T> = ({ ok: true } & T) | { ok: false; error: string };

/** The entry text, checked against the same rules as on the server (1 to 4,000 characters), then encrypted. */
export async function sealEntryBody(encrypt: Encrypt, entryId: string, body: string): Promise<Sealed<{ cipher: string }>> {
  const parsed = entryBody.safeParse(body);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "entry.errors.save" };
  return { ok: true, cipher: await encrypt({ table: "entries", rowId: entryId, field: "body" }, parsed.data) };
}

type Names = { ru: string; en: string };
type SealedNames = { ru: string | null; en: string | null };

/**
 * A category's names, checked and encrypted. `table` and `categoryId` say where
 * they are stored: an own category (`categories`) or a built-in one renamed by
 * this user (`category_names`, keyed by the built-in category's id). For own
 * categories `others` lists the other categories' names, because the database
 * can no longer enforce "no two with the same name" over ciphertext.
 */
export async function sealCategoryNames(
  encrypt: Encrypt,
  args: {
    table: "categories" | "category_names";
    categoryId: string;
    names: Names;
    /** Own categories only: the names of the user's other own categories, readable on this device. */
    others?: { ru: string | null; en: string | null }[];
  },
): Promise<Sealed<SealedNames>> {
  const { table, categoryId, names, others = [] } = args;
  // A built-in category may be reset by leaving both empty; an own one needs at least one name.
  const parsed = (table === "categories" ? categoryNamesSchema : systemCategoryNamesSchema).safeParse({ nameRu: names.ru, nameEn: names.en });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "categories.errors.save" };
  const { nameRu, nameEn } = parsed.data;

  if (table === "categories") {
    const taken = (value: string | null, key: "ru" | "en") =>
      value !== null && others.some((o) => o[key]?.trim().toLowerCase() === value.toLowerCase());
    if (taken(nameRu, "ru") || taken(nameEn, "en")) return { ok: false, error: "categories.errors.duplicate" };
  }

  const seal = (field: "name_ru" | "name_en", value: string | null) =>
    value === null ? Promise.resolve(null) : encrypt({ table, rowId: categoryId, field }, value);
  return { ok: true, ru: await seal("name_ru", nameRu), en: await seal("name_en", nameEn) };
}
