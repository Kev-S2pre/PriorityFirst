/**
 * Plan My Day — turns the ranked task list into a timed schedule for one day.
 * Deterministic: the same tasks, settings and clock always give the same plan.
 *
 * Rules
 * - Tasks with their own start/end time on that day are fixed events; planning fills the gaps.
 * - Other open tasks are placed in priority order (hard tasks get a small boost so they land earlier).
 * - A task due that day must finish before its due time; a task due later may be split across days.
 * - Total planned time never exceeds the daily workload limit, and short breaks separate tasks.
 */

export const DEFAULT_PLANNER = { dayStart: '08:00', dayEnd: '18:00', breakMinutes: 10 };

const MIN_CHUNK = 30; // never plan a slice shorter than 30 minutes unless it finishes the task

export function toMinutes(time) {
  if (!/^\d{2}:\d{2}$/.test(time || '')) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(total) {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(total)));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Free gaps inside [start, end] that are not covered by busy blocks */
function freeGaps(start, end, busy) {
  const gaps = [];
  let cursor = start;
  [...busy].sort((a, b) => a.start - b.start).forEach(b => {
    if (b.end <= cursor) return;
    if (b.start > cursor) gaps.push({ start: cursor, end: Math.min(b.start, end) });
    cursor = Math.max(cursor, b.end);
  });
  if (cursor < end) gaps.push({ start: cursor, end });
  return gaps.filter(g => g.end - g.start > 0);
}

/**
 * @param {object[]} rankedTasks tasks from prioritizeTasks (each with .priority)
 * @param {object} options { date: 'YYYY-MM-DD', now: Date, dayStart, dayEnd, breakMinutes, limitHours }
 */
export function planDay(rankedTasks, options = {}) {
  const now = options.now || new Date();
  const date = options.date || dateKey(now);
  const dayStart = toMinutes(options.dayStart) ?? toMinutes(DEFAULT_PLANNER.dayStart);
  const dayEnd = toMinutes(options.dayEnd) ?? toMinutes(DEFAULT_PLANNER.dayEnd);
  const breakMinutes = Math.max(0, Number(options.breakMinutes ?? DEFAULT_PLANNER.breakMinutes) || 0);
  const limitMinutes = Math.max(0, Number(options.limitHours) || 8) * 60;

  const isToday = date === dateKey(now);
  const isPast = date < dateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  // Start from the next quarter hour when planning today
  const windowStart = isToday ? Math.max(dayStart, Math.ceil(nowMinutes / 15) * 15) : dayStart;

  const open = (rankedTasks || []).filter(t => t.status !== 'completed');
  const blocks = [];
  const unscheduled = [];

  // 1. Fixed events: tasks with their own time range on this date
  const fixedIds = new Set();
  open.forEach(task => {
    const start = toMinutes(task.startTime);
    const end = toMinutes(task.endTime);
    if (task.deadlineDate === date && start !== null && end !== null && end > start) {
      fixedIds.add(task.id);
      blocks.push({ taskId: task.id, task, start, end, type: 'fixed', partial: false });
    }
  });

  if (isPast || windowStart >= dayEnd) {
    return summarize(blocks, unscheduled, { date, dayStart, dayEnd, limitMinutes, closed: true });
  }

  // 2. Candidates: open tasks without a fixed slot that are due on or after this date
  const candidates = open
    .filter(t => !fixedIds.has(t.id))
    .filter(t => !(toMinutes(t.startTime) !== null && toMinutes(t.endTime) !== null && t.deadlineDate > date))
    .filter(t => t.deadlineDate >= date || t.priority?.isOverdue)
    .map(t => ({
      task: t,
      remaining: Math.max(15, Math.round((Number(t.estimatedHours) || 1) * 60)),
      sortKey: (t.priority?.score || 0) + (Number(t.difficulty) >= 4 ? 5 : 0)
    }))
    .sort((a, b) => b.sortKey - a.sortKey || (a.task.priority?.diffHours ?? 0) - (b.task.priority?.diffHours ?? 0));

  let used = blocks.reduce((sum, b) => sum + (b.end - b.start), 0);
  const busy = blocks.map(b => ({ start: b.start, end: b.end }));

  for (const item of candidates) {
    const { task } = item;
    const dueToday = task.deadlineDate === date;
    const dueMinutes = dueToday ? (toMinutes(task.deadlineTime) ?? dayEnd) : dayEnd;
    const latestEnd = Math.min(dayEnd, dueMinutes);
    let placed = 0;


    const roomIn = (gap) => Math.min(gap.end - gap.start, limitMinutes - used);
    const gaps = freeGaps(windowStart, latestEnd, busy);
    // Prefer the earliest gap that fits the whole task; otherwise split, but only for
    // tasks due later or already overdue (a task due today must not be left half-done)
    let gap = gaps.find(g => roomIn(g) >= item.remaining);
    if (!gap && (!dueToday || task.priority?.isOverdue)) {
      gap = gaps.reduce((best, g) => (!best || roomIn(g) > roomIn(best) ? g : best), null);
      if (gap && roomIn(gap) < MIN_CHUNK) gap = null;
    }
    if (gap && used < limitMinutes) {
      const length = Math.min(roomIn(gap), item.remaining);
      blocks.push({ taskId: task.id, task, start: gap.start, end: gap.start + length, type: 'planned', partial: length < item.remaining });
      busy.push({ start: gap.start, end: gap.start + length + breakMinutes });
      used += length;
      placed = length;
    }

    if (placed === 0) {
      const reason = used >= limitMinutes
        ? 'Daily workload limit reached'
        : dueToday ? 'Not enough free time before its deadline' : 'No free time left today';
      unscheduled.push({ task, reason, minutes: item.remaining });
    }
  }

  return summarize(blocks, unscheduled, { date, dayStart, dayEnd, limitMinutes, closed: false });
}

function summarize(blocks, unscheduled, { date, dayStart, dayEnd, limitMinutes, closed }) {
  const sorted = blocks.sort((a, b) => a.start - b.start).map(b => ({
    ...b,
    startTime: fromMinutes(b.start),
    endTime: fromMinutes(b.end),
    minutes: b.end - b.start
  }));
  const plannedMinutes = sorted.reduce((sum, b) => sum + b.minutes, 0);
  return {
    date,
    blocks: sorted,
    unscheduled,
    plannedMinutes,
    limitMinutes,
    windowMinutes: Math.max(0, dayEnd - dayStart),
    closed
  };
}
