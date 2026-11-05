import { describe, it, expect } from 'vitest';
import {
  sessionMinutes,
  trackedMinutes,
  startTimerUpdates,
  stopTimerUpdates,
  formatMinutes,
  estimateAccuracy,
  describeAccuracy
} from '../timeTracking.js';

const NOW = new Date(Date.UTC(2026, 10, 4, 12, 0, 0));
const minutesAgo = (m) => new Date(NOW.getTime() - m * 60000).toISOString();

describe('time tracking', () => {
  it('counts the running session on top of logged minutes', () => {
    const task = { actualMinutes: 30, timerStartedAt: minutesAgo(15) };
    expect(sessionMinutes(task, NOW)).toBe(15);
    expect(trackedMinutes(task, NOW)).toBe(45);
    expect(trackedMinutes({ actualMinutes: 10 }, NOW)).toBe(10);
  });

  it('caps a timer left running for days', () => {
    expect(sessionMinutes({ timerStartedAt: minutesAgo(3 * 24 * 60) }, NOW)).toBe(16 * 60);
  });

  it('starts and stops, banking the session', () => {
    expect(startTimerUpdates({}, NOW)).toEqual({ timerStartedAt: NOW.toISOString() });
    expect(startTimerUpdates({ timerStartedAt: minutesAgo(5) }, NOW)).toEqual({});
    expect(stopTimerUpdates({ actualMinutes: 20, timerStartedAt: minutesAgo(10) }, NOW)).toEqual({ actualMinutes: 30, timerStartedAt: null });
    expect(stopTimerUpdates({ actualMinutes: 20 }, NOW)).toEqual({});
  });

  it('formats minutes', () => {
    expect(formatMinutes(0)).toBe('0 min');
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(60)).toBe('1 hr');
    expect(formatMinutes(125)).toBe('2 hrs 5 min');
  });

  it('compares actual time with estimates for completed tracked tasks', () => {
    const result = estimateAccuracy([
      { status: 'completed', estimatedHours: 1, actualMinutes: 90 },
      { status: 'completed', estimatedHours: 2, actualMinutes: 150 },
      { status: 'pending', estimatedHours: 1, actualMinutes: 500 },
      { status: 'completed', estimatedHours: 1, actualMinutes: 0 }
    ]);
    expect(result.count).toBe(2);
    expect(result.ratio).toBeCloseTo(240 / 180);
    expect(describeAccuracy(result)).toMatch(/33% longer/);
  });

  it('describes accurate, fast and empty cases', () => {
    expect(describeAccuracy({ count: 0, ratio: null })).toMatch(/timer/);
    expect(describeAccuracy({ count: 3, ratio: 1.05 })).toMatch(/spot on/);
    expect(describeAccuracy({ count: 3, ratio: 0.7 })).toMatch(/30% faster/);
  });
});
