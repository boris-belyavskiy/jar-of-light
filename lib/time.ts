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

/**
 * True when a local date and time is later than "now" in the user's time zone.
 * One minute of slack matches the database trigger `entries_reject_future`.
 */
export function isInFuture(date: string, time: string, timeZone: string, now: Date = new Date()) {
  const limit = nowInTimeZone(timeZone, new Date(now.getTime() + 60_000));
  return `${date}T${time.slice(0, 5)}` > `${limit.date}T${limit.time}`;
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
