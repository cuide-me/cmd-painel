import { isTimeWindow, TIME_WINDOWS } from '@/modules/shared/domain/time-window';

describe('time windows', () => {
  it('exposes the supported dashboard windows', () => {
    expect(TIME_WINDOWS).toEqual([7, 14, 30, 60, 90]);
  });

  it('accepts only supported window values', () => {
    expect(isTimeWindow(7)).toBe(true);
    expect(isTimeWindow(30)).toBe(true);
    expect(isTimeWindow(90)).toBe(true);
    expect(isTimeWindow(1)).toBe(false);
    expect(isTimeWindow(31)).toBe(false);
  });
});