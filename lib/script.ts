/**
 * Which alphabet a category name is written in: "ru" for Cyrillic, "en" for
 * Latin, null for mixed text, digits or emoji only. Used to move a name typed
 * into the wrong language field over to the right one.
 */
export function detectScript(text: string): "ru" | "en" | null {
  const cyrillic = /[\p{Script=Cyrillic}]/u.test(text);
  const latin = /[\p{Script=Latin}]/u.test(text);
  if (cyrillic && !latin) return "ru";
  if (latin && !cyrillic) return "en";
  return null;
}
