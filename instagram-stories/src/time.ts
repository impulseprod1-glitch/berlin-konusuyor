import { config } from './config.ts';

/**
 * GitHub cron runs in UTC, the audience lives in Berlin. All scheduling
 * decisions go through these helpers so DST is handled in one place.
 */

export interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** YYYY-MM-DD in the target time zone – the edition key. */
  isoDate: string;
}

export function localParts(date: Date, timeZone: string = config.timeZone): LocalParts {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  const parts = {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  };
  return { ...parts, isoDate: `${p.year}-${p.month}-${p.day}` };
}

function offsetMs(date: Date, timeZone: string): number {
  const p = localParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** The UTC instant at which the wall clock in `timeZone` shows isoDate hour:minute. */
export function zonedTime(isoDate: string, hour: number, minute: number, timeZone: string = config.timeZone): Date {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  // Second pass corrects the offset when the first guess lands across a DST switch.
  const first = guess - offsetMs(new Date(guess), timeZone);
  return new Date(guess - offsetMs(new Date(first), timeZone));
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** "5 Ekim 2026" and "Pazartesi" for the slides. */
export function turkishDate(isoDate: string): { date: string; weekday: string } {
  // Noon UTC keeps the calendar day stable in any European time zone.
  const noon = new Date(`${isoDate}T12:00:00Z`);
  const date = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(noon);
  const weekday = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', timeZone: 'UTC' }).format(noon);
  return { date, weekday };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
