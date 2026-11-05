import { describe, it, expect } from 'vitest';
import { buildIcs, escapeText, safeFilename } from '../icsExport.js';

const NOW = new Date(Date.UTC(2026, 10, 4, 12, 0, 0));

const task = (overrides = {}) => ({
  id: 'task-1',
  title: 'Pay bills',
  description: '',
  category: 'responsibilities',
  deadlineDate: '2026-11-06',
  deadlineTime: '14:00',
  estimatedHours: 0.5,
  importance: 'High',
  status: 'pending',
  notes: '',
  ...overrides
});

describe('calendar export', () => {
  it('wraps events in a valid calendar with CRLF line endings', () => {
    const ics = buildIcs([task()], { now: NOW });
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0')).toBe(true);
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTAMP:20261104T120000Z');
  });

  it('ends a task without a time range at its deadline, lasting its estimate', () => {
    const ics = buildIcs([task()], { now: NOW });
    expect(ics).toContain('DTSTART:20261106T133000');
    expect(ics).toContain('DTEND:20261106T140000');
  });

  it('uses the task’s own start and end time when it has one', () => {
    const ics = buildIcs([task({ startTime: '09:00', endTime: '10:30' })], { now: NOW });
    expect(ics).toContain('DTSTART:20261106T090000');
    expect(ics).toContain('DTEND:20261106T103000');
  });

  it('adds a repeat rule for repeating tasks', () => {
    expect(buildIcs([task({ recurrence: 'weekdays' })], { now: NOW })).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
    expect(buildIcs([task({ recurrence: 'monthly' })], { now: NOW })).toContain('RRULE:FREQ=MONTHLY');
    expect(buildIcs([task()], { now: NOW })).not.toContain('RRULE');
  });

  it('exports Plan My Day blocks at their planned time', () => {
    const ics = buildIcs([{ task: task(), slot: { date: '2026-11-05', startTime: '08:00', endTime: '08:30' } }], { now: NOW });
    expect(ics).toContain('DTSTART:20261105T080000');
    expect(ics).toContain('UID:task-1-2026-11-05-0800@priorityfirst');
  });

  it('escapes special characters and folds long lines', () => {
    expect(escapeText('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne');
    const ics = buildIcs([task({ description: 'x'.repeat(200) })], { now: NOW });
    ics.split('\r\n').forEach(line => expect(line.length).toBeLessThanOrEqual(75));
  });

  it('makes safe file names', () => {
    expect(safeFilename('Pay Bills / Nov!')).toBe('pay-bills-nov');
    expect(safeFilename('')).toBe('task');
  });
});
