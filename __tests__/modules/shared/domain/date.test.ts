import { toDate } from '@/modules/shared/domain/date';

describe('toDate', () => {
  it('returns a valid Date instance unchanged', () => {
    const value = new Date('2026-07-18T12:00:00.000Z');

    expect(toDate(value)).toBe(value);
  });

  it('converts ISO strings and seconds or milliseconds timestamps', () => {
    const isoDate = '2026-07-18T12:00:00.000Z';
    const milliseconds = Date.parse(isoDate);

    expect(toDate(isoDate)?.toISOString()).toBe(isoDate);
    expect(toDate(milliseconds / 1_000)?.toISOString()).toBe(isoDate);
    expect(toDate(milliseconds)?.toISOString()).toBe(isoDate);
  });

  it('converts Firestore-like values through toDate', () => {
    const value = { toDate: () => new Date('2026-07-18T12:00:00.000Z') };

    expect(toDate(value)?.toISOString()).toBe('2026-07-18T12:00:00.000Z');
  });

  it('returns null for absent, invalid, or unsupported values', () => {
    expect(toDate(null)).toBeNull();
    expect(toDate('invalid date')).toBeNull();
    expect(toDate({ toDate: () => new Date('invalid date') })).toBeNull();
    expect(toDate({ value: '2026-07-18' })).toBeNull();
  });
});