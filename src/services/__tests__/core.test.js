import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateTaskPriority, prioritizeTasks } from '../prioritizationEngine.js';
import { validateName, validateEmail, validateTaskTitle } from '../validation.js';
import { checkPassword } from '../passwordPolicy.js';
import {
  normalizeCategory,
  categoryLabel,
  categoryClassName,
  durationFromTimes,
  formatDuration,
  formatDeadline,
  DEFAULT_CATEGORY
} from '../../data/taskOptions.js';

// Fixed "now" so deadlines are predictable: Wed 2026-11-04 12:00 local time
const NOW = new Date(2026, 10, 4, 12, 0, 0);

const task = (overrides = {}) => ({
  id: 't1',
  title: 'Task',
  deadlineDate: '2026-11-10',
  deadlineTime: '12:00',
  difficulty: 3,
  estimatedHours: 1,
  importance: 'Medium',
  status: 'pending',
  ...overrides
});

describe('prioritization engine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('gives overdue tasks maximum urgency and workload pressure', () => {
    const p = calculateTaskPriority(task({ deadlineDate: '2026-11-03' }));
    expect(p.isOverdue).toBe(true);
    expect(p.urgencyScore).toBe(100);
    expect(p.workloadScore).toBe(100);
  });

  it('scores a nearer deadline as more urgent', () => {
    const soon = calculateTaskPriority(task({ deadlineDate: '2026-11-04', deadlineTime: '15:00' }));
    const later = calculateTaskPriority(task({ deadlineDate: '2026-11-20' }));
    expect(soon.urgencyScore).toBeGreaterThan(later.urgencyScore);
    expect(soon.score).toBeGreaterThan(later.score);
  });

  it('maps importance and difficulty to fixed subscores', () => {
    const p = calculateTaskPriority(task({ importance: 'Critical', difficulty: 5 }));
    expect(p.importanceScore).toBe(100);
    expect(p.difficultyScore).toBe(100);
    expect(calculateTaskPriority(task({ importance: 'Low', difficulty: 1 })).importanceScore).toBe(25);
  });

  it('keeps every score between 0 and 100', () => {
    const p = calculateTaskPriority(task({ deadlineDate: '2026-01-01', importance: 'Critical', difficulty: 5, estimatedHours: 40 }));
    expect(p.score).toBeLessThanOrEqual(100);
    expect(p.score).toBeGreaterThanOrEqual(0);
  });

  it('gives completed tasks a score of 0', () => {
    expect(calculateTaskPriority(task({ status: 'completed' })).score).toBe(0);
  });

  it('respects a weight set to 0 instead of falling back to the default', () => {
    const onlyImportance = { urgency: 0, importance: 1, workload: 0, difficulty: 0 };
    const p = calculateTaskPriority(task({ importance: 'High' }), onlyImportance);
    expect(p.weightsUsed.urgency).toBe(0);
    expect(p.score).toBe(75);
  });

  it('normalizes weights that do not add up to 1', () => {
    const p = calculateTaskPriority(task(), { urgency: 2, importance: 2, workload: 2, difficulty: 2 });
    expect(p.weightsUsed.urgency).toBeCloseTo(0.25);
  });

  it('ranks active tasks by score and puts completed tasks last', () => {
    const ranked = prioritizeTasks([
      task({ id: 'later', deadlineDate: '2026-11-25' }),
      task({ id: 'done', status: 'completed' }),
      task({ id: 'urgent', deadlineDate: '2026-11-04', deadlineTime: '14:00', importance: 'Critical' })
    ]);
    expect(ranked.map(t => t.id)).toEqual(['urgent', 'later', 'done']);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[2].rank).toBeNull();
  });

  it('returns an empty list for invalid input', () => {
    expect(prioritizeTasks(null)).toEqual([]);
  });
});

describe('task categories', () => {
  it('keeps current categories as they are', () => {
    expect(normalizeCategory('work / professional')).toBe('work / professional');
    expect(normalizeCategory('Errands')).toBe('errands');
  });

  it('maps old student-only categories onto general ones', () => {
    expect(normalizeCategory('assignment')).toBe('school / studies');
    expect(normalizeCategory('laboratory activity')).toBe('school / studies');
    expect(normalizeCategory('personal responsibility')).toBe('responsibilities');
  });

  it('falls back to Other for unknown or missing categories', () => {
    expect(normalizeCategory('something else')).toBe(DEFAULT_CATEGORY);
    expect(normalizeCategory(undefined)).toBe(DEFAULT_CATEGORY);
    expect(categoryLabel(null)).toBe('Other');
  });

  it('builds the badge class from the first word', () => {
    expect(categoryClassName('training / exercise')).toBe('category-training');
    expect(categoryClassName('report')).toBe('category-school');
  });
});

describe('time helpers', () => {
  it('computes the duration between two times', () => {
    expect(durationFromTimes('09:00', '10:30')).toBe(1.5);
    expect(durationFromTimes('10:00', '09:00')).toBeNull();
    expect(durationFromTimes('9am', '10:00')).toBeNull();
  });

  it('formats deadlines relative to today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(formatDeadline('2026-11-04', '17:00')).toBe('Today, 5:00 PM');
    expect(formatDeadline('2026-11-05', '09:30')).toBe('Tomorrow, 9:30 AM');
    expect(formatDeadline('2026-11-03')).toBe('Yesterday, 11:59 PM');
    expect(formatDeadline('not a date')).toBe('');
    vi.useRealTimers();
  });

  it('formats durations in hours and minutes', () => {
    expect(formatDuration(1.5)).toBe('1 hr 30 min');
    expect(formatDuration(2)).toBe('2 hrs');
    expect(formatDuration(0)).toBe('0 min');
  });
});

describe('validation', () => {
  it('accepts real names and rejects junk', () => {
    expect(validateName("Ma. Clara O'Neil-Santos")).toBe('');
    expect(validateName('Juan Dela Cruz Jr.')).toBe('');
    expect(validateName('J0hn')).not.toBe('');
    expect(validateName('aaaaaaa')).not.toBe('');
  });

  it('accepts valid emails and rejects malformed ones', () => {
    expect(validateEmail('you@example.com')).toBe('');
    expect(validateEmail('Faculty of Engineering')).not.toBe('');
    expect(validateEmail('a..b@example.com')).not.toBe('');
  });

  it('requires a meaningful task title', () => {
    expect(validateTaskTitle('Pay bills')).toBe('');
    expect(validateTaskTitle('!!!')).not.toBe('');
  });

  it('requires a strong password', () => {
    expect(checkPassword('Str0ng!Pass', { email: 'you@example.com', name: 'Maria' }).isValid).toBe(true);
    expect(checkPassword('password', {}).isValid).toBe(false);
  });
});
