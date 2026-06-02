// Unified date utility — all business dates in Asia/Shanghai (UTC+8)
// DB stores @db.Date (UTC midnight). Range queries use UTC Date objects.

const TIMEZONE = "Asia/Shanghai";

/** Get today's date string in China timezone (YYYY-MM-DD) */
export function getChinaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Get UTC query range for a China date string */
export function getChinaDayRange(dateStr: string): { gte: Date; lte: Date } {
  return {
    gte: new Date(dateStr),
    lte: new Date(dateStr + "T23:59:59.999Z"),
  };
}

/** Get UTC query range for the week (Mon–Sun) containing a China date */
export function getChinaWeekRange(dateStr: string): { gte: Date; lte: Date } {
  const d = new Date(dateStr);
  const dayOfWeek = d.getUTCDay(); // 0=Sun, 1=Mon
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    gte: new Date(monday.toISOString().slice(0, 10)),
    lte: new Date(sunday.toISOString().slice(0, 10) + "T23:59:59.999Z"),
  };
}

/** Get UTC query range for the month containing a China date */
export function getChinaMonthRange(dateStr: string): { gte: Date; lte: Date } {
  const [year, month] = dateStr.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));

  return {
    gte: firstDay,
    lte: new Date(lastDay.toISOString().slice(0, 10) + "T23:59:59.999Z"),
  };
}

/** Get the China date string N days before a given China date */
export function getChinaDaysAgo(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Get UTC query range from start to end China date strings */
export function getChinaDateRange(startDateStr: string, endDateStr: string): { gte: Date; lte: Date } {
  return {
    gte: new Date(startDateStr),
    lte: new Date(endDateStr + "T23:59:59.999Z"),
  };
}

/** Get Monday date string for the week containing a given China date */
export function getChinaMonday(dateStr: string): string {
  const d = new Date(dateStr);
  const dayOfWeek = d.getUTCDay();
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

/** Format a Date object (UTC midnight) to a China date label like "6/2" */
export function formatChinaShortDate(date: Date): string {
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}
