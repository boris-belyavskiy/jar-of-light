import { fromUtf8, utf8 } from "./encoding";
import { aad, open, seal } from "./seal";

/**
 * Where an encrypted value lives. It goes into the AAD, so a ciphertext copied
 * to another row, field, table or user fails to decrypt (ADR-0011): the server
 * cannot shuffle a user's entries or swap one user's text into another's row.
 * The device therefore makes the row id before encrypting.
 */
export type FieldContext = {
  userId: string;
  table: "entries" | "categories" | "category_names";
  /** The row's id; for `category_names`, the id of the category it renames. */
  rowId: string;
  /** The column's plaintext name, for example `body` or `name_ru`. */
  field: string;
};

const fieldAad = (c: FieldContext) => aad("field", c.userId, c.table, c.rowId, c.field);

export function encryptField(dataKey: CryptoKey, plaintext: string, context: FieldContext): Promise<string> {
  return seal(dataKey, utf8(plaintext), fieldAad(context));
}

export async function decryptField(dataKey: CryptoKey, sealed: string, context: FieldContext): Promise<string> {
  return fromUtf8(await open(dataKey, sealed, fieldAad(context)));
}
