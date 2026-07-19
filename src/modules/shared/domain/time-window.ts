export const TIME_WINDOWS = [7, 14, 30, 60, 90] as const;

export type TimeWindow = (typeof TIME_WINDOWS)[number];

export function isTimeWindow(value: number): value is TimeWindow {
  return TIME_WINDOWS.includes(value as TimeWindow);
}