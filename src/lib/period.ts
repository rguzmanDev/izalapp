import type { Halves } from "./allocation";

export type Half = 1 | 2;

/** Identifies a "quincena": first half (days 1–15) or second half (16–end) of a month. */
export type PeriodKey = { year: number; month: number; half: Half };

const pad = (value: number) => String(value).padStart(2, "0");

export const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;

/** Today as YYYY-MM-DD in the server time zone (configure it with the TZ env var). */
export function todayIsoDate(now = new Date()): string {
  return toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Narrows a stored period (whose half is a plain number) to a PeriodKey. */
export function toPeriodKey(period: { year: number; month: number; half: number }): PeriodKey {
  return { year: period.year, month: period.month, half: period.half === 1 ? 1 : 2 };
}

export function periodKeyOf(isoDate: string): PeriodKey {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { year, month, half: day <= 15 ? 1 : 2 };
}

export function periodBounds({ year, month, half }: PeriodKey): { start: string; end: string } {
  const lastDay = new Date(year, month, 0).getDate();
  return half === 1
    ? { start: toIsoDate(year, month, 1), end: toIsoDate(year, month, 15) }
    : { start: toIsoDate(year, month, 16), end: toIsoDate(year, month, lastDay) };
}

export function amountForHalf(halves: Halves, half: Half): number {
  return half === 1 ? halves.first : halves.second;
}

const monthFormatter = new Intl.DateTimeFormat("es-MX", { month: "long", timeZone: "UTC" });
const shortDateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function periodLabel({ year, month, half }: PeriodKey): string {
  const monthName = monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
  return `${half}ª quincena de ${monthName} ${year}`;
}

const shortMonthFormatter = new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "UTC" });

/** Compact label for charts, e.g. "1ª oct". */
export function shortPeriodLabel({ month, half }: PeriodKey): string {
  const monthName = shortMonthFormatter.format(new Date(Date.UTC(2000, month - 1, 1)));
  return `${half}ª ${monthName.replace(".", "")}`;
}

export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return shortDateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

export function periodRangeLabel(key: PeriodKey): string {
  const { start, end } = periodBounds(key);
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}
