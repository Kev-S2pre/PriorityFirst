/**
 * Recurring tasks: when a repeating task is completed, the next copy is created
 * with its deadline moved forward and its checklist reset.
 */

export const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Every weekday (Mon–Fri)' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' }
];

export function normalizeRecurrence(value) {
  return RECURRENCE_OPTIONS.some(o => o.value === value) ? value : 'none';
}

export function recurrenceLabel(value) {
  return RECURRENCE_OPTIONS.find(o => o.value === normalizeRecurrence(value))?.label || '';
}

const pad = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Next deadline date (YYYY-MM-DD) after dateStr for the given rule, or null for 'none' */
export function nextOccurrence(dateStr, rule) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || '')) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  switch (normalizeRecurrence(rule)) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      return toKey(date);
    case 'weekdays':
      do { date.setDate(date.getDate() + 1); } while (date.getDay() === 0 || date.getDay() === 6);
      return toKey(date);
    case 'weekly':
      date.setDate(date.getDate() + 7);
      return toKey(date);
    case 'monthly': {
      // Keep the day of the month, clamped to the last day of shorter months (Jan 31 → Feb 28)
      const lastDay = new Date(y, m + 1, 0).getDate();
      return toKey(new Date(y, m, Math.min(d, lastDay)));
    }
    default:
      return null;
  }
}

/** Fields for the next copy of a completed recurring task (without id/createdAt) */
export function buildNextOccurrence(task, today = new Date()) {
  const rule = normalizeRecurrence(task.recurrence);
  if (rule === 'none') return null;
  // Skip ahead past today so a late completion does not create an already-overdue copy
  let next = nextOccurrence(task.deadlineDate, rule);
  const todayKey = toKey(today);
  let guard = 0;
  while (next && next < todayKey && guard++ < 400) next = nextOccurrence(next, rule);
  if (!next) return null;
  return {
    ...task,
    deadlineDate: next,
    status: 'pending',
    completedAt: null,
    reminderAt: null,
    subtasks: (task.subtasks || []).map(s => ({ ...s, done: false }))
  };
}
