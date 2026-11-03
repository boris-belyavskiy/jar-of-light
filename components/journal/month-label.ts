/** A "YYYY-MM" month as the user reads it, e.g. "октябрь 2026 г." or "October 2026". */
export function monthLabel(month: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${month}-01T00:00:00Z`),
  );
}
