import { describe, expect, it } from 'vitest';
import { addDays, localParts, turkishDate, zonedTime } from '../src/time.ts';

describe('zonedTime', () => {
  it('maps 09:00 Berlin to 07:00 UTC in summer (CEST)', () => {
    expect(zonedTime('2026-07-15', 9, 0).toISOString()).toBe('2026-07-15T07:00:00.000Z');
  });

  it('maps 09:00 Berlin to 08:00 UTC in winter (CET)', () => {
    expect(zonedTime('2026-12-15', 9, 0).toISOString()).toBe('2026-12-15T08:00:00.000Z');
  });

  it('handles the day of the autumn DST switch', () => {
    // 2026-10-25: clocks go back at 03:00, so 09:00 is already CET.
    expect(zonedTime('2026-10-25', 9, 0).toISOString()).toBe('2026-10-25T08:00:00.000Z');
  });
});

describe('localParts', () => {
  it('reports the Berlin calendar date, not the UTC one', () => {
    const p = localParts(new Date('2026-10-04T22:30:00Z'));
    expect(p.isoDate).toBe('2026-10-05');
    expect(p.hour).toBe(0);
  });
});

describe('date helpers', () => {
  it('adds days across month ends', () => {
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
  });

  it('formats Turkish dates', () => {
    expect(turkishDate('2026-10-05')).toEqual({ date: '5 Ekim 2026', weekday: 'Pazartesi' });
  });
});
