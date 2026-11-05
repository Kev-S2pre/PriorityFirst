import { describe, it, expect } from 'vitest';
import { planDay, toMinutes, fromMinutes } from '../dayPlanner.js';
import { nextOccurrence, buildNextOccurrence, normalizeRecurrence } from '../recurrence.js';

// Wed 2026-11-04, 08:00 local time
const MORNING = new Date(2026, 10, 4, 8, 0, 0);
const DAY = '2026-11-04';

const ranked = (overrides) => ({
  id: overrides.id,
  title: overrides.id,
  status: 'pending',
  deadlineDate: '2026-11-06',
  deadlineTime: '23:59',
  difficulty: 3,
  estimatedHours: 1,
  priority: { score: 50, diffHours: 48, isOverdue: false },
  ...overrides
});

const opts = (extra = {}) => ({ date: DAY, now: MORNING, dayStart: '08:00', dayEnd: '18:00', breakMinutes: 10, limitHours: 8, ...extra });

describe('time helpers', () => {
  it('converts between HH:MM and minutes', () => {
    expect(toMinutes('09:30')).toBe(570);
    expect(fromMinutes(570)).toBe('09:30');
    expect(toMinutes('bad')).toBeNull();
  });
});

describe('planDay', () => {
  it('places higher-priority tasks first, separated by breaks', () => {
    const plan = planDay([
      ranked({ id: 'low', priority: { score: 30, diffHours: 48 } }),
      ranked({ id: 'high', priority: { score: 90, diffHours: 48 } })
    ], opts());
    expect(plan.blocks.map(b => b.taskId)).toEqual(['high', 'low']);
    expect(plan.blocks[0].startTime).toBe('08:00');
    expect(plan.blocks[0].endTime).toBe('09:00');
    expect(plan.blocks[1].startTime).toBe('09:10');
  });

  it('keeps fixed events in place and plans around them', () => {
    const plan = planDay([
      ranked({ id: 'meeting', deadlineDate: DAY, startTime: '08:30', endTime: '09:30', estimatedHours: 1 }),
      ranked({ id: 'work', estimatedHours: 1 })
    ], opts());
    const meeting = plan.blocks.find(b => b.taskId === 'meeting');
    const work = plan.blocks.find(b => b.taskId === 'work');
    expect(meeting.type).toBe('fixed');
    expect(meeting.startTime).toBe('08:30');
    expect(toMinutes(work.startTime)).toBeGreaterThanOrEqual(toMinutes('09:30'));
  });

  it('never plans past the daily workload limit', () => {
    const tasks = ['a', 'b', 'c'].map(id => ranked({ id, estimatedHours: 2 }));
    const plan = planDay(tasks, opts({ limitHours: 3 }));
    expect(plan.plannedMinutes).toBeLessThanOrEqual(180);
    expect(plan.unscheduled.length).toBeGreaterThan(0);
  });

  it('finishes a task due today before its due time, or reports it', () => {
    const fits = planDay([ranked({ id: 'due', deadlineDate: DAY, deadlineTime: '10:00', estimatedHours: 1.5 })], opts());
    expect(toMinutes(fits.blocks[0].endTime)).toBeLessThanOrEqual(600);

    const tooLong = planDay([ranked({ id: 'due', deadlineDate: DAY, deadlineTime: '09:00', estimatedHours: 3 })], opts());
    expect(tooLong.blocks).toHaveLength(0);
    expect(tooLong.unscheduled[0].reason).toMatch(/deadline/i);
  });

  it('splits a long task due later into a partial slice', () => {
    const plan = planDay([ranked({ id: 'big', estimatedHours: 12 })], opts());
    expect(plan.blocks[0].partial).toBe(true);
    expect(plan.blocks[0].minutes).toBe(480);
  });

  it('starts from the next quarter hour when planning today', () => {
    const plan = planDay([ranked({ id: 'x' })], opts({ now: new Date(2026, 10, 4, 13, 5) }));
    expect(plan.blocks[0].startTime).toBe('13:15');
  });

  it('skips completed tasks and returns nothing for past days', () => {
    expect(planDay([ranked({ id: 'done', status: 'completed' })], opts()).blocks).toHaveLength(0);
    expect(planDay([ranked({ id: 'x' })], opts({ date: '2026-11-01' })).closed).toBe(true);
  });
});

describe('recurrence', () => {
  it('moves the deadline forward by the rule', () => {
    expect(nextOccurrence('2026-11-04', 'daily')).toBe('2026-11-05');
    expect(nextOccurrence('2026-11-04', 'weekly')).toBe('2026-11-11');
    expect(nextOccurrence('2026-11-06', 'weekdays')).toBe('2026-11-09'); // Fri → Mon
    expect(nextOccurrence('2026-01-31', 'monthly')).toBe('2026-02-28');
    expect(nextOccurrence('2026-11-04', 'none')).toBeNull();
  });

  it('creates a fresh pending copy with the checklist reset', () => {
    const next = buildNextOccurrence({
      title: 'Pay bills', deadlineDate: '2026-11-04', recurrence: 'monthly', status: 'completed',
      completedAt: 'x', subtasks: [{ id: 's1', text: 'Electricity', done: true }]
    }, new Date(2026, 10, 4));
    expect(next.deadlineDate).toBe('2026-12-04');
    expect(next.status).toBe('pending');
    expect(next.completedAt).toBeNull();
    expect(next.subtasks[0].done).toBe(false);
  });

  it('skips past dates when a recurring task is completed late', () => {
    const next = buildNextOccurrence({ deadlineDate: '2026-10-01', recurrence: 'weekly' }, new Date(2026, 10, 4));
    expect(next.deadlineDate >= '2026-11-04').toBe(true);
  });

  it('treats unknown rules as not repeating', () => {
    expect(normalizeRecurrence('yearly')).toBe('none');
    expect(buildNextOccurrence({ deadlineDate: '2026-11-04', recurrence: 'none' })).toBeNull();
  });
});
