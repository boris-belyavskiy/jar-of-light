/** Local date "YYYY-MM-DD" and time "HH:MM" in an IANA time zone. */
export function nowInTimeZone(timeZone: string, now: Date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export const FALLBACK_TIME_ZONE = "UTC";

/** A "YYYY-MM-DD" date as the user reads it: MM-DD-YYYY in English, DD.MM.YYYY in Russian. */
export function displayDate(iso: string, locale: string) {
  const [year, month, day] = iso.split("-");
  return locale === "en" ? `${month}-${day}-${year}` : `${day}.${month}.${year}`;
}

/** An entry's local date and time as shown on its pill, e.g. "23 октября 2026 г. · 21:00". */
export function entryDateLabel(date: string, time: string, locale: string) {
  // The date is the user's local date: format it as-is, without shifting zones.
  const day = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
  return `${day} · ${time}`;
}

/** A time zone's offset from UTC at `now`, in minutes (Moscow: 180; New York in winter: −300). */
export function utcOffsetMinutes(timeZone: string, now: Date = new Date()) {
  const name =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}

/** "UTC+03:00" — written with UTC, which is what GMT means on clocks too. */
export function formatUtcOffset(minutes: number) {
  const sign = minutes < 0 ? "−" : "+";
  const abs = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

/** Time zones for a picker, west to east, labelled "(UTC+03:00) Europe/Moscow"; offsets as of `now` (DST-aware). */
export function timeZoneOptions(zones: string[], now: Date = new Date()) {
  return zones
    .map((zone) => ({ zone, offset: utcOffsetMinutes(zone, now) }))
    .sort((a, b) => a.offset - b.offset || a.zone.localeCompare(b.zone))
    .map(({ zone, offset }) => ({ value: zone, label: `(${formatUtcOffset(offset)}) ${zone.replaceAll("_", " ")}` }));
}
