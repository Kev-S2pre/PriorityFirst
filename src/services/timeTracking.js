/**
 * Time tracking: a start/stop timer per task records how long it actually took,
 * so estimates can be compared with reality.
 *
 * task.actualMinutes   whole minutes logged so far
 * task.timerStartedAt  ISO time the running timer started, or null
 */

const MAX_SESSION_MINUTES = 16 * 60; // a timer left running overnight counts at most 16 hours

export function sessionMinutes(task, now = new Date()) {
  if (!task?.timerStartedAt) return 0;
  const started = new Date(task.timerStartedAt).getTime();
  if (Number.isNaN(started)) return 0;
  return Math.min(MAX_SESSION_MINUTES, Math.max(0, Math.round((now.getTime() - started) / 60000)));
}

/** Logged minutes plus the running session */
export function trackedMinutes(task, now = new Date()) {
  return Math.max(0, Math.round(Number(task?.actualMinutes) || 0)) + sessionMinutes(task, now);
}

export function isTimerRunning(task) {
  return !!task?.timerStartedAt;
}

/** Updates that stop the timer and bank the running session */
export function stopTimerUpdates(task, now = new Date()) {
  if (!isTimerRunning(task)) return {};
  return { actualMinutes: trackedMinutes(task, now), timerStartedAt: null };
}

/** Updates that start the timer (no-op when it is already running) */
export function startTimerUpdates(task, now = new Date()) {
  if (isTimerRunning(task)) return {};
  return { timerStartedAt: now.toISOString() };
}

/** "1 hr 5 min", "12 min", "0 min" */
export function formatMinutes(minutes) {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (!h) return `${rest} min`;
  return rest ? `${h} hr${h === 1 ? '' : 's'} ${rest} min` : `${h} hr${h === 1 ? '' : 's'}`;
}

/**
 * How actual time compares with estimates across completed, tracked tasks.
 * ratio > 1 means tasks take longer than estimated.
 */
export function estimateAccuracy(tasks) {
  const tracked = (tasks || []).filter(t =>
    t.status === 'completed' && Number(t.actualMinutes) > 0 && Number(t.estimatedHours) > 0
  );
  if (tracked.length === 0) return { count: 0, ratio: null, estimatedMinutes: 0, actualMinutes: 0 };
  const estimatedMinutes = tracked.reduce((sum, t) => sum + Number(t.estimatedHours) * 60, 0);
  const actualMinutes = tracked.reduce((sum, t) => sum + Number(t.actualMinutes), 0);
  return {
    count: tracked.length,
    ratio: actualMinutes / estimatedMinutes,
    estimatedMinutes: Math.round(estimatedMinutes),
    actualMinutes: Math.round(actualMinutes)
  };
}

/** Plain-English summary of an estimateAccuracy result */
export function describeAccuracy({ count, ratio }) {
  if (!count) return 'Use the timer on a few tasks to see how your estimates compare with reality.';
  const pct = Math.round(Math.abs(ratio - 1) * 100);
  if (pct <= 10) return `Your estimates are spot on — within ${pct}% of the actual time.`;
  if (ratio > 1) return `Tasks take you about ${pct}% longer than estimated. Try adding extra time when you plan.`;
  return `You finish about ${pct}% faster than estimated. You can plan a little less time per task.`;
}
