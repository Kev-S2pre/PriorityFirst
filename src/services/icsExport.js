/**
 * Calendar export: builds an .ics file (iCalendar, RFC 5545) that Google Calendar,
 * Outlook and Apple Calendar can import. Times are written as floating local times
 * so an 8:00 AM task stays 8:00 AM in the user's calendar.
 */
import { normalizeRecurrence } from './recurrence.js';
import { categoryLabel } from '../data/taskOptions.js';

const RRULES = {
  daily: 'FREQ=DAILY',
  weekdays: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
  weekly: 'FREQ=WEEKLY',
  monthly: 'FREQ=MONTHLY'
};

const pad = (n) => String(n).padStart(2, '0');

/** Escapes text per RFC 5545 (backslash, semicolon, comma, newline) */
export function escapeText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Folds lines longer than 75 octets, as the spec requires */
function fold(line) {
  const out = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = ' ' + rest.slice(74);
  }
  out.push(rest);
  return out.join('\r\n');
}

function localStamp(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = (timeStr || '23:59').split(':').map(Number);
  return `${y}${pad(m)}${pad(d)}T${pad(h)}${pad(min)}00`;
}

function shiftMinutes(dateStr, timeStr, minutes) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = (timeStr || '23:59').split(':').map(Number);
  const date = new Date(y, m - 1, d, h, min + minutes);
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`
  };
}

function utcStamp(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

/**
 * One VEVENT per task. A task with its own start/end time uses that slot; otherwise
 * the event ends at the deadline and lasts as long as the estimate (capped at 8 hours).
 * `slot` overrides the time (used for Plan My Day blocks).
 */
function taskEvent(task, { now, slot } = {}) {
  let start;
  let end;
  if (slot) {
    start = { date: slot.date, time: slot.startTime };
    end = { date: slot.date, time: slot.endTime };
  } else if (task.startTime && task.endTime && task.endTime > task.startTime) {
    start = { date: task.deadlineDate, time: task.startTime };
    end = { date: task.deadlineDate, time: task.endTime };
  } else {
    const minutes = Math.min(480, Math.max(15, Math.round((Number(task.estimatedHours) || 1) * 60)));
    end = { date: task.deadlineDate, time: task.deadlineTime || '23:59' };
    start = shiftMinutes(end.date, end.time, -minutes);
  }

  const details = [
    task.description,
    `Category: ${categoryLabel(task.category)} · Importance: ${task.importance || 'Medium'}`,
    slot ? `Deadline: ${task.deadlineDate} ${task.deadlineTime || '23:59'}` : '',
    (task.subtasks || []).length ? `Checklist:\n${task.subtasks.map(s => `${s.done ? '☑' : '☐'} ${s.text}`).join('\n')}` : '',
    task.notes
  ].filter(Boolean).join('\n\n');

  const lines = [
    'BEGIN:VEVENT',
    `UID:${task.id}${slot ? `-${slot.date}-${slot.startTime.replace(':', '')}` : ''}@priorityfirst`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${localStamp(start.date, start.time)}`,
    `DTEND:${localStamp(end.date, end.time)}`,
    `SUMMARY:${escapeText(task.title)}`,
    `DESCRIPTION:${escapeText(details)}`,
    `CATEGORIES:${escapeText(categoryLabel(task.category))}`,
    `STATUS:${task.status === 'completed' ? 'CANCELLED' : 'CONFIRMED'}`
  ];
  const rule = RRULES[normalizeRecurrence(task.recurrence)];
  if (rule && !slot) lines.push(`RRULE:${rule}`);
  // Remind 30 minutes before, like a typical calendar default
  lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(task.title)}`, 'TRIGGER:-PT30M', 'END:VALARM');
  lines.push('END:VEVENT');
  return lines;
}

/** Builds an .ics document. items: tasks, or { task, slot } for planned blocks */
export function buildIcs(items, { now = new Date(), name = 'PriorityFirst' } = {}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PriorityFirst//Task Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`
  ];
  items.forEach(item => {
    const { task, slot } = item.task ? item : { task: item, slot: null };
    if (!task?.deadlineDate) return;
    lines.push(...taskEvent(task, { now, slot }));
  });
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Starts a browser download of the calendar file */
export function downloadIcs(content, filename) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFilename(text) {
  return String(text || 'task').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'task';
}
